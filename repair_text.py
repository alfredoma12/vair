from pathlib import Path

root = Path('.')
exts = {'.html', '.js', '.json', '.css', '.xml', '.txt', '.svg'}
markers = ['Ã', 'Â', 'â', 'ðŸ']


def repair_text(text: str) -> str:
    if not text:
        return text
    if not any(marker in text for marker in markers):
        return text

    replacements = [
        ('â€™', '’'), ('â€œ', '“'), ('â€', '”'), ('â€“', '–'), ('â€¢', '•'), ('â€¦', '…'),
        ('â€º', '»'), ('â€¹', '«'), ('Ã¡', 'á'), ('Ã©', 'é'), ('Ã­', 'í'), ('Ã³', 'ó'), ('Ãº', 'ú'),
        ('Ã±', 'ñ'), ('Ã¼', 'ü'), ('Ã¶', 'ö'), ('Ã', 'Ñ'), ('Ã', 'Á'), ('Ã‰', 'É'), ('Ã', 'Í'),
        ('Ã“', 'Ó'), ('Ãš', 'Ú'), ('Â°', '°'), ('Â·', '·'), ('Â ', ' '), ('Â\n', '\n')
    ]
    repaired = text
    for old, new in replacements:
        repaired = repaired.replace(old, new)

    try:
        repaired = repaired.encode('latin-1', 'ignore').decode('utf-8', 'ignore')
    except Exception:
        return text

    return repaired


files = [p for p in root.rglob('*') if p.is_file() and p.suffix.lower() in exts and '.git' not in p.parts]
updated = []
for path in files:
    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        continue
    repaired = repair_text(text)
    if repaired != text:
        path.write_text(repaired, encoding='utf-8')
        updated.append(str(path))

print(f'Updated {len(updated)} files')
for item in updated:
    print(item)
