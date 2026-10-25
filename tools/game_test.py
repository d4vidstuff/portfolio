"""Prueba completa de DEBUG.EXE en Chromium (el juego usa canvas 2D, así que se
dibuja de verdad). Saca capturas en la carpeta que se le pase.

Uso: python3 tools/game_test.py <carpeta de capturas>
"""
import sys, threading, http.server, functools, pathlib
from playwright.sync_api import sync_playwright

out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
root = pathlib.Path(__file__).resolve().parent.parent
MOCK = (root / 'tools' / 'smoke.py').read_text().split('MOCK = r"""')[1].split('"""')[0]


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(root)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
errors, log = [], []


def check(name, cond, extra=''):
    log.append(('ok   ' if cond else 'FAIL ') + name + (f'  ({extra})' if extra else ''))


G = "document.querySelector('.game-canvas').gameState()"
C = "document.querySelector('.game-canvas').gameControl"
# deja al jugador mirando hacia un punto
AIM = """(([tx, ty]) => { const g = %s, p = g.player; const a = Math.atan2(ty - p.y, tx - p.x);
  p.dx = Math.cos(a); p.dy = Math.sin(a); p.planeX = -Math.sin(a) * 0.66; p.planeY = Math.cos(a) * 0.66; })""" % G

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 800})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.route('**/three.min.js', lambda r: r.fulfill(body=MOCK, content_type='application/javascript'))
    pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.goto(f'http://127.0.0.1:{srv.server_address[1]}/index.html')
    pg.wait_for_selector('#enter', state='visible'); pg.click('#enter'); pg.wait_for_timeout(2300)
    pg.evaluate("document.querySelector('[data-go=pc]').click()"); pg.wait_for_selector('.win', timeout=9000)
    pg.click('[data-k="debug"]'); pg.wait_for_selector('.game-canvas'); pg.wait_for_timeout(300)
    w0 = pg.evaluate("document.querySelector('.game-canvas').getBoundingClientRect().width")
    pg.dblclick('[data-win="debug"] .win-title'); pg.wait_for_timeout(300)
    w1 = pg.evaluate("document.querySelector('.game-canvas').getBoundingClientRect().width")
    h1 = pg.evaluate("document.querySelector('.game-canvas').getBoundingClientRect().height")
    vis = min(w1, h1 * 1.6)  # ancho visible: object-fit mantiene 320x200
    check('al maximizar, el juego se agranda', vis > w0 * 1.15, f'{w0:.0f}px → {vis:.0f}px de ancho visible')
    canvas = pg.locator('.game-canvas')
    shot = lambda name: canvas.screenshot(path=str(out / f'{name}.png'))
    shot('0-titulo')

    pg.click('.game-canvas'); pg.wait_for_timeout(200)
    check('título → intro del nivel 1', pg.evaluate(G + '.state') == 'intro')
    shot('1-intro')
    pg.wait_for_timeout(500); pg.click('.game-canvas'); pg.wait_for_timeout(100)
    check('intro → juego', pg.evaluate(G + '.state') == 'play')

    # 1) escopeta: un bug a 2 casillas, los demás lejos
    pg.evaluate(f"""(() => {{ const g = {G}; const p = g.player; p.x = 10.5; p.y = 1.5;
      const e = g.enemies[0]; e.x = 12.5; e.y = 1.5; e.awake = false;
      g.enemies.slice(1).forEach(o => {{ o.x = 1.5; o.y = 11.5; o.awake = false; }}); }})()""")
    pg.evaluate(AIM + '([12.5, 1.5])')
    pg.wait_for_timeout(120)
    shot('2-apuntando')
    n0 = pg.evaluate(G + '.enemies.length')
    pg.keyboard.press('Space'); pg.wait_for_timeout(30)
    shot('3-fogonazo')
    pg.wait_for_timeout(370)
    shot('4-bombeo')
    check('la escopeta mata al bug de cerca', pg.evaluate(G + '.enemies.length') == n0 - 1, f"{n0} → {pg.evaluate(G + '.enemies.length')}")
    pg.keyboard.press('Space')
    check('no dispara mientras bombea', pg.evaluate(G + '.player.shotT') > 0.2)
    pg.wait_for_timeout(400)

    # 2) los enemigos encuentran al jugador sin verlo (quedan pocos → salen a buscar)
    pg.evaluate(f"""(() => {{ const g = {G}; g.enemies = g.enemies.slice(0, 2); g.player.hp = 100;
      g.player.x = 14.5; g.player.y = 10.5; g.enemies[0].x = 1.5; g.enemies[0].y = 1.5; g.enemies[1].x = 1.5; g.enemies[1].y = 9.5; }})()""")
    d0 = pg.evaluate(f"(() => {{ const g = {G}; return Math.min(...g.enemies.map(e => Math.hypot(e.x - g.player.x, e.y - g.player.y))); }})()")
    pg.wait_for_timeout(5000)
    d1 = pg.evaluate(f"(() => {{ const g = {G}; return Math.min(...g.enemies.map(e => Math.hypot(e.x - g.player.x, e.y - g.player.y))); }})()")
    check('los bugs buscan al jugador por el laberinto', d1 < d0 - 4, f'{d0:.1f} → {d1:.1f}')

    # 3) automapa
    pg.keyboard.press('KeyM'); pg.wait_for_timeout(100)
    shot('5-mapa')
    check('M abre el mapa', pg.evaluate(G + '.showMap'))
    pg.keyboard.press('KeyM')

    # 4) recorrer los 4 niveles; en cada uno, mirar al enemigo más cercano y probar que disparan
    for lvl in range(4):
        pg.evaluate(C + f'.loadLevel({lvl})'); pg.evaluate(C + ".setState('play')")
        pg.wait_for_timeout(100)
        name = pg.evaluate(f"document.querySelector('.game-canvas').gameState().level")
        target = pg.evaluate(f"""(() => {{ const g = {G}, p = g.player;
          const shooters = g.enemies.filter(e => e.type !== 'bug');
          const pool = shooters.length ? shooters : g.enemies;
          const e = pool.sort((a, b) => Math.hypot(a.x-p.x,a.y-p.y) - Math.hypot(b.x-p.x,b.y-p.y))[0];
          // pararse a 3.5 casillas en línea recta, si hay lugar libre
          for (const [dx, dy] of [[-3,0],[3,0],[0,-3],[0,3],[-2,0],[2,0],[0,-2],[0,2]]) {{
            const x = e.x + dx, y = e.y + dy; const ch = g.map[y|0]?.[x|0];
            if (ch && !'#%='.includes(ch)) {{ p.x = x; p.y = y; break; }}
          }}
          return [e.x, e.y, e.type]; }})()""")
        pg.evaluate(AIM + f'([{target[0]}, {target[1]}])')
        pg.wait_for_timeout(1800 if target[2] == 'bug' else 3200)
        shot(f'6-nivel-{lvl + 1}')
        if target[2] != 'bug':
            hp = pg.evaluate(G + '.player.hp'); bolts = pg.evaluate(G + '.bolts.length')
            check(f'nivel {lvl + 1}: {target[2]} dispara', hp < 100 or bolts > 0, f'salud {hp}, proyectiles {bolts}')
        pg.evaluate(f"(() => {{ const g = {G}; g.player.hp = 100; [...g.enemies].forEach(e => {C}.kill(e)); }})()")
        check(f'nivel {lvl + 1} completo', pg.evaluate(G + '.state') == 'clear')
    shot('7-ultimo-nivel-completo')
    pg.wait_for_timeout(900); pg.click('.game-canvas'); pg.wait_for_timeout(200)
    check('después del nivel 4: pantalla de victoria', pg.evaluate(G + '.state') == 'win')
    shot('8-victoria')

    # 5) morir y reintentar el nivel
    pg.evaluate(C + '.loadLevel(2)'); pg.evaluate(C + ".setState('play')")
    pg.evaluate(f"(() => {{ const g = {G}; g.player.hp = 5; }})()")
    pg.evaluate(f"(() => {{ const g = {G}; const e = g.enemies[0]; e.x = g.player.x + 0.4; e.y = g.player.y; e.cool = 0; e.awake = true; }})()")
    pg.wait_for_timeout(400)
    check('con salud 0 aparece SEGMENTATION FAULT', pg.evaluate(G + '.state') == 'dead')
    shot('9-derrota')
    pg.wait_for_timeout(200); pg.click('.game-canvas'); pg.wait_for_timeout(100)
    check('reintentar vuelve al mismo nivel', pg.evaluate(G + '.level') == 2 and pg.evaluate(G + '.player.hp') == 100)
    # 6) música: con el sonido activado, el bus de efectos tiene que tener señal mientras se juega
    pg.dblclick('[data-win="debug"] .win-title'); pg.wait_for_timeout(200)
    r0 = pg.evaluate("document.querySelector('.game-canvas').getBoundingClientRect().width")
    hdl = pg.locator('[data-win="debug"] .win-rs-se').bounding_box()
    pg.mouse.move(hdl['x'] + 5, hdl['y'] + 5); pg.mouse.down(); pg.mouse.move(hdl['x'] + 200, hdl['y'] + 120, steps=6); pg.mouse.up()
    pg.wait_for_timeout(150)
    r1 = pg.evaluate("document.querySelector('.game-canvas').getBoundingClientRect().width")
    check('al estirar la ventana, el juego se agranda', r1 > r0 + 100, f'{r0:.0f}px → {r1:.0f}px')
    pg.click('#btnSound'); pg.wait_for_timeout(300)
    pg.evaluate("""import('./js/audio/sound.js').then(({ sound }) => {
      const a = sound.ctx.createAnalyser(); a.fftSize = 2048; sound.sfxBus.connect(a); window.__an = a; })""")
    pg.evaluate(C + '.loadLevel(3)'); pg.evaluate(C + ".setState('play')")
    pg.wait_for_timeout(1500)
    rms = "(() => { const a = window.__an, d = new Float32Array(a.fftSize); let m = 0; for (let i = 0; i < 20; i++) { a.getFloatTimeDomainData(d); for (const v of d) m = Math.max(m, Math.abs(v)); } return m; })()"
    peak = pg.evaluate(rms)
    check('suena la banda sonora mientras se juega', peak > 0.02, f'pico {peak:.3f}')
    pg.click('[data-win="debug"] .win-x'); pg.wait_for_timeout(1200)
    peak2 = pg.evaluate(rms)
    check('al cerrar el juego, la música para', peak2 < peak * 0.3, f'pico {peak2:.3f}')
    b.close()

print('\n'.join(log))
print('errores de página:', errors or 'ninguno')
sys.exit(1 if errors or any(l.startswith('FAIL') for l in log) else 0)
