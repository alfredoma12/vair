import re
from pathlib import Path

root = Path('.')
file_patterns = ['*.html', '*.json', '*.js']
replacements = [
    (r'\brpido\b', 'rápido'),
    (r'\brpida\b', 'rápida'),
    (r'\bRPIDO\b', 'RÁPIDO'),
    (r'\bRPIDA\b', 'RÁPIDA'),
    (r'Caractersticas', 'Características'),
    (r'Medidal', 'Medida'),
    (r'\bConexin\b', 'Conexión'),
    (r'Plstico', 'Plástico'),
    (r'presin', 'presión'),
    (r'Presin', 'Presión'),
    (r'neumatica', 'neumática'),
    (r'neumtica', 'neumática'),
    (r'neumtico', 'neumático'),
    (r'neumticos', 'neumáticos'),
    (r'\bneumatico\b', 'neumático'),
    (r'\bneumaticos\b', 'neumáticos'),
    (r'\bneumaticas\b', 'neumáticas'),
    (r'\bcomponentes neumaticos\b', 'componentes neumáticos'),
    (r'\bplsticas\b', 'plásticas'),
    (r'\bplsticos\b', 'plásticos'),
    (r'\blineas\b', 'líneas'),
    (r'\bhermtico\b', 'hermético'),
    (r'\best\s*diseada\b', 'está diseñada'),
    (r'\bunion pasamuros\b', 'unión pasamuros'),
    (r'\bpasamuro\b', 'pasamuros'),
    (r'\bUnion Pasamuro\b', 'Unión pasamuros'),
    (r'\bUnion\b', 'Unión'),
    (r'\bunión\b', 'unión'),
    (r'\bYee\b', 'YEE'),
    (r'\bdespresurizacin\b', 'despresurización'),
    (r'\bvlvula\b', 'válvula'),
    (r'\ba travs\b', 'a través'),
    (r'\boptimo\b', 'óptimo'),
    (r'I\s+ndustriales', 'Industriales'),
    (r'instalacin', 'instalación'),
    (r'plstico', 'plástico'),
    (r'dimetros', 'diámetros'),
    (r'\bmini vlvula\b', 'mini válvula'),
    (r'\bUnin\b', 'Unión'),
    (r'automatizacin', 'automatización'),
    (r'diseado', 'diseñado'),
    (r'diseo', 'diseño'),
    (r'óóptimo', 'óptimo'),
    (r'fcil', 'fácil'),
    (r'divisin', 'división'),
    (r'reduccin', 'reducción'),
    (r'Yee', 'YEE'),
    (r'flujometro', 'flujómetro'),
    (r'pasamuros', 'pasamuros'),
    (r'Conexión\s*rápida', 'Conexión rápida'),
    (r'\bmini valvula neumática\b', 'mini válvula neumática'),
    (r'\bregulador de flujo neumático\b', 'regulador de flujo neumático'),
    (r'\bconector flujómetro neumático l\b', 'conector flujómetro neumático L'),
    (r'\breducción neumática\b', 'reducción neumática'),
    (r'\bconexión neumática\b', 'conexión neumática'),
]

updated_files = []
for pattern in file_patterns:
    for path in root.rglob(pattern):
        if path.is_file():
            text = path.read_text(encoding='utf-8', errors='ignore')
            new_text = text
            for pat, repl in replacements:
                new_text = re.sub(pat, repl, new_text, flags=re.IGNORECASE)
            if new_text != text:
                path.write_text(new_text, encoding='utf-8')
                updated_files.append(path)
                print(f'updated {path}')

if not updated_files:
    print('no files updated')
else:
    print(f'{len(updated_files)} files updated')
