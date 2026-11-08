exec(open(__import__('pathlib').Path(__file__).resolve().parent.parent / 'capture.py').read().split('SHOTS = [')[0])
with sync_playwright() as p:
    b=p.chromium.launch(); errs=[]; pg=b.new_page(viewport={'width':1320,'height':900})
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=font_css))
    pg.route('https://fonts.gstatic.com/**', lambda r: r.fulfill(status=200, content_type='font/woff2', body=font_files.get('/' + r.request.url.split('fonts.gstatic.com/')[1], b'')))
    pg.route('https://hub.local/**', lambda r: r.fulfill(status=200, content_type='text/html', body=PAGE))
    T=lambda s: pg.evaluate(s); W=lambda n=250: pg.wait_for_timeout(n)
    pg.goto('https://hub.local/#academy'); W(800)
    print('rail', T("[...document.querySelectorAll('#rail a')].find(a=>a.textContent.includes('Academy'))?.textContent"))
    print('kpis', T("[...document.querySelectorAll('.kpi .v')].map(x=>x.textContent)"), 'cards', T("document.querySelectorAll('.ccourse').length"), 'help', T("document.querySelectorAll('#main .qh').length"))
    pg.screenshot(path=str(ROOT / 'out' / 'ac-catalog.png'), full_page=True)
    pg.click('.chip[data-v="technical"]'); W(); print('tech cards', T("document.querySelectorAll('.ccourse').length")); pg.click('.chip[data-v=""]'); W()
    pg.click('.subtabs a[href="#academy-learners"]'); W(); print('learners rows', T("document.querySelectorAll('tbody tr').length"), 'help', T("document.querySelectorAll('#main .qh').length")); pg.screenshot(path=str(ROOT / 'out' / 'ac-learners.png'), full_page=True)
    pg.click('.subtabs a[href="#academy-certs"]'); W(); print('cert rows', T("document.querySelectorAll('section.panel tbody tr').length"))
    pg.click('.chip[data-v="expiring"]'); W(); print('expiring', T("document.querySelectorAll('section.panel tbody tr').length")); pg.click('.chip[data-v=""]'); W()
    pg.click('section.panel tbody tr a.btn >> nth=0'); W(400); print('cert view', T("location.hash"), T("!!document.querySelector('.certprev img')")); pg.screenshot(path=str(ROOT / 'out' / 'ac-cert.png'))
    pg.click('[data-act=accertdl][data-kind=png]'); W(400)
    # course page
    pg.goto('https://hub.local/#crs-sales'); W(500); print('course', T("document.querySelector('h1').textContent"), T("[...document.querySelectorAll('.kpi .v')].map(x=>x.textContent)"), 'help', T("document.querySelectorAll('#main .qh').length"))
    pg.screenshot(path=str(ROOT / 'out' / 'ac-course.png'), full_page=True)
    # assign modal
    pg.click('.phead [data-act=acassign]'); W(); pg.select_option('#asPartner','p-wasatch'); W()
    print('people', T("document.querySelectorAll('[data-aspick]').length"), T("document.querySelector('[data-act=asgo]').textContent"))
    pg.click('[data-act=asall]'); W(); print('btn', T("document.querySelector('[data-act=asgo]').textContent")); pg.screenshot(path=str(ROOT / 'out' / 'ac-assign.png'))
    pg.click('[data-act=asgo]'); W(500); print('enrollments wasatch sales', T("Object.values(window.__DATA.enrollments).filter(e=>e.partnerId==='p-wasatch'&&e.courseId==='crs-sales').length"), 'modal', T("!!document.querySelector('.scrim')"))
    eid = T("Object.entries(window.__DATA.enrollments).find(([k,e])=>e.partnerId==='p-wasatch'&&e.courseId==='crs-sales')[0]")
    # player: complete lessons and quizzes
    pg.goto('https://hub.local/#'+eid); W(500); print('player', T("document.querySelector('.plesson h2').textContent"))
    pg.screenshot(path=str(ROOT / 'out' / 'ac-player.png'), full_page=True)
    for step in range(20):
        if T("!!document.querySelector('#quizForm button[type=submit]')"):
            ans = T(f"(()=>{{const e=window.__DATA.enrollments['{eid}'];const c=window.__DATA.courses[e.courseId];const id=document.querySelector('#quizForm').dataset.l;const l=c.modules.flatMap(m=>m.lessons).find(x=>x.id===id);return l.quiz.questions.map(q=>q.answer)}})()")
            # first answer one wrong to test fail+retake on first quiz
            if step == 2:
                wrong=[(a+1)%4 for a in ans]
                for qi,a in enumerate(wrong): pg.check(f'#quizForm input[name="q{qi}"][value="{a}"]')
                pg.click('#quizForm button[type=submit]'); W(400); print('fail banner', T("document.querySelector('.quiz .banner')?.textContent.trim().slice(0,40)"))
                pg.screenshot(path=str(ROOT / 'out' / 'ac-quizfail.png'), full_page=True)
                pg.click('[data-act=qretake]'); W()
            for qi,a in enumerate(ans): pg.check(f'#quizForm input[name="q{qi}"][value="{a}"]')
            pg.click('#quizForm button[type=submit]'); W(400); print('quiz', T("document.querySelector('.quiz .banner')?.textContent.trim().slice(0,30)"))
            nxt = pg.locator('.pnav [data-act=plgo]').last
            if T("document.querySelector('.pnav [data-act=plgo]:last-child')?.textContent.includes('Finish')"):
                nxt.click(); W(400); break
            nxt.click(); W(300)
        elif T("!!document.querySelector('[data-act=pldone]')"):
            pg.click('[data-act=pldone]'); W(400)
        else: break
    e = T(f"window.__DATA.enrollments['{eid}']")
    print('completed', bool(e.get('completedAt')), 'score', e.get('score'), 'cert', e.get('certId'), e.get('certExpires'), 'view', T("!!document.querySelector('.certprev')"))
    pg.screenshot(path=str(ROOT / 'out' / 'ac-done.png'), full_page=True)
    # preview mode
    pg.goto('https://hub.local/#preview-crs-onboard'); W(400); print('preview', T("document.querySelector('.pill.warn')?.textContent"))
    pg.click('[data-act=pldone]'); W(); print('preview prog', T("document.querySelector('.pprog .small').textContent"), 'db untouched', T("Object.values(window.__DATA.enrollments).length"))
    # editor: create course, add lesson, quiz, AI
    pg.goto('https://hub.local/#academy'); W(400)
    pg.click('[data-act=acnew]'); W(600); cid=T("location.hash.slice(1)"); print('new course', cid, T("!!document.querySelector('#cf-title')"))
    pg.fill('#cf-title','Test course'); pg.select_option('#cf-track','technical'); W(100); print('dirty', T("!document.querySelector('#cDirty').hidden"))
    pg.fill('[data-lf="0.0.body"]','Hello **world**'); 
    pg.click('[data-act=claiwrite]'); W(500); print('ai lesson', T("document.querySelector('[data-lf=\"0.0.body\"]').value.slice(0,20)"))
    pg.click('[data-act=cladd][data-type=quiz]'); W(); pg.click('[data-act=claiquiz]'); W(500); print('quiz qs', T("document.querySelectorAll('.qedq').length"))
    pg.check('input[data-ccf="cert.enabled"]'); pg.fill('#cf-certname','Test Cert')
    pg.click('[data-act=csave]'); W(400); c=T(f"window.__DATA.courses['{cid}']"); print('saved', c['title'], c['track'], c['cert'], len(c['modules'][0]['lessons']), c['modules'][0]['lessons'][1]['quiz']['questions'][0]['q'][:30] if len(c['modules'][0]['lessons'])>1 else None)
    pg.click('[data-act=cpublish]'); W(300); print('status', T(f"window.__DATA.courses['{cid}'].status"))
    pg.screenshot(path=str(ROOT / 'out' / 'ac-newcourse.png'), full_page=True)
    # AI course builder
    pg.goto('https://hub.local/#academy'); W(300); pg.click('[data-act=acgen]'); W(); pg.fill('#agTopic','Selling recovery to manufacturers'); pg.screenshot(path=str(ROOT / 'out' / 'ac-gen.png'))
    pg.click('#acGenForm button[type=submit]'); W(1200); gid=T("location.hash.slice(1)"); print('gen', gid, T(f"window.__DATA.courses['{gid}']?.title"), T(f"window.__DATA.courses['{gid}']?.modules.length"), 'editor', T("!!document.querySelector('#cf-title')"))
    pg.screenshot(path=str(ROOT / 'out' / 'ac-gen-editor.png'), full_page=True)
    # contact & partner panels, plan note, attention, search, focus
    pg.goto('https://hub.local/#p-keystone'); W(400); print('partner training', T("[...document.querySelectorAll('section.panel h2')].some(h=>h.textContent.startsWith('Training'))"), T("[...document.querySelectorAll('section.panel')].find(s=>s.querySelector('h2')?.textContent.startsWith('Training'))?.querySelectorAll('.li').length"))
    pg.goto('https://hub.local/#C1038'); W(400); print('contact training', T("[...document.querySelectorAll('section.panel')].find(s=>s.querySelector('h2')?.textContent.startsWith('Training'))?.querySelectorAll('.li').length"))
    pg.click('section.panel [data-act=acassign]'); W(); print('assign prefilled', T("document.querySelector('#asPartner').value"), T("document.querySelectorAll('[data-aspick]:checked').length")); pg.click('[data-act=acclose]'); W()
    pg.goto('https://hub.local/#plan'); W(400); print('plan notes', T("[...document.querySelectorAll('.acnote')].map(a=>a.textContent)"), 'certs goal', T("[...document.querySelectorAll('.goal')].map(g=>g.textContent.replace(/\\s+/g,' ').slice(0,60)).filter(t=>/Certified/.test(t))"))
    pg.goto('https://hub.local/#home'); W(400); print('attention academy', T("[...document.querySelectorAll('.li .t')].map(x=>x.textContent).filter(t=>/training|Certification/.test(t)).length"))
    pg.click('#q'); pg.keyboard.type('certified'); W(); print('search', T("[...document.querySelectorAll('#results .res')].map(r=>r.textContent.slice(0,40))"))
    pg.keyboard.press('Escape')
    T("localStorage.setItem('pcc.focus','p-bluebonnet')"); pg.goto('https://hub.local/#academy-learners'); pg.reload(); W(800)
    print('focus learners', T("document.querySelectorAll('section.panel tbody tr').length"), T("[...document.querySelectorAll('.acmatrix tbody tr')].length"))
    pg.set_viewport_size({'width':390,'height':844}); pg.goto('https://hub.local/#crs-sales'); W(400); print('mobile overflow', T('document.documentElement.scrollWidth'))
    pg.goto('https://hub.local/#'+eid); W(400); print('mobile player overflow', T('document.documentElement.scrollWidth')); pg.screenshot(path=str(ROOT / 'out' / 'ac-mobile.png'), full_page=True)
    print('ERR', errs)
