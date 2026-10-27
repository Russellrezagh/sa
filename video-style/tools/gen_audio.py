"""Synthesise the house sound assets from code, deterministically.

Every sound here is a pure function of (seed, parameters), so a fresh clone can
rebuild byte-identical WAVs and `asset_lock.py --check` will still pass.

    python3 video-style/tools/gen_audio.py            # (re)build all
"""
import json
import pathlib

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

SR = 48000
ROOT = pathlib.Path(__file__).resolve().parents[1] / "assets"


def env(n, attack, decay):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-6), 0, 1)
    return a * np.exp(-t / decay)


def tick(rng, accent=1.0):
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    click = np.sin(2 * np.pi * 3200 * t) * env(n, 0.0005, 0.004)
    body = np.sin(2 * np.pi * 1450 * t) * env(n, 0.001, 0.012) * 0.6
    noise = rng.standard_normal(n) * env(n, 0.0003, 0.003) * 0.25
    return (click + body + noise) * accent


def ping():
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    partials = [(1046.5, 1.0, 0.55), (2093.0, 0.35, 0.30), (3139.5, 0.18, 0.18), (1318.5, 0.22, 0.45)]
    return sum(a * np.sin(2 * np.pi * f * t) * env(n, 0.004, d) for f, a, d in partials)


def pencil(rng):
    n = int(0.28 * SR)
    x = rng.standard_normal(n)
    # crude band-pass: difference of two one-pole low-passes (≈ 2–6 kHz)
    def lp(sig, a):
        y = np.empty_like(sig); acc = 0.0
        for i, v in enumerate(sig):
            acc += a * (v - acc); y[i] = acc
        return y
    band = lp(x, 0.55) - lp(x, 0.2)
    grain = 0.6 + 0.4 * np.sin(2 * np.pi * 38 * np.arange(n) / SR + rng.uniform(0, 6.28))
    return band * grain * env(n, 0.02, 0.12)


def bed(rng, bpm, seconds):
    n = int(seconds * SR)
    out = np.zeros(n)
    step = 60 / bpm / 2  # eighth notes, watch-like
    i = 0
    while True:
        start = int(round(i * step * SR))
        if start >= n:
            break
        s = tick(rng, accent=1.0 if i % 2 == 0 else 0.55)
        out[start:start + len(s)] += s[: max(0, n - start)]
        i += 1
    return out


def normalise(x, lufs):
    meter = pyln.Meter(SR)
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.5
    padded = np.concatenate([x, np.zeros(SR)]) if len(x) < SR else x  # meter needs ≥ 400 ms
    loud = meter.integrated_loudness(padded)
    y = pyln.normalize.loudness(x, loud, lufs)
    peak = np.max(np.abs(y))
    if peak > 0.891:  # -1 dBTP ceiling (sample-peak approximation)
        y *= 0.891 / peak
    return y, round(float(meter.integrated_loudness(np.concatenate([y, np.zeros(SR)]) if len(y) < SR else y)), 1)


SPECS = [
    ("sfx/pulse-tick", "tick.wav", lambda r: tick(r), -24, 101, "sfx.pulse-tick", "sfx", "Pulse tick", "One watch tick. The atom of the pulse."),
    ("sfx/ripple-ping", "ping.wav", lambda r: ping(), -26, 102, "sfx.ripple-ping", "sfx", "Ripple ping", "Glassy ping that accompanies a motif ripple (when the idea is named)."),
    ("sfx/pencil", "pencil.wav", lambda r: pencil(r), -28, 103, "sfx.pencil", "sfx", "Pencil scratch", "Short scratch under a draw-on."),
    ("bed/pulse-70", "pulse-70bpm-9bars.wav", lambda r: bed(r, 70, 60 / 70 * 4 * 9), -32, 104, "bed.pulse-70", "bed", "Pulse bed, 70 bpm",
     "Watch-tick bed at 70 bpm (eighths, accented on the beat); 9 bars (30.86 s), loops seamlessly on the bar line. Sits ~18 LU under VO."),
]

if __name__ == "__main__":
    for rel, fname, fn, lufs, seed, aid, kind, title, desc in SPECS:
        d = ROOT / rel
        d.mkdir(parents=True, exist_ok=True)
        y, measured = normalise(fn(np.random.default_rng(seed)), lufs)
        sf.write(d / fname, y.astype(np.float32), SR, subtype="PCM_16")
        manifest = {
            "id": aid, "version": "1.0.0", "kind": kind, "status": "published",
            "title": title, "description": f"{desc} Integrated loudness {measured} LUFS.",
            "files": [{"path": fname, "role": "audio"}],
            "implementation": {"kit_component": "Audio", "props": {}, "deterministic_inputs": [f"tools/gen_audio.py:{aid}", f"seed={seed}"]},
            "provenance": {"source": "code", "author": "video-style/tools/gen_audio.py", "created": "2026-10-27", "tool": "numpy+soundfile", "seed": seed},
            "license": "CC0-1.0", "tags": ["audio", "pulse"],
        }
        (d / "asset.json").write_text(json.dumps(manifest, indent=2) + "\n")
        print(f"{aid}: {fname} {measured} LUFS")
