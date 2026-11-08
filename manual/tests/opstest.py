exec(open(__import__('pathlib').Path(__file__).resolve().parent.parent / 'capture.py').read().split('SHOTS = [')[0])
import json
with sync_playwright() as p:
    b=p.chromium.launch(); errs=[]
    pg=b.new_page(viewport={'width':1320,'height':900})
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.on('console',lambda m: m.type=='error' and errs.append('console:'+m.text))
    pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=font_css))
    pg.route('https://fonts.gstatic.com/**', lambda r: r.fulfill(status=200, content_type='font/woff2', body=b''))
    pg.route('https://hub.local/**', lambda r: r.fulfill(status=200, content_type='text/html', body=PAGE))
    ev=lambda js: pg.evaluate(js)
    T=lambda: ev("document.querySelector('#toastRoot').innerText")
    W=lambda n=250: pg.wait_for_timeout(n)
    pg.goto('https://hub.local/#home'); W(800)
    print('align links', ev("document.querySelectorAll('a[href*=\"8d6b4f32\"]').length"))
    att=ev("[...document.querySelectorAll('.li .t')].map(x=>x.innerText).filter(t=>/Ready to advance|Overdue event|MDF/.test(t))"); print('attention', att[:8])
    # partners list funnel + filter
    pg.goto('https://hub.local/#partners'); W()
    print('funnel', ev("document.querySelector('.lcfunnel').innerText.replace(/\\n/g,' ')"))
    pg.click('.lcfunnel .ready'); W(); print('ready rows', ev("document.querySelectorAll('tbody tr').length"))
    pg.click('.lcfunnel .ready'); W()
    # add partner
    pg.click('text=Add partner'); W()
    pg.fill('#op_name','Test Partner Co'); pg.select_option('#op_type','VAR'); pg.fill('#op_region','Ohio'); pg.fill('#op_mdfAllocated','20000')
    pg.click('[data-act=opsave]'); W(400); print('after add', ev("location.hash"), T())
    pid=ev("location.hash.slice(1)")
    print('lc panel', ev("document.querySelector('.lcpanel').innerText.slice(0,200).replace(/\\n/g,' | ')"))
    for k in ['nda','agreement','icp','sponsor']:
        pg.check(f'[data-lcchk={k}]'); W(150)
    print('advance btn', ev("!!document.querySelector('[data-act=lcadvance]')"))
    pg.click('.lcpanel [data-act=lcadvance]'); W(300); print('stage now', ev(f"DATA.partners['{pid}'].stage"), T())
    pg.click('[data-act=lcview][data-i=\"0\"]'); W(); print('view recruit', ev("document.querySelector('.lcpanel h3').innerText"))
    # edit partner
    pg.click('[data-act=opopen][data-kind=partner]'); W(); pg.fill('#op_contact','Ann Lee'); pg.click('[data-act=opsave]'); W(300); print('contact', ev(f"DATA.partners['{pid}'].contact"))
    # request MDF from partner page
    pg.click('[data-act=opnew][data-kind=mdf]'); W(); pg.fill('#op_activity','Ohio webinar'); pg.fill('#op_amount','5000')
    pg.click('[data-act=opsave]'); W(400); mid=ev("location.hash.slice(1)"); print('mdf', mid, ev(f"DATA.mdf['{mid}'].status"), T())
    pg.click('[data-act=mdfapprove]'); W(300); print('approved', ev(f"DATA.mdf['{mid}'].status"))
    pg.click('[data-act=opopen][data-kind=claim]'); W(); pg.click('[data-act=opsave]'); W(); print('claim validation', ev("document.querySelector('.opmodal [role=alert]')?.innerText"))
    pg.fill('#op_actualLeads','25'); pg.fill('#op_proof','Attendee list and recording'); pg.click('[data-act=opsave]'); W(300); print('claimed', ev(f"DATA.mdf['{mid}'].status"))
    pg.click('[data-act=opopen][data-kind=return]'); W(); pg.fill('#op_note','Need invoice'); pg.click('[data-act=opsave]'); W(300); print('returned', ev(f"DATA.mdf['{mid}'].status"))
    pg.click('[data-act=opopen][data-kind=claim]'); W(); pg.click('[data-act=opsave]'); W(300); pg.click('[data-act=mdfpaid]'); W(300)
    print('paid', ev(f"DATA.mdf['{mid}'].status"), ev(f"DATA.mdf['{mid}'].history.map(h=>h.action+(h.note?':'+h.note:'')).join(' > ')"))
    # MDF list pool
    pg.goto('https://hub.local/#mdf'); W(); print('pool', ev("document.querySelector('.mdfpool').innerText.replace(/\\n/g,' ')"))
    # campaign create
    pg.goto('https://hub.local/#campaigns'); W(); pg.click('text=New campaign'); W()
    pg.fill('#op_name','Ohio recovery push'); pg.select_option('#op_partnerId', pid); pg.fill('#op_goal','30 assessments'); pg.fill('#op_audience','Plant IT managers'); pg.click('[data-act=opsave]'); W(400)
    cid=ev("location.hash.slice(1)"); print('camp', cid, T())
    pg.click('[data-act=msgai]'); W(600); print('msg', ev(f"DATA.campaigns['{cid}'].messaging.tagline"))
    pg.click('[data-act=opopen][data-kind=messaging]'); W(); pg.fill('#op_tagline','Edited tagline'); pg.click('[data-act=opsave]'); W(300); print('msg edit', ev(f"DATA.campaigns['{cid}'].messaging.tagline"), ev(f"DATA.campaigns['{cid}'].messaging.proofPoints.length"))
    pg.fill('#cmtText','Partner sends list Friday'); pg.click('[data-act=cmtpost]'); W(300); print('thread', ev(f"DATA.campaigns['{cid}'].thread.length"), ev("document.querySelector('#cmtText').value"))
    pg.select_option('#campSt','live'); W(300); print('status', ev(f"DATA.campaigns['{cid}'].status"))
    # event create
    pg.goto('https://hub.local/#events'); W(); pg.click('text=New event'); W()
    pg.fill('#op_name','Ohio DR lunch'); pg.select_option('#op_partnerId', pid); W(); pg.select_option('#op_campaignId', cid); pg.click('[data-act=opsave]'); W(400)
    eid=ev("location.hash.slice(1)"); print('event', eid, ev(f"DATA.events['{eid}'].tasks.length"), T())
    pg.check('[data-evtask=\"0\"]'); W(200); print('task0', ev(f"DATA.events['{eid}'].tasks[0].done"))
    pg.click('[data-act=evowner][data-i=\"0\"]'); W(200); print('owner', ev(f"DATA.events['{eid}'].tasks[0].owner"))
    pg.fill('#evTaskLabel','Print badges'); pg.click('[data-act=evtaskadd]'); W(300); print('tasks', ev(f"DATA.events['{eid}'].tasks.length"))
    pg.click('[data-act=evai]'); W(600); print('agenda', ev(f"DATA.events['{eid}'].agenda.split('\\n').length"))
    pg.fill('#evNotes','Parking validated'); pg.click('h1'); W(300); print('notes', ev(f"DATA.events['{eid}'].notes"))
    pg.click('[data-act=opopen][data-kind=results]'); W(); pg.fill('#op_regs','44'); pg.fill('#op_attended','30'); pg.fill('#op_leads','22'); pg.click('[data-act=opsave]'); W(300)
    print('results', ev("[...document.querySelectorAll('section.panel')].find(s=>/Results/.test(s.querySelector('h2')?.innerText)).innerText.replace(/\\n/g,' ')"))
    pg.click('[data-act=evmdf]'); W(); print('mdf prefill', ev("document.querySelector('#op_activity').value"), ev("document.querySelector('#op_eventId').value"))
    pg.click('[data-act=opsave]'); W(400); m2=ev("location.hash.slice(1)"); print('event mdf link', ev(f"DATA.events['{eid}'].mdfId")==m2)
    pg.goto('https://hub.local/#'+eid); W(); pg.screenshot(path=str(ROOT / 'out' / 'ops-event.png'), full_page=True)
    pg.click('[data-act=evdl]'); W(300); print('dl', ev("JSON.stringify(window.__dl||null)")[:80])
    # edit event date shifts
    pg.click('[data-act=opopen][data-kind=event]'); W(); pg.fill('#op_date','2026-12-10'); pg.click('[data-act=opsave]'); W(300)
    # program settings
    pg.goto('https://hub.local/#home'); W(); pg.click('[data-act=opsettings]'); W(); pg.fill('#op_mdfPool','500000'); pg.click('[data-act=opsave]'); W(300); print('pool', ev("DATA.settings.program.mdfPool"), ev("DATA.settings.program.targets"))
    # escape closes
    pg.click('[data-act=opsettings]'); W(); pg.keyboard.press('Escape'); W(); print('closed', ev("!document.querySelector('.opmodal')"))
    # delete campaign
    pg.goto('https://hub.local/#'+cid); W(); pg.click('[data-act=opopen][data-kind=campaign]'); W(); pg.click('[data-act=opdel]'); W(); pg.click('[data-act=opdel]'); W(400); print('camp deleted', ev(f"!DATA.campaigns['{cid}']"), ev(f"DATA.events['{eid}'].campaignId"))
    # existing MDF requested decide on home
    pg.goto('https://hub.local/#m4'); W(); pg.screenshot(path=str(ROOT / 'out' / 'ops-mdf.png'), full_page=True)
    pg.goto('https://hub.local/#p-bluebonnet'); W(); pg.screenshot(path=str(ROOT / 'out' / 'ops-partner.png'), full_page=False)
    pg.goto('https://hub.local/#c1'); W(); pg.screenshot(path=str(ROOT / 'out' / 'ops-camp.png'), full_page=True)
    pg.goto('https://hub.local/#e1'); W(); pg.screenshot(path=str(ROOT / 'out' / 'ops-e1.png'), full_page=True)
    pg.goto('https://hub.local/#tools'); W(); print('tools has align', 'Channel Alignment' in ev("document.body.innerText"))
    # mobile
    m=b.new_page(viewport={'width':390,'height':844}); m.on('pageerror',lambda e: errs.append(str(e)))
    m.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=font_css))
    m.route('https://hub.local/**', lambda r: r.fulfill(status=200, content_type='text/html', body=PAGE))
    for h in ['p-bluebonnet','e1','c1','m4','partners','mdf']:
        m.goto('https://hub.local/#'+h); m.wait_for_timeout(500); print('m',h, m.evaluate('document.documentElement.scrollWidth'))
    m.goto('https://hub.local/#e1'); m.wait_for_timeout(400); m.click('[data-act=opopen][data-kind=event]'); m.wait_for_timeout(200); print('m modal', m.evaluate('document.documentElement.scrollWidth')); m.screenshot(path=str(ROOT / 'out' / 'ops-m-modal.png'))
    print('ERRS', errs)
