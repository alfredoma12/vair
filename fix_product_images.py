from pathlib import Path
import re

root = Path(r"c:/Users/Alfredo/Desktop/aire")


def pick_image_path(path: Path):
    lower = path.as_posix().lower()

    if "recto-hembra" in lower or "cpcf" in lower:
        return "/img/Conector-Recto-Hembra.png"
    if "recto-macho" in lower or "cpc" in lower:
        return "/img/conector-recto-macho.png"
    if "codo" in lower or "cpl" in lower:
        return "/img/Conector-Codo-Hilo.png"
    if "tee" in lower:
        if "lateral" in lower or "cpd" in lower:
            return "/img/Conector-Tee-Hilo-Lateral.png"
        return "/img/Conector-Tee-Hilo-Central.png"
    if "cpv" in lower:
        return "/img/conexion-codo-para-tubing-cpv.png"
    return None


for path in sorted((root / "producto").rglob("index.html")):
    text = path.read_text(encoding="utf-8")
    new_text = text

    image_path = pick_image_path(path)
    if image_path:
        new_text = re.sub(r'https://sanflex\.cl/[^"\']+', image_path, new_text)
        new_text = re.sub(r'//img/', '/img/', new_text)
        new_text = re.sub(r'(?<!/)img/', '/img/', new_text)

        new_text = re.sub(
            r'(<meta property="og:image" content=")(?:[^"#]+)(")',
            rf'\g<1>{image_path}\2',
            new_text,
        )
        new_text = re.sub(
            r'(<meta name="twitter:image" content=")(?:[^"#]+)(")',
            rf'\g<1>{image_path}\2',
            new_text,
        )
        new_text = re.sub(
            r'(<img[^>]*class="[^"]*detail-photo[^"]*"[^>]*src=")(?:[^"#]+)(")',
            rf'\g<1>{image_path}\2',
            new_text,
        )

    if new_text != text:
        path.write_text(new_text, encoding="utf-8")
        print(path.relative_to(root).as_posix())
