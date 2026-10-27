"""Lint a MAI storyboard against schemas/storyboard.schema.json and RULES.md.

    python3 video-style/tools/lint_storyboard.py storyboards/x.yaml
    python3 video-style/tools/lint_storyboard.py storyboards/x.yaml --emit video-style/kit/src/storyboards/x.json

Each finding carries the RULES.md id it enforces. Exit code 1 if any ERROR.
--emit writes the compiled JSON (frame-accurate timings added) that the kit renders.
"""
import json
import math
import pathlib
import re
import subprocess
import sys

import jsonschema
import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
TOK = lambda name: json.loads((ROOT / "tokens" / f"{name}.tokens.json").read_text())
MOTION = TOK("motion")["motion"]
TYPE = TOK("typography")["font"]["rules"]
AUDIO = TOK("audio")["audio"]
COLOR_RULES = TOK("color")["color"]["rules"]
NEUTRAL_ROLES = {"ink", "ink-soft", "caption-base", "guide"}
STOP = set("a an the of to in is it you your i and or but so that this be are was do".split())
HEX = re.compile(r"#[0-9a-fA-F]{3,8}\b")


def words(s):
    return re.findall(r"[\w'’]+", s.lower())


def stem(w):
    """Crude English stem so an echo of 'pull' matches 'pulls' / 'pulling'."""
    return re.sub(r"(ing|ed|es|s)$", "", w) if len(w) > 4 else w


def lint(board, text):
    out = []
    err = lambda rule, msg: out.append(("ERROR", rule, msg))
    warn = lambda rule, msg: out.append(("WARN", rule, msg))

    try:
        jsonschema.validate(board, json.loads((ROOT / "schemas" / "storyboard.schema.json").read_text()))
    except jsonschema.ValidationError as e:
        err("S0", f"schema: {'/'.join(map(str, e.absolute_path))}: {e.message}")
        return out

    if HEX.search(text):
        err("K4", f"raw colour {HEX.search(text).group(0)} found: use a role (ink, thread, emph, concept-N)")

    meta, beats = board["meta"], board["beats"]
    vo_of = lambda s: s.get("vo") or " ".join(l["text"] for l in s.get("lines") or [])
    fps = meta["fps"]
    f30 = lambda frames: frames * fps / 30
    scenes = [(b, s) for b in beats for s in b["scenes"]]
    total = sum(s["duration"] for _, s in scenes)

    # N1 narrative grammar
    types = [b["type"] for b in beats]
    if types[0] != "HOOK":
        err("N1", f"first beat must be HOOK, got {types[0]}")
    if types[-1] != "RETURN":
        err("N1", f"last beat must be RETURN, got {types[-1]}")
    if types.count("TURN") != 1:
        err("N1", f"exactly one TURN beat required, found {types.count('TURN')}")
    if not {"DEFINE", "LADDER"} & set(types):
        err("N1", "need at least one DEFINE or LADDER beat")
    if "RULE" not in types:
        warn("N1", "no RULE beat: the viewer leaves without a one-line takeaway")

    # N2 ring structure
    hook_scenes = {s["id"]: s for b, s in scenes if b["type"] == "HOOK"}
    ret = [s for b, s in scenes if b["type"] == "RETURN"]
    if ret:
        last = ret[-1]
        if last.get("echoes") not in hook_scenes:
            err("N2", f"RETURN scene '{last['id']}' must set echoes: <HOOK scene id>")
        else:
            h = hook_scenes[last["echoes"]]
            hw = set(words(vo_of(h) + " " + " ".join(c["text"] for c in h.get("captions", [])))) - STOP
            rw = set(words(vo_of(last) + " " + " ".join(c["text"] for c in last.get("captions", [])))) - STOP
            if not {stem(w) for w in hw} & {stem(w) for w in rw}:
                warn("N2", f"RETURN '{last['id']}' shares no content word with HOOK '{h['id']}'; the callback may not land")
        if scenes[-1][1]["transition_out"]["type"] != "end-loop":
            warn("N2", "last scene should use transition_out: end-loop so the last frame loops into the first")

    # G* dialogue (two voices: a guide who leads, a learner who asks)
    dlg = meta.get("dialogue")
    if dlg:
        D = AUDIO["dialogue"]
        spk = {x["id"]: x for x in dlg["speakers"]}
        roles = sorted(x["role"] for x in dlg["speakers"])
        if roles != ["guide", "learner"]:
            err("G1", f"dialogue needs exactly one guide and one learner, got {roles}")
        role_of = lambda sid: spk.get(sid, {}).get("role")
        all_lines = [(b, s, l) for b, s in scenes for l in s.get("lines") or []]
        for b, s, l in all_lines:
            if l["speaker"] not in spk:
                err("G1", f"{s['id']}: line by unknown speaker '{l['speaker']}'")
            n = len(words(l["text"]))
            lim = D["guide-line-max-words"] if role_of(l["speaker"]) == "guide" else D["learner-line-max-words"]
            if n > lim:
                warn("G3", f"{s['id']}: {role_of(l['speaker'])} line has {n} words (max {lim}): '{l['text'][:40]}…'")
            if "at" not in l:
                err("G0", f"{s['id']}: lines are not timed; run tools/dialogue.py and lint the .timed.yaml")
        gw = sum(len(words(l["text"])) for _, _, l in all_lines if role_of(l["speaker"]) == "guide")
        tw = sum(len(words(l["text"])) for _, _, l in all_lines) or 1
        if not D["guide-share"]["min"] <= gw / tw <= D["guide-share"]["max"]:
            warn("G2", f"guide speaks {gw / tw:.0%} of words; the guide should lead ({D['guide-share']['min']:.0%}-{D['guide-share']['max']:.0%})")
        hook_lines = [l for b, s, l in all_lines if b["type"] == "HOOK"]
        asker = "learner" if dlg["mode"] == "curious" else "guide"
        if not any(role_of(l["speaker"]) == asker and l["text"].rstrip().endswith("?") for l in hook_lines):
            err("G4", f"{dlg['mode']} mode: the HOOK must contain a question from the {asker}")
        if not any(role_of(l["speaker"]) == "learner" for b, s, l in all_lines if b["type"] == "RULE"):
            warn("G5", "the learner should state the RULE in their own words (the guide confirms)")
        run, prev = 0, None
        for b, s, l in all_lines:
            run = run + 1 if l["speaker"] == prev else 1
            prev = l["speaker"]
            if run > D["max-consecutive-same-speaker"]:
                warn("G6", f"{s['id']}: {run} lines in a row by '{l['speaker']}': a conversation, not a lecture")
        for b, s in scenes:
            for c in s.get("captions", []):
                if s.get("lines") and c.get("speaker") not in spk:
                    err("G7", f"{s['id']}: caption '{c['text']}' has no valid speaker")
                elif s.get("lines"):
                    said = " ".join(words(" ".join(l["text"] for l in s["lines"] if l["speaker"] == c["speaker"])))
                    if " ".join(words(c["text"])) not in said:
                        warn("G7", f"{s['id']}: caption '{c['text']}' is not verbatim from {c['speaker']}'s lines")
            for who in (s.get("cast") or {}):
                if who not in spk:
                    err("G1", f"{s['id']}: cast entry '{who}' is not a declared speaker")

    # N3 voice pace
    vo_words = sum(len(words(vo_of(s))) for _, s in scenes)
    wpm = vo_words / total * 60 if total else 0
    rng = AUDIO["voice"][f"wpm-{meta['voice']['register']}"]
    if wpm > AUDIO["voice"]["wpm-hard-max"]:
        err("N3", f"VO pace {wpm:.0f} wpm exceeds hard max {AUDIO['voice']['wpm-hard-max']}")
    elif not rng["min"] <= wpm <= rng["max"]:
        warn("N3", f"VO pace {wpm:.0f} wpm outside {meta['voice']['register']} range {rng['min']}-{rng['max']}")

    # N4 hook speed
    first = scenes[0][1]
    max_first = MOTION["duration"]["hook-first-change-max"]["$value"] / 30
    if first.get("first_change", 0) > max_first:
        err("N4", f"first visible change at {first['first_change']}s; must be ≤ {max_first:.2f}s")

    # M1 motif presence
    present = sum(s["duration"] for _, s in scenes if s["motif"]["state"] != "absent")
    if total and present / total < 0.8:
        err("M1", f"motif visible for {present / total:.0%} of runtime; needs ≥ 80%")
    if not board["motif"]["asset"].startswith("motif."):
        err("M1", "motif.asset must be a motif.* asset")

    # K1 concepts
    concepts = board["concepts"]
    roles = [c["role"] for c in concepts]
    if len(set(roles)) != len(roles):
        err("K1", "two concepts share a role; each concept owns one colour for the whole video")
    if len(concepts) > COLOR_RULES["max-concept-roles-per-video"]["$value"]:
        err("K1", "more than 5 concepts")
    declared = set(roles)

    cuts = 0
    ids = set()
    elem_ids_by_scene = []
    for i, (b, s) in enumerate(scenes):
        sid = s["id"]
        if sid in ids:
            err("S1", f"duplicate scene id {sid}")
        ids.add(sid)
        d = s["duration"]
        lo = MOTION["duration"]["scene-min"]["$value"] / 30
        hi = MOTION["duration"]["scene-max-dialogue" if s.get("lines") else "scene-max"]["$value"] / 30
        if not lo <= d <= hi:
            (err if d < lo else warn)("T1", f"{sid}: duration {d}s outside {lo:.1f}-{hi:.1f}s")
        tr = s["transition_out"]
        if tr["type"] == "cut":
            cuts += 1
        el_ids = {e["id"] for e in s.get("elements", [])}
        elem_ids_by_scene.append(el_ids)
        if tr["type"] in ("morph", "zoom-through"):
            if tr.get("target") not in el_ids:
                err("T4", f"{sid}: {tr['type']} needs target = an element id in this scene")
        if s["layout"] == "editorial-grid" and meta["mode"] == "paper" and s.get("mode") == "night":
            warn("L1", f"{sid}: editorial grid in night mode loses its guides")
        if s.get("mode") == "night" and meta["mode"] == "paper" and b["type"] != "TURN":
            warn("L1", f"{sid}: night mode outside the TURN beat dilutes the mode switch")

        # captions
        thread_words = 0
        accents = set()
        prev_end = -1
        hold = MOTION["duration"]["caption-hold-min"]["$value"] / 30
        for c in s.get("captions", []):
            w = c["text"].split()
            if len(w) > TYPE["caption-max-words"]["$value"]:
                err("C1", f"{sid}: caption '{c['text']}' has {len(w)} words (max 4)")
            if len(c["text"]) > TYPE["caption-max-chars"]["$value"]:
                err("C1", f"{sid}: caption '{c['text']}' is {len(c['text'])} chars (max 28)")
            if c["until"] - c["at"] < hold - 0.005:
                err("C2", f"{sid}: caption '{c['text']}' held {c['until'] - c['at']:.2f}s (min {hold:.2f}s)")
            if c["until"] > d + 1e-6:
                err("C3", f"{sid}: caption '{c['text']}' ends after the scene")
            if c["at"] < prev_end - 1e-6:
                err("C4", f"{sid}: caption '{c['text']}' overlaps the previous caption")
            prev_end = c["until"]
            for e in c.get("emph", []):
                if e["word"].lower().strip(".,?!") not in [x.lower().strip(".,?!") for x in w]:
                    err("C5", f"{sid}: emph word '{e['word']}' not in caption '{c['text']}'")
                if e["role"] == "thread":
                    thread_words += 1
                elif e["role"].startswith("concept-") and e["role"] not in declared:
                    err("K2", f"{sid}: emph role {e['role']} not declared in concepts")
                if e["role"] not in NEUTRAL_ROLES:
                    accents.add(e["role"])
        for e in s.get("elements", []):
            if e.get("role") and e["role"] not in NEUTRAL_ROLES:
                accents.add(e["role"])
        if thread_words > COLOR_RULES["thread-words-per-scene-max"]["$value"]:
            err("M2", f"{sid}: {thread_words} thread-coloured words; max 1 per scene")
        if len(accents - {"thread"}) > COLOR_RULES["max-accent-roles-per-scene"]["$value"]:
            err("K3", f"{sid}: {len(accents - {'thread'})} accent roles ({', '.join(sorted(accents))}); max 3")
        if vo_of(s).strip() and not s.get("captions"):
            warn("C6", f"{sid}: VO without captions: most viewers watch muted")

    minutes = max(total / 60, 1e-9)
    if cuts / minutes > 3 and cuts > 1:
        err("T2", f"{cuts} hard cuts in {total:.1f}s ({cuts / minutes:.1f}/min); max 3/min. Use morph/carry/push")

    # T4 morph continuity: target must reappear in the next scene
    for i, (b, s) in enumerate(scenes[:-1]):
        tr = s["transition_out"]
        if tr["type"] == "morph" and tr.get("target") and tr["target"] not in elem_ids_by_scene[i + 1]:
            warn("T4", f"{s['id']}: morph target '{tr['target']}' does not exist in the next scene, so nothing to morph into")
    return out, {"total_s": round(total, 2), "wpm": round(wpm), "scenes": len(scenes), "cuts": cuts,
                 "motif_presence": round(present / total, 2) if total else 0}


def compile_board(board):
    fps = board["meta"]["fps"]
    t = 0
    for b in board["beats"]:
        for s in b["scenes"]:
            s["from"] = t
            s["frames"] = int(round(s["duration"] * fps))
            s["beat"] = b["type"]
            t += s["frames"]
    board["meta"]["total_frames"] = t
    return board


def main(argv):
    path = pathlib.Path(argv[0])
    text = path.read_text()
    board = yaml.safe_load(text)
    res = lint(board, text)
    findings, stats = res if isinstance(res, tuple) else (res, {})
    for level, rule, msg in findings:
        print(f"{level:5} [{rule}] {msg}")
    lock = subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "asset_lock.py"), "--check", str(path)], capture_output=True, text=True)
    print(lock.stdout.strip())
    errors = sum(1 for f in findings if f[0] == "ERROR") + (lock.returncode != 0)
    print(f"{path.name}: {errors} error(s), {sum(1 for f in findings if f[0] == 'WARN')} warning(s) {json.dumps(stats)}")
    if "--emit" in argv and not errors:
        out = pathlib.Path(argv[argv.index("--emit") + 1])
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(compile_board(board), indent=1, ensure_ascii=False) + "\n")
        print(f"emitted {out}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
