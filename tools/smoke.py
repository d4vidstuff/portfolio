"""Prueba de humo en Chromium con un Three.js simulado.

Uso: python3 smoke.py <carpeta servida> <página> [--no-three]
"""
import sys, threading, http.server, functools, json, time
from playwright.sync_api import sync_playwright

root, page_path = sys.argv[1], sys.argv[2]
no_three = '--no-three' in sys.argv
shot_dir = next((a.split('=',1)[1] for a in sys.argv if a.startswith('--shots=')), '/tmp')

MOCK = r"""
(function(){
  function mk(){
    const store = {};
    const f = function(){};
    return new Proxy(f, {
      get(t, k){
        if (k === Symbol.toPrimitive) return () => 0;
        if (k === Symbol.iterator) return function*(){};
        if (k === 'then') return undefined;
        if (k in store) return store[k];
        if (k === 'length') return 0;
        const v = mk(); store[k] = v; return v;
      },
      set(t, k, v){ store[k] = v; return true; },
      apply(){ return mk(); },
      construct(){ return mk(); },
    });
  }
  window.THREE = mk();
})();
"""

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=root))
threading.Thread(target=srv.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{srv.server_address[1]}/'

errors, log = [], []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 800})
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: m.type in ('error',) and errors.append('console: ' + m.text))
    pg.route('**/three.min.js', lambda r: r.abort() if no_three else r.fulfill(body=MOCK, content_type='application/javascript'))
    pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    pg.goto(base + page_path)

    def step(name, fn):
        try:
            fn(); log.append('ok   ' + name)
        except Exception as e:
            log.append('FAIL ' + name + ': ' + str(e).split('\n')[0])

    if no_three:
        pg.wait_for_timeout(1500)
        step('modo texto visible sin Three.js', lambda: pg.wait_for_selector('#tm h1', state='visible', timeout=3000))
        step('nombre en modo texto', lambda: (lambda t: t == 'Ignacio David Gonzalez' or (_ for _ in ()).throw(Exception(t)))(pg.inner_text('#tm h1')))
    else:
        step('botón ENTRAR', lambda: pg.wait_for_selector('#enter', state='visible', timeout=6000))
        step('entrar', lambda: (pg.click('#enter'), pg.wait_for_timeout(2300)))
        go = lambda i: pg.evaluate(f"document.querySelector('[data-go={i}]').click()")
        back = lambda: (pg.click('#btnBack'), pg.wait_for_timeout(2600))
        step('PC arranca el sistema', lambda: (go('pc'), pg.wait_for_selector('#osDesk', state='visible', timeout=9000)))
        step('ventanas iniciales', lambda: pg.wait_for_selector('.win', timeout=8000))
        def win_controls():
            W = '[data-win="about"]'
            pg.click(W + ' [data-act="max"]'); assert 'is-max' in pg.get_attribute(W, 'class'), 'max'
            pg.click(W + ' [data-act="max"]'); assert 'is-max' not in pg.get_attribute(W, 'class'), 'restaurar'
            pg.click(W + ' [data-act="min"]'); assert pg.evaluate(f"document.querySelector('{W}').hidden"), 'min'
            pg.click('.os-tab.min'); assert not pg.evaluate(f"document.querySelector('{W}').hidden"), 'tab'
            P = '[data-win="projects"]'
            pg.click(P + ' .win-title')
            b0 = pg.locator(P).bounding_box()
            h = pg.locator(P + ' .win-rs-se').bounding_box()
            pg.mouse.move(h['x'] + 5, h['y'] + 5); pg.mouse.down(); pg.mouse.move(h['x'] - 120, h['y'] - 60, steps=5); pg.mouse.up()
            b1 = pg.locator(P).bounding_box()
            assert b1['width'] < b0['width'] - 100, ('resize', b0, b1)
            t = pg.locator(P + ' .win-title').bounding_box()
            pg.mouse.move(t['x'] + 20, t['y'] + 8); pg.mouse.down(); pg.mouse.move(t['x'] - 40, t['y'] + 48, steps=5); pg.mouse.up()
            b2 = pg.locator(P).bounding_box()
            assert abs(b2['y'] - b1['y'] - 40) < 4, ('drag', b1, b2)
            pg.dblclick(P + ' .win-title'); assert 'is-max' in pg.get_attribute(P, 'class'), 'dblclick'
            pg.screenshot(path=shot_dir + '/os-max.png')
            pg.dblclick(P + ' .win-title')
        step('ventanas: maximizar, minimizar, tamaño, mover', win_controls)
        def terminal():
            pg.click('[data-k="terminal"]')
            pg.wait_for_selector('#termIn', timeout=2000)
            for c in ['help', 'projects', 'open 1', 'contact', 'benja', 'date', 'xyz']:
                pg.fill('#termIn', c); pg.press('#termIn', 'Enter')
            out = pg.inner_text('.term-out')
            for want in ['Comandos:', 'La Metálica', 'nachog.david@gmail.com', 'BENJA.GAT', 'incorrecto']:
                assert want in out, want
            pg.fill('#termIn', 'cls'); pg.press('#termIn', 'Enter')
            assert pg.inner_text('.term-out').strip() == '', 'cls'
        step('terminal', terminal)
        step('abrir proyecto 01', lambda: pg.wait_for_selector('[aria-label="PROYECTO_01.DSK"]', timeout=2000))
        def gallery():
            G = '[data-win="project-01"] '
            cnt = lambda: pg.inner_text(G + '.gal-count')
            assert cnt() == '1 / 5', cnt()
            pg.click(G + '.gal-next'); assert cnt() == '2 / 5', cnt()
            pg.click(G + '.gal-thumb[data-i="4"]'); assert cnt() == '5 / 5', cnt()
            pg.focus(G + '.gal'); pg.keyboard.press('ArrowRight'); assert cnt() == '1 / 5', cnt()
            assert 'Inicio con la aurora' in pg.inner_text(G + '.gal-cap')
            pg.screenshot(path=shot_dir + '/os-gallery.png')
        step('galería de fotos', gallery)
        step('cerrar ventana', lambda: (pg.click('[aria-label="PROYECTO_01.DSK"] .win-x'), pg.wait_for_timeout(200)))
        step('volver de la PC', lambda: (back(), pg.wait_for_selector('#os', state='hidden', timeout=5000)))
        def alert():
            mod = 'drawer-alert.js' if 'index' in page_path else None
            if mod:
                pg.evaluate("import('./js/desk/drawer-alert.js').then(m => m.scheduleDrawerAlert(0))")
                pg.wait_for_function("document.querySelector('#toast').textContent.includes('cajón se agita')", timeout=3000)
        step('alerta del cajón', alert)
        step('cajón abre CV', lambda: (go('drawer'), pg.wait_for_selector('#ov-cv.in', timeout=4000)))
        step('CV con título ICES', lambda: 'ICES' in pg.inner_text('#cvPaper') or (_ for _ in ()).throw(Exception('sin ICES')))
        step('cerrar CV', lambda: (pg.click('#cvPaper [data-close]'), pg.wait_for_timeout(1500), pg.wait_for_selector('#ov-cv', state='hidden', timeout=3000)))
        step('módem abre contacto', lambda: (go('modem'), pg.wait_for_selector('#ov-contact.in', timeout=5000)))
        step('copiar mail', lambda: (pg.click('#copyMail'), pg.wait_for_timeout(300)))
        step('volver con Escape', lambda: (pg.keyboard.press('Escape'), pg.wait_for_timeout(1500), pg.wait_for_selector('#ov-contact', state='hidden', timeout=3000)))
        step('notas', lambda: (go('notes'), pg.wait_for_selector('#ov-notes.in', timeout=4000), back()))
        step('disquete abre proyecto', lambda: (go('floppy1'), pg.wait_for_selector('[aria-label="PROYECTO_02.DSK"]', timeout=9000), back()))
        step('walkman activa sonido', lambda: (go('walkman'), pg.wait_for_timeout(500), pg.wait_for_selector('#btnSound[aria-pressed="true"]', timeout=2000)))
        step('Benja dormido (maullido)', lambda: (go('benja'), pg.wait_for_selector('#toast.on', timeout=2000)))
        def cat():
            if 'index' not in page_path: return
            pg.evaluate("import('./js/cat/benja.js').then(m => { m.Cat.next = 0; })")
            pg.wait_for_function("import('./js/cat/benja.js').then(m => m.Cat.mode === 'walk')", timeout=8000)
        step('Benja se despierta y camina', cat)
        step('modo texto', lambda: (pg.click('#btnText'), pg.wait_for_selector('#tm h1', state='visible', timeout=2000)))
        step('salir de modo texto', lambda: (pg.keyboard.press('Escape'), pg.wait_for_timeout(300), pg.wait_for_selector('#gl', state='visible', timeout=2000)))
    pg.wait_for_timeout(500)
    b.close()

print('\n'.join(log))
print('ERRORES:' if errors else 'sin errores de consola')
seen = set()
for e in errors:
    if e not in seen: print('  ' + e[:300]); seen.add(e)
