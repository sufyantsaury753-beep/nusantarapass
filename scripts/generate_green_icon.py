import os
import math
from PIL import Image, ImageDraw

def render_nusantarapass_icon(size=512):
    # Render at 4x for pristine supersampled anti-aliasing
    scale = 4
    canvas_size = size * scale
    
    # Create transparent image
    img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 1. Background Rounded Rectangle in Heritage Forest Green (#064e3b)
    # Hex #064e3b -> RGB (6, 78, 59)
    bg_color = (6, 78, 59, 255)
    corner_radius = int(canvas_size * 0.22) # smooth modern curvature
    
    draw.rounded_rectangle(
        [(0, 0), (canvas_size - 1, canvas_size - 1)],
        radius=corner_radius,
        fill=bg_color
    )
    
    # 2. Compass Icon Geometry mapped from 24x24 viewBox to icon area
    # Icon sits inside with padding (e.g., 20% margin on each side)
    icon_padding = canvas_size * 0.23
    icon_box_size = canvas_size - 2 * icon_padding
    
    def map_pt(vx, vy):
        x = icon_padding + (vx / 24.0) * icon_box_size
        y = icon_padding + (vy / 24.0) * icon_box_size
        return (x, y)
    
    white = (255, 255, 255, 255)
    stroke_w = int(2.2 * (icon_box_size / 24.0))
    
    # Circle: cx=12, cy=12, r=10
    c_center = map_pt(12, 12)
    c_radius = 10 * (icon_box_size / 24.0)
    
    circle_bbox = [
        c_center[0] - c_radius,
        c_center[1] - c_radius,
        c_center[0] + c_radius,
        c_center[1] + c_radius
    ]
    draw.ellipse(circle_bbox, outline=white, width=stroke_w)
    
    # Compass Needle: polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88"
    p1 = map_pt(16.24, 7.76)
    p2 = map_pt(14.12, 14.12)
    p3 = map_pt(7.76, 16.24)
    p4 = map_pt(9.88, 9.88)
    
    draw.polygon([p1, p2, p3, p4], outline=white, width=stroke_w)
    
    # Downsample with Lanczos resampling for smooth edges
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    img_dir = os.path.join(root, "assets", "img")
    os.makedirs(img_dir, exist_ok=True)
    
    # Generate 512x512
    icon_512 = render_nusantarapass_icon(512)
    icon_512_path = os.path.join(img_dir, "nusantarapass-icon-green.png")
    icon_512.save(icon_512_path, "PNG")
    print("Saved:", icon_512_path)
    
    # Update logo.png (512)
    logo_path = os.path.join(img_dir, "logo.png")
    icon_512.save(logo_path, "PNG")
    print("Saved:", logo_path)
    
    # Generate 256x256
    icon_256 = render_nusantarapass_icon(256)
    logo_256_path = os.path.join(img_dir, "logo-256.png")
    icon_256.save(logo_256_path, "PNG")
    print("Saved:", logo_256_path)
    
    # Generate 128x128
    icon_128 = render_nusantarapass_icon(128)
    logo_128_path = os.path.join(img_dir, "logo-128.png")
    icon_128.save(logo_128_path, "PNG")
    print("Saved:", logo_128_path)

if __name__ == "__main__":
    main()
