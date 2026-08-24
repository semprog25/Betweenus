#!/usr/bin/env python3
"""Generate transparent web icons and platform app icons from the brand mark."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "resources" / "brand-icon-source.png"
BRAND_BG = (5, 4, 10)
ANDROID_BG = "#05040a"

ANDROID_FOREGROUND_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


def remove_black_background(image: Image.Image, threshold: int = 42) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            peak = max(red, green, blue)

            if peak <= threshold:
                pixels[x, y] = (red, green, blue, 0)
                continue

            if peak <= threshold + 36:
                fade = int(255 * (peak - threshold) / 36)
                pixels[x, y] = (red, green, blue, min(alpha, fade))

    bbox = rgba.getbbox()
    if not bbox:
        return rgba

    cropped = rgba.crop(bbox)
    side = max(cropped.size)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    offset = ((side - cropped.width) // 2, (side - cropped.height) // 2)
    square.paste(cropped, offset, cropped)
    return square


def fit_icon(image: Image.Image, size: int, scale: float = 0.82) -> Image.Image:
    target = max(1, int(size * scale))
    fitted = image.copy()
    fitted.thumbnail((target, target), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = ((size - fitted.width) // 2, (size - fitted.height) // 2)
    canvas.paste(fitted, offset, fitted)
    return canvas


def compose_on_background(image: Image.Image, size: int, background=BRAND_BG, scale: float = 0.82) -> Image.Image:
    foreground = fit_icon(image, size, scale=scale)
    canvas = Image.new("RGBA", (size, size), (*background, 255))
    canvas.paste(foreground, (0, 0), foreground)
    return canvas.convert("RGB")


def save_png(path: Path, image: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    if image.mode == "RGBA":
        optimized = image.convert("RGBA")
        alpha = optimized.getchannel("A")
        rgb = optimized.convert("RGB").quantize(colors=32, method=Image.Quantize.MEDIANCUT)
        packed = rgb.convert("RGBA")
        packed.putalpha(alpha)
        packed.save(path, format="PNG", optimize=True, compress_level=9)
        return

    image.convert("RGB").quantize(colors=32, method=Image.Quantize.MEDIANCUT).save(
        path,
        format="PNG",
        optimize=True,
        compress_level=9,
    )


def write_favicon_ico(path: Path, images: list[Image.Image]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    entries: list[bytes] = []
    image_data: list[bytes] = []

    for image in images:
        rgba = image.convert("RGBA")
        width, height = rgba.size
        pixels = rgba.tobytes()

        bmp_header = struct.pack("<IIIHHIIIIII", 40, width, height * 2, 1, 32, 0, 0, 0, 0, 0, 0)
        row = width * 4
        padding = (4 - (row % 4)) % 4
        pixel_rows = b"".join(
            pixels[y * row : (y + 1) * row] + (b"\x00" * padding)
            for y in range(height - 1, -1, -1)
        )
        mask_row = ((width + 31) // 32) * 4
        mask = b"\x00" * (mask_row * height)
        bmp = bmp_header + pixel_rows + mask
        compressed = zlib.compress(bmp, 9)

        offset = 6 + (16 * len(entries)) + 4
        for previous in image_data:
            offset += len(previous)

        entries.append(
            struct.pack("<BBBBHHII", width if width < 256 else 0, height if height < 256 else 0, 0, 0, 1, 32, len(compressed), offset)
        )
        image_data.append(compressed)

    with path.open("wb") as handle:
        handle.write(struct.pack("<HHH", 0, 1, len(entries)))
        for entry in entries:
            handle.write(entry)
        for data in image_data:
            handle.write(data)


def write_web_assets(icon: Image.Image) -> None:
    master = fit_icon(icon, 512, scale=0.86)
    save_png(ROOT / "public/assets/betweenus-icon.png", master)
    save_png(ROOT / "src/assets/betweenus-icon.png", master)

    for size, name in ((16, "favicon-16.png"), (32, "favicon-32.png"), (180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")):
        save_png(ROOT / "public" / name, fit_icon(icon, size, scale=0.86))

    write_favicon_ico(
        ROOT / "public/favicon.ico",
        [fit_icon(icon, size, scale=0.86) for size in (16, 32, 48)],
    )


def write_ios_icon(icon: Image.Image) -> None:
    ios_icon = compose_on_background(icon, 1024, scale=0.78)
    save_png(
        ROOT / "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
        ios_icon,
    )


def write_android_icons(icon: Image.Image) -> None:
    background_path = ROOT / "android/app/src/main/res/values/ic_launcher_background.xml"
    background_path.write_text(
        """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">""" + ANDROID_BG + """</color>
</resources>
""",
        encoding="utf-8",
    )

    for folder, size in ANDROID_FOREGROUND_SIZES.items():
        res_dir = ROOT / "android/app/src/main/res" / folder
        foreground = fit_icon(icon, size, scale=0.82)
        launcher = compose_on_background(icon, size, scale=0.82)

        save_png(res_dir / "ic_launcher_foreground.png", foreground)
        save_png(res_dir / "ic_launcher.png", launcher)
        save_png(res_dir / "ic_launcher_round.png", launcher)

    splash = compose_on_background(icon, 512, scale=0.72)
    splash_dirs = [
        ROOT / "android/app/src/main/res/drawable",
        ROOT / "android/app/src/main/res/drawable-port-mdpi",
        ROOT / "android/app/src/main/res/drawable-port-hdpi",
        ROOT / "android/app/src/main/res/drawable-port-xhdpi",
        ROOT / "android/app/src/main/res/drawable-port-xxhdpi",
        ROOT / "android/app/src/main/res/drawable-port-xxxhdpi",
        ROOT / "android/app/src/main/res/drawable-land-mdpi",
        ROOT / "android/app/src/main/res/drawable-land-hdpi",
        ROOT / "android/app/src/main/res/drawable-land-xhdpi",
        ROOT / "android/app/src/main/res/drawable-land-xxhdpi",
        ROOT / "android/app/src/main/res/drawable-land-xxxhdpi",
    ]

    for directory in splash_dirs:
        if directory.exists():
            save_png(directory / "splash.png", splash)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source icon: {SOURCE}")

    source = Image.open(SOURCE)
    icon = remove_black_background(source)

    write_web_assets(icon)
    write_ios_icon(icon)
    write_android_icons(icon)

    public_icon = ROOT / "public/assets/betweenus-icon.png"
    print(f"Generated icons from {SOURCE.name}")
    print(f"  Web icon: {public_icon} ({public_icon.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
