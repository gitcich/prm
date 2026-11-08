exec(open(__import__('pathlib').Path(__file__).resolve().parent.parent / 'capture.py').read().split('SHOTS = [')[0])
def setup(pg):
    pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=font_css))
    pg.route('https://fonts.gstatic.com/**', lambda r: r.fulfill(status=200, content_type='font/woff2', body=b''))
    pg.route('https://hub.local/**', lambda r: r.fulfill(status=200, content_type='text/html', body=PAGE))
order = lambda pg: pg.evaluate("[...document.querySelectorAll('#rail a[data-tab]')].map(a=>a.dataset.tab).join(',')")
def drag(pg, src, dst, hold=450, after=False):
    a = pg.locator(f'#rail a[data-tab={src}]').bounding_box(); b = pg.locator(f'#rail a[data-tab={dst}]').bounding_box()
    pg.mouse.move(a['x']+a['width']/2, a['y']+a['height']/2); pg.mouse.down(); pg.wait_for_timeout(hold)
    tx = b['x']+b['width']*(0.85 if after else 0.15); ty = b['y']+b['height']*(0.85 if after else 0.15)
    pg.mouse.move(tx, ty, steps=12); pg.wait_for_timeout(100)
    mid = pg.evaluate("document.querySelector('#rail').classList.contains('reordering')")
    pg.mouse.up(); pg.wait_for_timeout(400); return mid
with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    pg = b.new_page(viewport={'width':1320,'height':900}); setup(pg); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('https://hub.local/#home'); pg.wait_for_timeout(900)
    o0 = order(pg); print('start', o0)
    # quick click still navigates
    pg.click('#rail a[data-tab=mdf]'); pg.wait_for_timeout(300); print('click navigates', pg.evaluate('location.hash'))
    # quick drag (no hold) does nothing
    a = pg.locator('#rail a[data-tab=events]').bounding_box(); pg.mouse.move(a['x']+20,a['y']+10); pg.mouse.down(); pg.mouse.move(a['x']+20,a['y']-120,steps=5); pg.mouse.up(); pg.wait_for_timeout(200)
    print('no-hold unchanged', order(pg) == o0)
    hash0 = pg.evaluate('location.hash')
    mid = drag(pg, 'dealreg', 'partners'); o1 = order(pg)
    print('during drag', mid, '| moved', o1.split(',')[:4], '| no navigation', pg.evaluate('location.hash') == hash0)
    print('saved', pg.evaluate("localStorage.getItem('pcc.tabOrder')")[:60], 'reset btn', pg.evaluate("!!document.querySelector('[data-act=tabreset]')"))
    drag(pg, 'home', 'academy', after=True); print('home to after academy', order(pg))
    pg.reload(); pg.wait_for_timeout(900); print('persists', order(pg) == pg.evaluate("JSON.parse(localStorage.getItem('pcc.tabOrder')).join(',')"))
    # escape cancels
    a = pg.locator('#rail a[data-tab=mdf]').bounding_box(); before = order(pg)
    pg.mouse.move(a['x']+20,a['y']+10); pg.mouse.down(); pg.wait_for_timeout(450); pg.mouse.move(a['x']+20,a['y']-200,steps=8); pg.keyboard.press('Escape'); pg.mouse.up(); pg.wait_for_timeout(300)
    print('escape cancels', order(pg) == before)
    # keyboard
    pg.focus('#rail a[data-tab=leads]'); i0 = order(pg).split(',').index('leads'); pg.keyboard.press('Alt+Shift+ArrowUp'); pg.wait_for_timeout(200)
    print('keyboard', order(pg).split(',').index('leads') == i0 - 1, pg.evaluate("document.activeElement.dataset.tab"))
    # rerender during data change keeps order
    pg.evaluate("DATA.partners['p-cedar'].name='Cedar X'; "); 
    pg.click('[data-act=tabreset]'); pg.wait_for_timeout(300); print('reset', order(pg) == o0, pg.evaluate("localStorage.getItem('pcc.tabOrder')"))
    # mobile (horizontal)
    m = b.new_page(viewport={'width':390,'height':844}); setup(m); m.on('pageerror', lambda e: errs.append(str(e)))
    m.goto('https://hub.local/#home'); m.wait_for_timeout(900)
    mo0 = order(m); drag(m, 'mdf', 'home'); print('mobile', order(m).split(',')[:3], m.evaluate('document.documentElement.scrollWidth'))
    m.screenshot(path=str(ROOT / 'out' / 'tabs-m.png'))
    pg.screenshot(path=str(ROOT / 'out' / 'tabs.png'))
    print('ERRS', errs)
