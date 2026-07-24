from pathlib import Path
import json

root = Path(r'c:\Users\Alfredo\Desktop\aire')
image_path = '/img/conector-recto-macho.png'

# Update catalog JSON files used by the site
for json_path in [root / 'sanflex.json', root / 'manguera-pu.json', root / 'acoples -rapidos.json']:
    if not json_path.exists():
        continue
    try:
        data = json.loads(json_path.read_text(encoding='utf-8'))
    except Exception:
        continue
    if not isinstance(data, list):
        continue

    updated = False
    for item in data:
        name = str(item.get('nombre', ''))
        connector_type = str(item.get('tipo_conector', ''))
        if 'Recto Macho' in name or 'Recto Macho' in connector_type:
            if str(item.get('url_imagen', '')) != image_path:
                item['url_imagen'] = image_path
                updated = True
    if updated:
        json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Update static product pages
updated_files = []
for path in sorted(root.glob('producto/*/index.html')):
    text = path.read_text(encoding='utf-8')
    lowered = (path.as_posix() + '\n' + text).lower()
    if 'recto-macho' not in lowered and 'recto macho' not in lowered:
        continue

    new_text = text.replace('conector-recto-macho.png', image_path)
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
        updated_files.append(path.relative_to(root).as_posix())

print(f'Updated product pages: {len(updated_files)}')
for rel in updated_files:
    print(rel)
