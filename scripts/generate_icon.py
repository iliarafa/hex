"""
Generate HEX app icon: "HEX" text filled with the HSL color spectrum grid,
on a white background. Uses Press Start 2P font and the same color algorithm
as the app's ColorSpectrum component.
"""

from PIL import Image, ImageDraw, ImageFont
import math

FONT_PATH = "/Users/iliasrafailidis/development/hex/node_modules/@expo-google-fonts/press-start-2p/400Regular/PressStart2P_400Regular.ttf"
OUTPUT_PATH = "/Users/iliasrafailidis/development/hex/assets/icon.png"
ICON_SIZE = 1024
PIXEL_SIZE = 16  # Visible pixel grid within the text


def hsl_to_rgb(h, s, l):
    """Convert HSL to RGB tuple (0-255). Matches the app's hslToHex algorithm."""
    s_norm = s / 100
    l_norm = l / 100

    c = (1 - abs(2 * l_norm - 1)) * s_norm
    x = c * (1 - abs(((h / 60) % 2) - 1))
    m = l_norm - c / 2

    if h < 60:
        r, g, b = c, x, 0
    elif h < 120:
        r, g, b = x, c, 0
    elif h < 180:
        r, g, b = 0, c, x
    elif h < 240:
        r, g, b = 0, x, c
    elif h < 300:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x

    return (round((r + m) * 255), round((g + m) * 255), round((b + m) * 255))


def generate_spectrum_image(width, height, pixel_size):
    """Generate the HSL color spectrum as an image, matching the app's grid."""
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)

    cols = math.ceil(width / pixel_size)
    rows = math.ceil(height / pixel_size)

    for row in range(rows):
        for col in range(cols):
            center_x = col * pixel_size + pixel_size / 2
            center_y = row * pixel_size + pixel_size / 2

            h = round((center_x / width) * 360)
            # Clamp lightness to 30-70% so colors stay vibrant (no white/black wash)
            l_max = 70
            l_min = 30
            l = round(l_max - (center_y / height) * (l_max - l_min))
            h = max(0, min(360, h))
            l = max(l_min, min(l_max, l))

            color = hsl_to_rgb(h, 100, l)

            x0 = col * pixel_size
            y0 = row * pixel_size
            x1 = x0 + pixel_size
            y1 = y0 + pixel_size
            draw.rectangle([x0, y0, x1, y1], fill=color)

    return img


def create_icon():
    img = Image.new("RGB", (ICON_SIZE, ICON_SIZE), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Find the right font size so "HEX" fills ~75% of the icon width
    target_width = ICON_SIZE * 0.72
    font_size = 10
    font = ImageFont.truetype(FONT_PATH, font_size)

    while True:
        bbox = draw.textbbox((0, 0), "HEX", font=font)
        text_width = bbox[2] - bbox[0]
        if text_width >= target_width or font_size > 500:
            break
        font_size += 2
        font = ImageFont.truetype(FONT_PATH, font_size)

    # Get exact text dimensions
    bbox = draw.textbbox((0, 0), "HEX", font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Center the text position
    text_x = (ICON_SIZE - text_width) // 2 - bbox[0]
    text_y = (ICON_SIZE - text_height) // 2 - bbox[1]

    # Generate the spectrum sized exactly to the text bounding box
    # so the full hue range (0-360) and lightness range map onto the letters
    spectrum_full = generate_spectrum_image(text_width, text_height, PIXEL_SIZE)

    # Place the spectrum onto a full-size canvas at the text position
    spectrum = Image.new("RGB", (ICON_SIZE, ICON_SIZE), (255, 255, 255))
    spectrum.paste(spectrum_full, (text_x + bbox[0], text_y + bbox[1]))

    # Create a mask from the text
    mask = Image.new("L", (ICON_SIZE, ICON_SIZE), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.text((text_x, text_y), "HEX", font=font, fill=255)

    # Composite: white background + spectrum clipped to text shape
    img.paste(spectrum, (0, 0), mask)

    img.save(OUTPUT_PATH, "PNG")
    print(f"Icon saved to {OUTPUT_PATH}")
    print(f"Size: {ICON_SIZE}x{ICON_SIZE}")
    print(f"Font size: {font_size}px")
    print(f"Text dimensions: {text_width}x{text_height}")


if __name__ == "__main__":
    create_icon()
