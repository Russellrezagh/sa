"""Turn a dialogue storyboard into voiced, timed captions (guide + learner).

    pip install piper-tts pyloudnorm soundfile pyyaml
    python3 -I video-style/tools/dialogue.py video-style/storyboards/<id>.yaml
    → assets/vo/<id>/lines/<speaker>-<hash>.wav   one frozen WAV per line (generated once, then reused)
    → assets/vo/<id>/dialogue.wav + asset.json    the mixed VO track, -16 LUFS, registered as vo.<id>
    → storyboards/<id>.timed.yaml                 the storyboard with line/caption timings + scene durations
    then: lint_storyboard.py storyboards/<id>.timed.yaml --emit kit/src/storyboards/<id>.json

Piper synthesis is stochastic, so a line is synthesised only if its frozen WAV (keyed by
sha256(voice@version, length_scale, text)) does not exist yet. Re-running is therefore
deterministic: it reuses the frozen audio and recomputes identical timings.
Voice models are fetched to $MAI_VOICE_CACHE (default ~/.cache/mai-voices) and verified by sha256.
"""
import copy
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import urllib.request

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
TOK = lambda n: json.loads((ROOT / "tokens" / f"{n}.tokens.json").read_text())
DIALOGUE = TOK("audio")["audio"]["dialogue"]
TYPE = TOK("typography")["font"]["rules"]
HOLD = TOK("motion")["motion"]["duration"]["caption-hold-min"]["$value"] / 30
SR = 22050
CACHE = pathlib.Path(os.environ.get("MAI_VOICE_CACHE", pathlib.Path.home() / ".cache" / "mai-voices"))


def sha(b):
    return hashlib.sha256(b).hexdigest()


def manifest(ref):
    aid, ver = ref.split("@")
    lock = json.loads((ROOT / "assets.lock.json").read_text())["assets"]
    if ref not in lock:
        sys.exit(f"{ref} is not in assets.lock.json")
    return json.loads((ROOT / lock[ref]["manifest"]).read_text())


def fetch(url, digest, dest):
    if not dest.exists() or sha(dest.read_bytes()) != digest:
        dest.parent.mkdir(parents=True, exist_ok=True)
        print(f"downloading {url}")
        with urllib.request.urlopen(url) as r:
            dest.write_bytes(r.read())
    if sha(dest.read_bytes()) != digest:
        sys.exit(f"sha256 mismatch for {dest}: refusing to use an unpinned voice model")
    return dest


_voices = {}


def voice(ref):
    if ref not in _voices:
        from piper import PiperVoice
        m = manifest(ref)["implementation"]["model"]
        onnx = fetch(m["url"], m["sha256"], CACHE / pathlib.Path(m["url"]).name)
        fetch(m["config_url"], m["config_sha256"], CACHE / pathlib.Path(m["config_url"]).name)
        _voices[ref] = PiperVoice.load(str(onnx))
    return _voices[ref]


def trim(x, thresh=0.01, pad=0.03):
    idx = np.nonzero(np.abs(x) > thresh)[0]
    if not len(idx):
        return x
    p = int(pad * SR)
    return x[max(0, idx[0] - p): idx[-1] + p]


def synth_line(board_id, spk, text):
    from piper.config import SynthesisConfig
    vref = spk["voice"]
    ls = spk.get("length_scale", manifest(vref)["implementation"]["props"]["length_scale"])
    key = sha(f"{vref}|{ls}|{text}".encode())[:16]
    path = ROOT / "assets" / "vo" / board_id / "lines" / f"{spk['id']}-{key}.wav"
    if not path.exists():
        chunks = voice(vref).synthesize(text, syn_config=SynthesisConfig(length_scale=ls))
        audio = np.concatenate([c.audio_float_array for c in chunks]).astype(np.float32)
        path.parent.mkdir(parents=True, exist_ok=True)
        sf.write(path, trim(audio), SR, subtype="PCM_16")
        print(f"  synthesised {path.relative_to(ROOT)}")
    y, _ = sf.read(path, dtype="float32")
    return path, y


def syllables(word):
    return max(1, len(re.findall(r"[aeiouy]+", word.lower())))


def chunk(words):
    """Caption cards: split into clauses at punctuation first, then divide each clause into
    balanced cards of ≤ max words / chars. A one-word clause ("Listen.") stays its own card."""
    maxw, maxc = TYPE["caption-max-words"]["$value"], TYPE["caption-max-chars"]["$value"]
    clauses, cur = [], []
    for w in words:
        cur.append(w)
        if re.search(r"[,.?!;:…—]$", w):
            clauses.append(cur); cur = []
    if cur:
        clauses.append(cur)
    cards = []
    for c in clauses:
        n = max(-(-len(c) // maxw), 1)
        while True:
            size = -(-len(c) // n)
            parts = [c[i:i + size] for i in range(0, len(c), size)]
            if all(len(" ".join(p)) <= maxc for p in parts):
                break
            n += 1
        cards += parts
    # a trailing comma-clause of one word reads better glued to its neighbour ("start to finish.")
    out = []
    for c in cards:
        if out and len(c) == 1 and out[-1][-1].endswith(",") and len(out[-1]) < maxw and len(" ".join(out[-1] + c)) <= maxc:
            out[-1] = out[-1] + c
        else:
            out.append(c)
    return out


def speech_clock(y, hop=0.01, min_pause=0.12):
    """Map 'speech time' (silences removed) back to real time, so syllables are spread only
    over the parts of the line where the voice is actually speaking."""
    n = int(hop * SR)
    rms = np.array([np.sqrt(np.mean(y[i:i + n] ** 2)) for i in range(0, len(y), n)])
    voiced = rms > 0.06 * rms.max()
    # short dips inside words are not pauses
    run = 0
    for i in range(len(voiced)):
        if not voiced[i]:
            run += 1
        else:
            if 0 < run * hop < min_pause:
                voiced[i - run:i] = True
            run = 0
    real = np.arange(len(voiced) + 1) * hop
    spoken = np.concatenate([[0], np.cumsum(voiced) * hop])
    total = spoken[-1] or len(y) / SR
    # side='right' - 1: a boundary that falls inside a pause snaps to where speech resumes
    return total, lambda s: float(real[min(max(np.searchsorted(spoken, s, side="right") - 1, 0), len(real) - 1)])


def captions_for(line, at, y, turn):
    words = line["text"].split()
    cards = chunk(words)
    weights = [sum(syllables(w) for w in c) for c in cards]
    total = sum(weights)
    speech, to_real = speech_clock(y)
    dur = len(y) / SR
    out, acc = [], 0
    for c, wgt in zip(cards, weights):
        t0 = to_real(speech * acc / total)
        acc += wgt
        t1 = dur if acc == total else to_real(speech * acc / total)
        out.append({"text": " ".join(c), "at": round(at + t0, 2), "until": round(at + t1, 2), "speaker": line["speaker"]})
    # enforce minimum hold by merging short cards into their neighbour when they still fit
    merged = []
    for cap in out:
        if merged and (cap["until"] - cap["at"] < HOLD or merged[-1]["until"] - merged[-1]["at"] < HOLD):
            joined = merged[-1]["text"] + " " + cap["text"]
            if len(joined.split()) <= TYPE["caption-max-words"]["$value"] and len(joined) <= TYPE["caption-max-chars"]["$value"]:
                merged[-1] = {**merged[-1], "text": joined, "until": cap["until"]}
                continue
        merged.append(cap)
    # still too short: stretch it and push the following cards later (never overlap, C4)
    for i, cap in enumerate(merged):
        if i:
            cap["at"] = max(cap["at"], merged[i - 1]["until"])
        cap["until"] = round(max(cap["until"], cap["at"] + HOLD + 0.01), 2)
    for cap in merged:
        lw = [w.lower().strip(".,?!…") for w in cap["text"].split()]
        em = [e for e in line.get("emph", []) if e["word"].lower().strip(".,?!…") in lw]
        if em:
            cap["emph"] = em
    if turn:
        merged[0]["turn"] = True
    return merged


def main(path):
    src = pathlib.Path(path).resolve()
    board = yaml.safe_load(src.read_text())
    dlg = board["meta"].get("dialogue")
    if not dlg:
        sys.exit("meta.dialogue is required")
    spk = {s["id"]: s for s in dlg["speakers"]}
    out = copy.deepcopy(board)
    bid = board["meta"]["id"]
    gap_same, gap_turn, gap_q = DIALOGUE["gap-same-speaker-s"], DIALOGUE["gap-turn-s"], DIALOGUE["extra-after-question-s"]
    placements, scene_start, prev_speaker = [], 0.0, None
    for beat in out["beats"]:
        first_in_beat = True
        for s in beat["scenes"]:
            lines = s.get("lines") or []
            t = DIALOGUE["scene-lead-in-s"]
            caps = []
            prev_line = None
            for ln in lines:
                if ln["speaker"] not in spk:
                    sys.exit(f"{s['id']}: unknown speaker {ln['speaker']}")
                if prev_line is not None:
                    t += gap_same if prev_line["speaker"] == ln["speaker"] else gap_turn
                    if prev_line["text"].rstrip().endswith("?"):
                        t += gap_q
                wav, y = synth_line(bid, spk[ln["speaker"]], ln.get("say", ln["text"]))
                d = len(y) / SR
                ln["at"], ln["until"] = round(t, 2), round(t + d, 2)
                ln["audio"] = str(wav.relative_to(ROOT / "assets"))
                is_guide = spk[ln["speaker"]]["role"] == "guide"
                turn = is_guide and (prev_speaker is None or spk[prev_speaker]["role"] != "guide" or first_in_beat)
                caps += captions_for(ln, t, y, turn)
                placements.append((scene_start + t, y))
                prev_line, prev_speaker, first_in_beat = ln, ln["speaker"], False
                t += d
            if lines:
                need = t + DIALOGUE["scene-tail-s"]
                s["duration"] = round(max(s.get("duration", 0), need), 2)
                s["captions"] = caps
                s["vo"] = " ".join(l["text"] for l in lines)
            scene_start += s["duration"]

    # mix + normalise the VO track
    total = np.zeros(int(np.ceil(scene_start * SR)) + SR)
    for t0, y in placements:
        i = int(round(t0 * SR))
        total[i:i + len(y)] += y
    meter = pyln.Meter(SR)
    lufs_in = meter.integrated_loudness(total)
    total = pyln.normalize.loudness(total, lufs_in, DIALOGUE["vo-lufs"])
    peak = np.max(np.abs(total))
    if peak > 0.84:
        total *= 0.84 / peak
    vdir = ROOT / "assets" / "vo" / bid
    wav = vdir / "dialogue.wav"
    sf.write(wav, total.astype(np.float32), SR, subtype="PCM_16")
    lines_files = sorted({p for p in (vdir / "lines").glob("*.wav")})
    used = {str((ROOT / "assets" / l["audio"]).resolve()) for b in out["beats"] for s in b["scenes"] for l in s.get("lines") or []}
    for p in lines_files:
        if str(p.resolve()) not in used:
            print(f"  note: {p.relative_to(ROOT)} is no longer used by the script (kept; delete it if intended)")
    mf = vdir / "asset.json"
    old = json.loads(mf.read_text()) if mf.exists() else None
    version = old["version"] if old else "1.0.0"
    digest = sha(wav.read_bytes())
    prev = (vdir / "dialogue.sha256").read_text().strip() if (vdir / "dialogue.sha256").exists() else None
    if old and prev not in (None, digest):
        major, minor, _ = map(int, version.split("."))
        version = f"{major}.{minor + 1}.0"
        print(f"  dialogue changed → vo.{bid}@{version}")
    manifest_out = {
        "id": f"vo.{bid}", "version": version, "kind": "vo", "status": "published",
        "title": f"Dialogue VO: {board['meta']['title']}",
        "description": f"Two-voice dialogue ({dlg['mode']} mode) generated by tools/dialogue.py; mixed and normalised to {DIALOGUE['vo-lufs']} LUFS. Lines are frozen individually under lines/.",
        "files": [{"path": "dialogue.wav", "role": "audio"}] + [{"path": f"lines/{p.name}", "role": "source"} for p in lines_files if str(p.resolve()) in used],
        "provenance": {"source": "generated", "author": "tools/dialogue.py", "created": "2026-10-27", "tool": "piper-tts",
                       "model": ", ".join(f"{s['id']}={s['voice']}" for s in dlg["speakers"]),
                       "prompt": "storyboard lines (see storyboards/" + src.name + ")",
                       "notes": "Stochastic TTS: each line generated once and frozen; never regenerated at render time."},
        "license": "Inherits voice licences: " + "; ".join(manifest(s["voice"])["license"] for s in dlg["speakers"]),
        "tags": ["vo", "dialogue"],
    }
    mf.write_text(json.dumps(manifest_out, indent=2) + "\n")
    # remembered so the next run can tell whether the mix changed (→ version bump)
    (vdir / "dialogue.sha256").write_text(digest + "\n")
    out["meta"]["voice"]["asset"] = f"vo.{bid}@{version}"
    dest = src.with_name(src.stem + ".timed.yaml")
    dest.write_text(f"# GENERATED by tools/dialogue.py from {src.name}. Edit the source, not this file.\n"
                    + yaml.safe_dump(out, sort_keys=False, allow_unicode=True, width=140))
    subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "asset_lock.py")], check=True)
    print(f"wrote {dest.relative_to(ROOT.parent)}  ({scene_start:.1f}s, VO {lufs_in:.1f} → {DIALOGUE['vo-lufs']} LUFS)")


if __name__ == "__main__":
    main(sys.argv[1])
