from pathlib import Path
import re

root = Path(r"c:/Users/Alfredo/Desktop/aire")

catalog_path = root / "sanflex.json"
text = catalog_path.read_text(encoding="utf-8")

# Normalize the catalog image references to a root-relative local asset path.
text = re.sub(
    r"https?://sanflex\.cl/\d+-large_default//img/conexion-codo-para-tubing-cpv\.png",
    "/img/conexion-codo-para-tubing-cpv.png",
    text,
)
text = re.sub(
    r"https?://sanflex\.cl/\d+-large_default/conexion-codo-para-tubing-cpv\.jpg",
    "/img/conexion-codo-para-tubing-cpv.png",
    text,
)
text = re.sub(
    r"https?://sanflex\.cl/\d+-large_default/\S*conexion-codo-para-tubing-cpv\.png",
    "/img/conexion-codo-para-tubing-cpv.png",
    text,
)

catalog_path.write_text(text, encoding="utf-8")

page_paths = sorted((root / "producto").rglob("index.html"))
updated_pages = []
patterns = [
    re.compile(r"https?://sanflex\.cl/[^\"']*/conexion-codo-para-tubing-cpv\.(?:jpg|png)"),
    re.compile(r"https?://sanflex\.cl/[^\"']*//img/conexion-codo-para-tubing-cpv\.png"),
]
for page_path in page_paths:
    page_text = page_path.read_text(encoding="utf-8")
    new_page_text = page_text
    for pattern in patterns:
        new_page_text = pattern.sub("/img/conexion-codo-para-tubing-cpv.png", new_page_text)
    if new_page_text != page_text:
        page_path.write_text(new_page_text, encoding="utf-8")
        updated_pages.append(page_path.relative_to(root).as_posix())

print(f"Updated catalog entries: {text.count('/img/conexion-codo-para-tubing-cpv.png')}")
print(f"Updated product pages: {len(updated_pages)}")
for page in updated_pages:
    print(page)
