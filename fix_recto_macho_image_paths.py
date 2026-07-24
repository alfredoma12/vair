from pathlib import Path
import re

root = Path(r"c:/Users/Alfredo/Desktop/aire")

patterns = [
    (r'///img/img/conector-recto-macho\.png', '/img/conector-recto-macho.png'),
    (r'//img/img/conector-recto-macho\.png', '/img/conector-recto-macho.png'),
    (r'///img/conector-recto-macho\.png', '/img/conector-recto-macho.png'),
    (r'//img/conector-recto-macho\.png', '/img/conector-recto-macho.png'),
    (r'img\\conector-recto-macho\.png', '/img/conector-recto-macho.png'),
    (r'img/conector-recto-macho\.png', '/img/conector-recto-macho.png'),
]

updated_files = []
for path in sorted((root / 'producto').rglob('index.html')):
    text = path.read_text(encoding='utf-8')
    new_text = text
    for pattern, replacement in patterns:
        new_text = re.sub(pattern, replacement, new_text)
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
        updated_files.append(path.relative_to(root).as_posix())

print(f'Updated pages: {len(updated_files)}')
for item in updated_files[:20]:
    print(item)
