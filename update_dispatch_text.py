from pathlib import Path
import re

root = Path(r'c:\Users\Alfredo\Desktop\aire')

old_phrases = [
    '1-3 días hábiles',
    '1-3 dias hábiles',
    '1-3 días habiles',
    '1-3 días hbiles',
    '1-3 das hábiles',
    '1-3 das habiles',
    '1-3 das hbiles',
]

for path in list(root.rglob('*.html')):
    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        continue

    original = text

    for old in old_phrases:
        text = text.replace(old, '5 horas hábiles')

    text = text.replace('5 hrs habiles', '5 hrs hábiles')
    text = text.replace('5 horas habiles', '5 horas hábiles')
    text = text.replace('5 hrs hábiles', '5 hrs hábiles')
    text = text.replace('5 horas hábiles', '5 horas hábiles')
    text = text.replace('despacho :', 'Despacho:')
    text = text.replace('despacho:', 'Despacho:')
    text = re.sub(r'\bhabiles\b', 'hábiles', text, flags=re.IGNORECASE)
    text = re.sub(r'(<span>Despacho:\s*<strong>)([^<]+)(</strong></span>)', lambda m: f"{m.group(1)}5 horas hábiles{m.group(3)}", text, flags=re.IGNORECASE)

    if text != original:
        path.write_text(text, encoding='utf-8')

print('Updated HTML files with the new dispatch wording and spelling fixes.')
