exec(open(__import__('pathlib').Path(__file__).resolve().parent.parent / 'capture.py').read().split('SHOTS = [')[0])
open('rates.csv','w').write("Tier,Price,Includes\nEssentials,$95/user,Helpdesk\nProfessional,$140/user,Helpdesk + security\nPremier,$185/user,Everything + Northwind Backup\n")
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1320,'height':900}); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=font_css))
    pg.route('https://fonts.gstatic.com/**', lambda r: r.fulfill(status=200, content_type='font/woff2', body=font_files.get('/' + r.request.url.split('fonts.gstatic.com/')[1], b'')))
    pg.route('https://hub.local/**', lambda r: r.fulfill(status=200, content_type='text/html', body=PAGE))
    pg.goto('https://hub.local/#p-bluebonnet'); pg.wait_for_timeout(800)
    T=lambda s: pg.evaluate(s)
    pg.click('[data-act=openplan]'); pg.wait_for_timeout(400)
    print('route', T("location.hash"), T("document.querySelector('h1').textContent"), T("document.querySelector('.pcomp').textContent"))
    print('help icons', T("[...document.querySelectorAll('#main .qh')].map(a=>a.dataset.help)"))
    print('phases', T("[...document.querySelectorAll('.ph')].map(x=>x.textContent).join(' | ')"))
    print('goals', T("[...document.querySelectorAll('.goal .gnum')].map(x=>x.textContent).join(' | ')"))
    pg.screenshot(path=str(ROOT / 'out' / 'plan-full.png'), full_page=True)
    # summary edit
    pg.fill('#ps-term','18 months'); pg.wait_for_timeout(100)
    print('focus kept', T("document.activeElement.id"), 'dirty', T("!!document.querySelector('#pl-summary .pill.warn')"))
    pg.click('[data-act=pssave]'); pg.wait_for_timeout(300); print('term saved', T("window.__DATA.plans['p-bluebonnet'].summary.term"))
    # brand dos raw
    pg.fill('#pb-dos','Line one\n\nLine two\n'); pg.click('[data-act=pbsave]'); pg.wait_for_timeout(300); print('dos', T("window.__DATA.plans['p-bluebonnet'].brand.dos"))
    # step toggle
    pg.click('#pl-onboard li:not(.done) input[type=checkbox]'); pg.wait_for_timeout(300); print('done', T("window.__DATA.plans['p-bluebonnet'].onboarding.filter(s=>s.done).length"))
    # add goal
    pg.select_option('#gMetric','deals'); pg.fill('#gTarget','12'); pg.click('#goalForm button[type=submit]'); pg.wait_for_timeout(300); print('goals n', T("window.__DATA.plans['p-bluebonnet'].goals.length"))
    # logo AI + download
    pg.click('[data-act=logoai]'); pg.wait_for_timeout(500); print('logos', T("window.__DATA.plans['p-bluebonnet'].logos.length"), T("document.querySelectorAll('.logo').length"))
    pg.click('[data-act=logodl][data-key="lockup-light"][data-kind=png]'); pg.wait_for_timeout(300)
    pg.click('[data-act=logodl][data-key="concept-1"][data-kind=svg]'); pg.wait_for_timeout(200)
    # chat: chip
    pg.click('[data-act=chatchip]:has-text("Draft the partnership summary")'); pg.wait_for_timeout(1500)
    print('proposals', T("[...document.querySelectorAll('.cprop li')].map(x=>x.textContent)"))
    pg.click('[data-act=propapply]'); pg.wait_for_timeout(300)
    print('applied valueProp', T("window.__DATA.plans['p-bluebonnet'].summary.valueProp")[:50], T("window.__DATA.plans['p-bluebonnet'].summary.term"))
    # chat typed with goals
    pg.fill('#chatIn','Add a certification goal'); pg.keyboard.press('Enter'); pg.wait_for_timeout(1500)
    print('proposals2', T("[...document.querySelectorAll('.cprop li')].map(x=>x.textContent)"))
    pg.click('[data-act=propapply]'); pg.wait_for_timeout(300)
    print('goals', T("window.__DATA.plans['p-bluebonnet'].goals.length"), 'steps', T("window.__DATA.plans['p-bluebonnet'].onboarding.length"))
    # attach file
    pg.set_input_files('#chatFile','rates.csv'); pg.wait_for_timeout(500)
    print('att chips', T("[...document.querySelectorAll('.chatform .catt span')].map(x=>x.textContent)"))
    pg.fill('#chatIn','What does this tell us?'); pg.click('#chatForm button[type=submit]'); pg.wait_for_timeout(1500)
    print('last reply', T("window.__DATA.plans['p-bluebonnet'].chat.slice(-1)[0].text")[:60], 'files', T("window.__DATA.plans['p-bluebonnet'].files.map(f=>f.name+':'+f.readable)"))
    print('chat msgs', T("document.querySelectorAll('.cbub').length"))
    pg.screenshot(path=str(ROOT / 'out' / 'plan-chat.png'), full_page=False)
    # files upload
    pg.set_input_files('#planFile','test.csv'); pg.wait_for_timeout(400); print('files n', T("window.__DATA.plans['p-bluebonnet'].files.length"))
    # harbor no plan
    pg.select_option('#planPick','p-harbor'); pg.wait_for_timeout(300); print('banner', T("document.querySelector('.banner')?.textContent.slice(0,40)"))
    pg.click('[data-act=plancreate]'); pg.wait_for_timeout(300); print('harbor saved', T("!!window.__DATA.plans['p-harbor']"))
    # focus mode
    T("localStorage.setItem('pcc.focus','p-keystone')"); pg.goto('https://hub.local/#plan'); pg.reload(); pg.wait_for_timeout(800); print('focus h1', T("document.querySelector('h1').textContent"), 'picker', T("!!document.querySelector('#planPick')"))
    # nav jump
    pg.click('.plannav a[data-to=pl-logos]'); pg.wait_for_timeout(600); print('hash after jump', T("location.hash"), T('scrollY'), T('document.documentElement.scrollHeight-innerHeight'), T("Math.round(document.getElementById('pl-logos').getBoundingClientRect().top)"))
    pg.set_viewport_size({'width':390,'height':844}); pg.wait_for_timeout(300)
    print('overflow', T("document.documentElement.scrollWidth"), )
    pg.screenshot(path=str(ROOT / 'out' / 'plan-phone.png'), full_page=True)
    print('ERR', errs)
