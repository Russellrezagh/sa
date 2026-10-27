"""Master a rendered video's audio to RULES A1 (-14 LUFS integrated, -1 dBTP). Video is stream-copied.

    python3 -I video-style/tools/master.py kit/out/x.mp4 [out.mp4]

Needed because the renderer's mixer attenuates summed tracks (VO + bed + sfx). Two-pass ffmpeg
loudnorm (linear mode) is deterministic for a given input.
"""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
L = json.loads((ROOT / "tokens" / "audio.tokens.json").read_text())["audio"]["loudness"]
I, TP = L["integrated-lufs"]["$value"], L["true-peak-dbtp"]["$value"]

src = pathlib.Path(sys.argv[1])
dst = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else src.with_name(src.stem + ".master" + src.suffix)
TP_ENC = TP - 0.5  # AAC encoding overshoots the true peak slightly; leave headroom


def measure(path):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", f"loudnorm=I={I}:TP={TP_ENC}:LRA=11:print_format=json", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", err, re.S).group(0))


def encode(linear):
    af = (f"loudnorm=I={I}:TP={TP_ENC}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear={'true' if linear else 'false'},aresample=48000")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-c:v", "copy", "-af", af, "-c:a", "aac", "-b:a", "192k",
                    "-movflags", "+faststart", str(dst)], check=True)
    return measure(dst)


m = measure(src)
c = encode(linear=True)
mode = "linear gain"
if abs(float(c["input_i"]) - I) > 1.0:  # peaks too spiky for a pure gain: let loudnorm limit
    c = encode(linear=False)
    mode = "dynamic (limited)"
print(f"{dst}: {m['input_i']} → {c['input_i']} LUFS, true peak {c['input_tp']} dBTP [{mode}]")
