exec(open(__import__('pathlib').Path(__file__).resolve().parent.parent / 'capture.py').read().split('SHOTS = [')[0])
routes=['home','partners','p-keystone','mdf','m6','campaigns','c2','events','e3','pipeline','DS038','C1001','attribution','board','map','forecast','engagement','tools']
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1320,'height':900},device_scale_factor=1.5); page=ctx.new_page(); errs=[]
    page.on('pageerror',lambda e: errs.append(str(e)))
    page.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=font_css))
    page.route('https://fonts.gstatic.com/**', lambda r: r.fulfill(status=200, content_type='font/woff2', body=font_files.get('/' + r.request.url.split('fonts.gstatic.com/')[1], b'')))
    page.route('https://hub.local/**', lambda r: r.fulfill(status=200, content_type='text/html', body=PAGE))
    page.goto('https://hub.local/#home'); page.wait_for_timeout(700)
    for r in routes:
        page.evaluate(f"location.hash='{r}'"); page.wait_for_timeout(150)
        keys=page.evaluate("[...document.querySelectorAll('#main .qh')].map(a=>a.dataset.help)")
        print(r,len(keys),keys)
    page.evaluate("location.hash='DS038'"); page.wait_for_timeout(200)
    page.hover('#main section.panel h2 .qh'); page.wait_for_timeout(150)
    page.screenshot(path=str(ROOT / 'out' / 'qh-deal.png'),clip={'x':260,'y':380,'width':1060,'height':300})
    page.evaluate("location.hash='attribution'"); page.wait_for_timeout(200)
    page.hover('#main .kpis .qh'); page.wait_for_timeout(150)
    page.screenshot(path=str(ROOT / 'out' / 'qh-attr.png'),clip={'x':260,'y':90,'width':1060,'height':480})
    print('errors',errs)
