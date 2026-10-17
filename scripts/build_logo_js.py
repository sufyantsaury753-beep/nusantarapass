import os
import base64

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    logo_path = os.path.join(root, "assets", "img", "logo-256.png")
    out_path = os.path.join(root, "assets", "js", "logo-data.js")

    with open(logo_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    content = f"""// Official Brand Logo Data URI (Base64 PNG)
const NUSANTARAPASS_LOGO_BASE64 = "data:image/png;base64,{b64}";
"""
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Successfully generated {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == "__main__":
    main()
