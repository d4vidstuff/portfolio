"""Genera index.html (documento completo) a partir de la fuente del artifact."""
import pathlib, sys
src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'escritorio-86.html').read_text(encoding='utf-8')
head_end = src.index('</style>') + len('</style>')
head, body = src[:head_end], src[head_end:]
doc = ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
       + head + '\n</head>\n<body>\n' + body.strip() + '\n</body>\n</html>\n')
pathlib.Path('index.html').write_text(doc, encoding='utf-8')
print('index.html generado')
