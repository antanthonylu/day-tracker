#!/usr/bin/env python3
"""Generate Day Tracker's app icons. No third-party deps: writes PNG bytes directly.

The mark is original to this app: a 3x3 grid of day-marks on a charcoal field,
six filled in the accent colour and three left as thin outlines -- the same
"filled = done, outline = missed" language the app itself uses.

Run:  python3 tools/make-icons.py
"""

import struct
import zlib
from pathlib import Path

BG = (0x10, 0x12, 0x15)
ACCENT = (0x4F, 0xC3, 0xA1)
OUTLINE = (0x5A, 0x62, 0x6B)

SS = 4  # supersample factor, downsampled for antialiasing

# True = filled (completed), False = outline (missed)
PATTERN = [
    [True, True, False],
    [True, False, True],
    [False, True, True],
]


def new_canvas(size, bg):
    return bytearray(bytes(bg) * (size * size))


def blend(canvas, size, x, y, color, alpha):
    if alpha <= 0 or x < 0 or y < 0 or x >= size or y >= size:
        return
    i = (y * size + x) * 3
    for c in range(3):
        src = canvas[i + c]
        canvas[i + c] = int(src + (color[c] - src) * alpha + 0.5)


def disc(canvas, size, cx, cy, r, color):
    for y in range(max(0, int(cy - r - 1)), min(size, int(cy + r + 2))):
        for x in range(max(0, int(cx - r - 1)), min(size, int(cx + r + 2))):
            d = ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2) ** 0.5
            if d <= r:
                blend(canvas, size, x, y, color, 1.0)


def ring(canvas, size, cx, cy, r, width, color):
    inner = r - width
    for y in range(max(0, int(cy - r - 1)), min(size, int(cy + r + 2))):
        for x in range(max(0, int(cx - r - 1)), min(size, int(cx + r + 2))):
            d = ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2) ** 0.5
            if inner <= d <= r:
                blend(canvas, size, x, y, color, 1.0)


def downsample(canvas, size, factor):
    out_size = size // factor
    out = bytearray(out_size * out_size * 3)
    area = factor * factor
    for y in range(out_size):
        for x in range(out_size):
            totals = [0, 0, 0]
            for dy in range(factor):
                row = (y * factor + dy) * size
                for dx in range(factor):
                    i = (row + x * factor + dx) * 3
                    totals[0] += canvas[i]
                    totals[1] += canvas[i + 1]
                    totals[2] += canvas[i + 2]
            o = (y * out_size + x) * 3
            for c in range(3):
                out[o + c] = totals[c] // area
    return out, out_size


def write_png(path, pixels, size):
    raw = b"".join(
        b"\x00" + bytes(pixels[y * size * 3 : (y + 1) * size * 3]) for y in range(size)
    )

    def chunk(tag, data):
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    Path(path).write_bytes(png)


def render(out_path, size, pad_ratio):
    big = size * SS
    canvas = new_canvas(big, BG)
    pad = big * pad_ratio
    cell = (big - 2 * pad) / 3
    r = cell * 0.30
    stroke = max(2.0, cell * 0.055)

    for row in range(3):
        for col in range(3):
            cx = pad + cell * (col + 0.5)
            cy = pad + cell * (row + 0.5)
            if PATTERN[row][col]:
                disc(canvas, big, cx, cy, r, ACCENT)
            else:
                ring(canvas, big, cx, cy, r, stroke, OUTLINE)

    pixels, out_size = downsample(canvas, big, SS)
    write_png(out_path, pixels, out_size)
    print(f"wrote {out_path} ({out_size}x{out_size})")


if __name__ == "__main__":
    public = Path(__file__).resolve().parent.parent / "public"
    public.mkdir(exist_ok=True)
    render(public / "icon-192.png", 192, 0.14)
    render(public / "icon-512.png", 512, 0.14)
    render(public / "icon-maskable-512.png", 512, 0.26)
    # iOS picks whichever apple-touch-icon size is closest; offering the three
    # iPhone/iPad sizes makes it far less likely to fall back to a letter tile.
    render(public / "apple-touch-icon-180.png", 180, 0.16)
    render(public / "apple-touch-icon-167.png", 167, 0.16)
    render(public / "apple-touch-icon-152.png", 152, 0.16)
