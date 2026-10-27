"""Fingerprint a reference video so its style can be compared, merged, or added to the MAI system.

    pip install yt-dlp numpy scikit-learn librosa soundfile faster-whisper
    python3 -I video-style/tools/analyze_reference.py <url-or-file> <name> [--out DIR] [--no-transcript]

Produces in DIR (default: a scratch dir you choose; media is NOT committed):
  <name>.mp4 / .wav           downloaded media (keep out of git)
  <name>.json                 fingerprint: palette, accents, luminance, saturation, motion energy,
                              cuts, tempo, onsets, loudness range, VO wpm and pauses
  <name>.transcript.json      word-timed transcript (faster-whisper "small")
  <name>_sheet_NN.png         timestamped contact sheets for visual review

Copy only <name>.json into video-style/analysis/fingerprints/ and write the qualitative notes in
analysis/REFERENCE_ANALYSIS.md, using the "Steal / Leave / Why" table format.
"""
import argparse
import colorsys
import json
import pathlib
import subprocess
import sys

import numpy as np


def sh(*cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, **kw)


def fetch(src, out, name):
    mp4 = out / f"{name}.mp4"
    if pathlib.Path(src).exists():
        mp4.write_bytes(pathlib.Path(src).read_bytes())
    elif not mp4.exists():
        sh("yt-dlp", "--no-warnings", "--sleep-requests", "2", "-o", str(out / f"{name}.%(ext)s"), "--merge-output-format", "mp4", src)
    wav = out / f"{name}.wav"
    sh("ffmpeg", "-v", "error", "-y", "-i", str(mp4), "-vn", "-ac", "1", "-ar", "22050", str(wav))
    return mp4, wav


def frames(mp4, fps=4, w=160):
    probe = json.loads(sh("ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate",
                          "-of", "json", str(mp4)).stdout)["streams"][0]
    h = int(round(w * probe["height"] / probe["width"] / 2) * 2)
    raw = sh("ffmpeg", "-v", "error", "-i", str(mp4), "-vf", f"fps={fps},scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-").stdout
    return probe, np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3).astype(np.float32)


def palettes(f):
    from sklearn.cluster import KMeans
    rng = np.random.default_rng(0)
    px = f.reshape(-1, 3)
    px = px[rng.choice(len(px), min(len(px), 60000), replace=False)]
    km = KMeans(n_clusters=10, n_init=4, random_state=0).fit(px)
    cnt = np.bincount(km.labels_, minlength=10) / len(px)
    base = [{"hex": "#%02x%02x%02x" % tuple(int(c) for c in km.cluster_centers_[i]), "share": round(float(cnt[i]), 3)} for i in np.argsort(-cnt)]
    mx, mn = px.max(1), px.min(1)
    chrom = px[((mx - mn) / np.maximum(mx, 1) > 0.35) & (mx > 60)]
    acc = []
    if len(chrom) > 50:
        k = min(8, len(chrom) // 10)
        km2 = KMeans(n_clusters=k, n_init=4, random_state=0).fit(chrom)
        c2 = np.bincount(km2.labels_, minlength=k) / len(chrom)
        for i in np.argsort(-c2):
            r, g, b = km2.cluster_centers_[i] / 255
            acc.append({"hex": "#%02x%02x%02x" % (int(r * 255), int(g * 255), int(b * 255)), "share": round(float(c2[i]), 3),
                        "hue": round(colorsys.rgb_to_hls(r, g, b)[0] * 360)})
    return base, acc


def cuts(mp4, thresh=0.3):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(mp4), "-vf", f"select='gt(scene,{thresh})',showinfo", "-an", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return [round(float(x.split(":")[1]), 2) for x in err.split() if x.startswith("pts_time:")]


def audio(wav):
    import librosa
    y, sr = librosa.load(str(wav), sr=22050, mono=True)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    on = librosa.onset.onset_detect(y=y, sr=sr, units="time")
    rms = librosa.feature.rms(y=y)[0]
    d = len(y) / sr
    return {"duration_s": round(d, 2), "tempo_bpm": round(float(np.atleast_1d(tempo)[0]), 1), "onsets_per_second": round(len(on) / d, 2),
            "rms_dynamic_range_db": round(float(20 * np.log10((np.percentile(rms, 95) + 1e-9) / (np.percentile(rms, 10) + 1e-9))), 1)}


def transcript(wav, out, name):
    import librosa
    from faster_whisper import WhisperModel
    a, _ = librosa.load(str(wav), sr=16000, mono=True)
    segs, info = WhisperModel("small", device="cpu", compute_type="int8").transcribe(a, word_timestamps=True, vad_filter=True)
    words, text = [], []
    for s in segs:
        text.append(s.text)
        words += [{"w": w.word, "s": round(w.start, 2), "e": round(w.end, 2)} for w in (s.words or [])]
    (out / f"{name}.transcript.json").write_text(json.dumps({"lang": info.language, "text": "".join(text), "words": words}, indent=0))
    if len(words) < 2:
        return {}
    dur = words[-1]["e"] - words[0]["s"]
    gaps = [b["s"] - a["e"] for a, b in zip(words, words[1:])]
    return {"vo_words": len(words), "vo_wpm": round(len(words) / dur * 60), "vo_pauses_gt_0_6s": sum(g > 0.6 for g in gaps)}


def sheets(mp4, out, name, probe, duration):
    fps = 1 if duration <= 60 else 0.5
    portrait = probe["height"] > probe["width"]
    sh("ffmpeg", "-v", "error", "-y", "-i", str(mp4), "-vf",
       f"fps={fps},scale={'270' if portrait else '480'}:-1,drawtext=text='%{{pts\\:hms}}':x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6,"
       f"tile={'6x3' if portrait else '4x4'}", str(out / f"{name}_sheet_%02d.png"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("name")
    ap.add_argument("--out", default="reference-media")
    ap.add_argument("--no-transcript", action="store_true")
    a = ap.parse_args()
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    mp4, wav = fetch(a.src, out, a.name)
    probe, f = frames(mp4)
    base, acc = palettes(f)
    diff = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2, 3))
    res = {"name": a.name, "source": a.src, "size": [probe["width"], probe["height"]], "fps": probe["r_frame_rate"],
           "palette": base, "accents": acc,
           "mean_luminance": round(float((f @ np.array([0.2126, 0.7152, 0.0722])).mean()), 1),
           "mean_saturation": round(float(((f.max(-1) - f.min(-1)).mean(axis=(1, 2)) / 255).mean()), 3),
           "motion_energy_mean": round(float(diff.mean()), 2), "motion_energy_p90": round(float(np.percentile(diff, 90)), 2)}
    res.update(audio(wav))
    c = cuts(mp4); res.update({"hard_cuts_scene_gt_0_3": len(c), "cut_times_s": c})
    if not a.no_transcript:
        res.update(transcript(wav, out, a.name))
    sheets(mp4, out, a.name, probe, res["duration_s"])
    (out / f"{a.name}.json").write_text(json.dumps(res, indent=1) + "\n")
    print(json.dumps({k: v for k, v in res.items() if k not in ("palette", "accents", "cut_times_s")}, indent=1))


if __name__ == "__main__":
    sys.exit(main())
