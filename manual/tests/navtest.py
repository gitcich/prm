exec(open(__import__('pathlib').Path(__file__).resolve().parent.parent / 'capture.py').read().split('SHOTS = [')[0])
with sync_playwright() as p:
    b=p.chromium.launch(); errs=[]
    for vw in (1320, 390):
        pg=b.new_page(viewport={'width':vw,'height':900})
        pg.on('pageerror',lambda e: errs.append(str(e)))
        pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=font_css))
        pg.route('https://fonts.gstatic.com/**', lambda r: r.fulfill(status=200, content_type='font/woff2', body=font_files.get('/' + r.request.url.split('fonts.gstatic.com/')[1], b'')))
        pg.route('https://hub.local/**', lambda r: r.fulfill(status=200, content_type='text/html', body=PAGE))
        pg.goto('https://hub.local/#home'); pg.wait_for_timeout(700)
        st=lambda: (pg.evaluate("location.hash"), pg.evaluate("[document.querySelector('#navBack').disabled, document.querySelector('#navBack').title, document.querySelector('#navFwd').disabled, document.querySelector('#navFwd').title]"))
        print(vw, 'start', st())
        if vw==1320:
            pg.click('#rail a[href="#events"]'); pg.wait_for_timeout(200)
            pg.click('tbody tr a >> nth=0'); pg.wait_for_timeout(200); print('event', st())
            pg.click('#navBack'); pg.wait_for_timeout(200); print('back1', st())
            pg.click('#navBack'); pg.wait_for_timeout(200); print('back2', st())
            pg.click('#navFwd'); pg.wait_for_timeout(200); print('fwd', st())
            pg.click('#rail a[href="#mdf"]'); pg.wait_for_timeout(200); print('new branch', st())
            pg.keyboard.press('Alt+ArrowLeft'); pg.wait_for_timeout(200); print('alt-left', st())
            pg.go_back(); pg.wait_for_timeout(200); print('browser back', st())
            pg.screenshot(path=str(ROOT / 'out' / 'nav.png'), clip={'x':0,'y':0,'width':1320,'height':80})
        else:
            print('overflow', pg.evaluate('document.documentElement.scrollWidth'))
            pg.screenshot(path=str(ROOT / 'out' / 'nav-m.png'), clip={'x':0,'y':0,'width':390,'height':70})
    print(errs)
