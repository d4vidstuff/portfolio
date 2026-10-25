"""Graba un video de DEBUG.EXE jugando solo (un "bot" que apunta y dispara) y lo
guarda en img/proyectos/02/ como WebM (VP9) y MP4 (H.264), más un póster JPG.

Uso: python3 tools/record_game_video.py
Necesita Playwright y ffmpeg.
"""
import pathlib, subprocess, tempfile, threading, http.server, functools
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
out = root / 'img' / 'proyectos' / '02'
MOCK = (root / 'tools' / 'smoke.py').read_text().split('MOCK = r"""')[1].split('"""')[0]
SECONDS = 14


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(root)))
threading.Thread(target=srv.serve_forever, daemon=True).start()

# El bot: cada cuadro gira hacia el enemigo más cercano que ve, avanza si está
# lejos y dispara cuando lo tiene en la mira. La salud se mantiene alta para que
# el video no termine en "SEGMENTATION FAULT".
BOT = """(() => {
  const c = document.querySelector('.game-canvas');
  const g = c.gameState(), ctl = c.gameControl;
  ctl.loadLevel(1); ctl.setState('play');
  g.enemies.forEach(e => e.awake = true);
  function step() {
    if (!c.isConnected) return;
    requestAnimationFrame(step);
    const p = g.player;
    p.hp = Math.max(p.hp, 70);
    if (g.state !== 'play') return;
    const vis = g.enemies.filter(e => e.screenX !== undefined && e.depth > 0)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    const e = vis[0] || g.enemies[0];
    if (!e) return;
    const want = Math.atan2(e.y - p.y, e.x - p.x);
    const cur = Math.atan2(p.dy, p.dx);
    let d = ((want - cur + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    const a = cur + Math.max(-0.045, Math.min(0.045, d));
    p.dx = Math.cos(a); p.dy = Math.sin(a); p.planeX = -Math.sin(a) * 0.66; p.planeY = Math.cos(a) * 0.66;
    if (Math.abs(d) < 0.06 && vis.length) ctl.press();
  }
  step();
})()"""

with tempfile.TemporaryDirectory() as tmp, sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}, record_video_dir=tmp, record_video_size={'width': 1280, 'height': 800})
    pg = ctx.new_page()
    pg.route('**/three.min.js', lambda r: r.fulfill(body=MOCK, content_type='application/javascript'))
    pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg.goto(f'http://127.0.0.1:{srv.server_address[1]}/index.html')
    pg.wait_for_selector('#enter', state='visible'); pg.click('#enter'); pg.wait_for_timeout(2300)
    pg.evaluate("document.querySelector('[data-go=pc]').click()"); pg.wait_for_selector('.win', timeout=9000)
    pg.click('[data-k="debug"]'); pg.wait_for_selector('.game-canvas')
    pg.dblclick('[data-win="debug"] .win-title'); pg.wait_for_timeout(400)
    box = pg.evaluate("""(() => { const c = document.querySelector('.game-canvas'), r = c.getBoundingClientRect();
      const k = Math.min(r.width / 320, r.height / 200); const w = 320 * k, h = 200 * k;
      return [r.left + (r.width - w) / 2, r.top + (r.height - h) / 2, w, h]; })()""")
    t0 = pg.evaluate('performance.now()')
    pg.evaluate(BOT)
    pg.wait_for_timeout(SECONDS * 1000)
    video = pg.video.path()
    ctx.close(); b.close()
    # el video de Playwright arranca al abrir la página: se salta hasta que empieza el bot
    start = max(0, t0 / 1000 - 0.2)
    x, y, w, h = [int(round(v)) for v in box]
    w -= w % 2; h -= h % 2
    crop = f'crop={w}:{h}:{x}:{y},scale=640:400:flags=neighbor'
    common = ['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{start:.2f}', '-i', video, '-t', str(SECONDS - 1), '-vf', crop, '-an']
    subprocess.run(common + ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1', str(out / 'debug-exe.webm')], check=True)
    subprocess.run(common + ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(out / 'debug-exe.mp4')], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '3', '-i', str(out / 'debug-exe.mp4'), '-frames:v', '1', '-q:v', '4', str(out / 'debug-exe.jpg')], check=True)

for f in ['debug-exe.webm', 'debug-exe.mp4', 'debug-exe.jpg']:
    print(f, (out / f).stat().st_size // 1024, 'KB')
