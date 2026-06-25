#!/usr/bin/env python3
"""Generate Kochgourmet launcher icons: white-coral circle + orange star."""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
STAR_SRC = ROOT / "assets/images/kochgourmet-star-source.png"
RES = ROOT / "android/app/src/main/res"
ASSETS = ROOT / "assets/images"

BG = (0xFF, 0xF9, 0xF0, 255)  # white coral (theme background.secondary)
STAR = (0xEE, 0x7B, 0x5F, 255)  # brand coral / orange star

ICON_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

ADAPTIVE_SIZES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}


def load_orange_star() -> Image.Image:
    src = Image.open(STAR_SRC).convert("RGBA")
    px = src.load()
    w, h = src.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            if r > 240 and g > 240 and b > 240:
                continue
            opx[x, y] = STAR
    return out


def paste_star(canvas: Image.Image, star: Image.Image, scale: float = 0.52) -> Image.Image:
    cw, ch = canvas.size
    target = int(min(cw, ch) * scale)
    star_r = star.resize((target, target), Image.Resampling.LANCZOS)
    x = (cw - target) // 2
    y = (ch - target) // 2
    canvas.alpha_composite(star_r, (x, y))
    return canvas


def main() -> None:
    if not STAR_SRC.exists():
        raise SystemExit(f"Missing star source: {STAR_SRC}")

    star = load_orange_star()

    for folder, size in ICON_SIZES.items():
        folder_path = RES / folder
        folder_path.mkdir(parents=True, exist_ok=True)
        launcher = Image.new("RGBA", (size, size), BG)
        paste_star(launcher, star, 0.58)
        launcher.save(folder_path / "ic_launcher.png")
        launcher.save(folder_path / "ic_launcher_round.png")

    for folder, size in ADAPTIVE_SIZES.items():
        fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        paste_star(fg, star, 0.52)
        fg.save(RES / folder / "ic_launcher_foreground.png")

    app_icon = Image.new("RGBA", (1024, 1024), BG)
    paste_star(app_icon, star, 0.58)
    app_icon.save(ASSETS / "kochgourmet-app-icon.png")
    app_icon.resize((192, 192), Image.Resampling.LANCZOS).save(ASSETS / "favicon.png")
    app_icon.save(
        ROOT / "ios/Kochgourmet/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png"
    )

    fg_expo = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    paste_star(fg_expo, star, 0.52)
    fg_expo.save(ASSETS / "kochgourmet-app-icon-foreground.png")

    splash = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    paste_star(splash, star, 0.52)
    splash.save(ASSETS / "kochgourmet-splash-icon.png")

    print("Generated white-coral + orange star icons for all mipmap densities.")


if __name__ == "__main__":
    main()
