"""Capturas del sitio en tamaño celular (con Three.js simulado: la escena 3D no
se dibuja, pero todo lo que es HTML sí).

Uso: python3 tools/mobile_shots.py <carpeta de salida> [ancho alto]
"""
import sys, threading, http.server, functools, pathlib
from playwright.sync_api import sync_playwright

out = pathlib.Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
W, H = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (360, 760)
root = pathlib.Path(__file__).resolve().parent.parent
MOCK = (root / 'tools' / 'smoke.py').read_text().split('MOCK = r"""')[1].split('"""')[0]


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(root)))
threading.Thread(target=srv.serve_forever, daemon=True).start()

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': W, 'height': H}, is_mobile=True, has_touch=True, device_scale_factor=2)
    pg = ctx.new_page()
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.route('**/three.min.js', lambda r: r.fulfill(body=MOCK, content_type='application/javascript'))
    pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    pg.goto(f'http://127.0.0.1:{srv.server_address[1]}/index.html')
    pg.wait_for_timeout(400)
    pg.screenshot(path=str(out / '1-carga.png'))
    pg.wait_for_selector('#enter', state='visible', timeout=6000)
    pg.screenshot(path=str(out / '2-carga-lista.png'))
    pg.click('#enter')
    pg.wait_for_timeout(2300)
    pg.screenshot(path=str(out / '3-escritorio.png'))
    go = lambda i: pg.evaluate(f"document.querySelector('[data-go={i}]').click()")
    back = lambda: (pg.click('#btnBack'), pg.wait_for_timeout(2600))
    go('drawer'); pg.wait_for_selector('#ov-cv.in', timeout=5000); pg.wait_for_timeout(500)
    pg.screenshot(path=str(out / '4-cv.png')); back()
    go('modem'); pg.wait_for_selector('#ov-contact.in', timeout=5000); pg.wait_for_timeout(500)
    pg.screenshot(path=str(out / '5-contacto.png')); back()
    go('notes'); pg.wait_for_selector('#ov-notes.in', timeout=5000); pg.wait_for_timeout(500)
    pg.screenshot(path=str(out / '6-notas.png')); back()
    go('pc'); pg.wait_for_selector('.win', timeout=9000); pg.wait_for_timeout(300)
    pg.screenshot(path=str(out / '7-pc.png'))
    pg.click('[data-win="projects"] [data-pid="01"]'); pg.wait_for_timeout(400)
    pg.screenshot(path=str(out / '8-proyecto.png'))
    back()
    pg.click('#btnText'); pg.wait_for_timeout(400)
    pg.screenshot(path=str(out / '9-modo-texto.png'))
    over = pg.evaluate("document.documentElement.scrollWidth > innerWidth")
    b.close()
print('desborde horizontal en modo texto:', over)
print('errores:', errors or 'ninguno')
