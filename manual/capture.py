import json, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
if ROOT.name == 'tests': ROOT = ROOT.parent
HUB = (ROOT.parent / 'hub' / 'index.html').read_text()
SEED = (ROOT.parent / 'data' / 'sample-data.json').read_text()
FONTDIR = ROOT / 'node_modules' / '@fontsource'

FONTS = [('Familjen Grotesk', 'familjen-grotesk', [500, 600, 700]),
         ('Atkinson Hyperlegible', 'atkinson-hyperlegible', [400, 700]),
         ('JetBrains Mono', 'jetbrains-mono', [400, 500])]
font_css = ''
font_files = {}
for fam, slug, ws in FONTS:
    for w in ws:
        name = f'{slug}-latin-{w}-normal.woff2'
        font_files['/f/' + name] = (FONTDIR / slug / 'files' / name).read_bytes()
        font_css += f"@font-face{{font-family:'{fam}';font-weight:{w};font-style:normal;src:url(https://fonts.gstatic.com/f/{name}) format('woff2')}}\n"

MOCK = r"""
<script>
(() => {
  const DATA = %s; window.DATA = DATA;
  const L = {};
  const snap = c => ({docs:Object.entries(DATA[c] || {}).map(([id, d]) => ({id, exists:true, data:() => JSON.parse(JSON.stringify(d))}))});
  const fire = c => (L[c] || []).forEach(f => setTimeout(() => f(snap(c)), 0));
  const ref = (c, id) => ({
    set:async d => { (DATA[c] = DATA[c] || {})[id] = JSON.parse(JSON.stringify(d)); fire(c); },
    update:async d => { DATA[c] = DATA[c] || {}; DATA[c][id] = {...(DATA[c][id] || {}), ...JSON.parse(JSON.stringify(d))}; fire(c); },
    delete:async () => { delete DATA[c][id]; fire(c); },
    get:async () => ({exists:!!DATA[c]?.[id], data:() => DATA[c]?.[id]})});
  const db = {collection:c => ({onSnapshot:(next) => { (L[c] = L[c] || []).push(next); setTimeout(() => next(snap(c)), 0); return () => {}; },
      add:async d => { const id = 'x' + Math.random().toString(36).slice(2, 8); await ref(c, id).set(d); return ref(c, id); }, doc:id => ref(c, id)}),
    doc:p => { const [c, id] = p.split('/'); return ref(c, id); }};
  window.__DATA = DATA;
  const IDEAS = [
    {title:'Insurer renewal readiness checklist', format:'One-pager', channel:'Email + events', hook:'A one-page list of what insurers now ask clinics to prove about recovery.', why:'Matches the campaign offer and gives Bluebonnet a leave-behind for the lunch & learn.'},
    {title:'The 4-hour recovery clock', format:'Social graphic', channel:'LinkedIn', hook:'Shows how a tested recovery plan turns a week offline into an afternoon.', why:'Visual, shareable, and points to the free readiness assessment.'},
    {title:'Lunch & learn: what we tested this quarter', format:'Event invite', channel:'Email', hook:'Invite clinic IT leads to see a live recovery drill over lunch in Austin.', why:'Drives registrations for the November 6 event.'},
    {title:'Why local recovery support matters', format:'LinkedIn post', channel:'Bluebonnet LinkedIn', hook:'A story-led post about who answers the phone when systems go down.', why:'Gives Bluebonnet visible credit for its 24/7 local desk.'},
    {title:'Five questions for your board about downtime', format:'Email', channel:'Bluebonnet newsletter', hook:'Helps clinic administrators brief their board on recovery risk.', why:'Reaches the economic buyer behind the IT director.'}];
  const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 160" width="480" height="160"><rect x="10" y="10" width="140" height="140" rx="30" fill="#C2571A"/><path d="M40 112 L80 48 L120 112 Z" fill="#fff"/><circle cx="80" cy="96" r="14" fill="#C2571A"/><text x="170" y="74" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="38" font-weight="800" fill="#111827">Bluebonnet</text><text x="170" y="116" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" font-weight="500" fill="#C2571A">IT Solutions</text></svg>';
  const chatReply = async (input, opts) => {
    const ask = input.split('\nUSER\n').pop();
    let text = '';
    const say = async t => { for (const w of t.split(/(?= )/)) { text += w; opts.onText?.({text}); await new Promise(r => setTimeout(r, 4)); } };
    const call = async (name, args) => { const t = opts.tools.find(x => x.name === name); return t.execute(args); };
    if (/summary/i.test(ask)) {
      await call('update_summary', {field:'valueProp', value:'Ransomware-ready backup and same-day recovery for Texas clinics, delivered and supported locally by Bluebonnet on the Northwind platform.'});
      await call('update_summary', {field:'offerings', value:'Northwind Backup and Recovery inside Bluebonnet managed tiers; quarterly restore drills and insurer-ready recovery reports as a Bluebonnet service.'});
      await say('I drafted two summary fields for you to review: a tighter joint value proposition and the joint offerings, now including the quarterly restore drill Bluebonnet runs. Apply them below if they look right.');
    } else if (/goal|certif/i.test(ask)) {
      await call('add_goal', {metric:'certs', target:4, period:'FY27', label:'Certified people', notes:'2 sales, 2 technical'});
      await call('add_onboarding_step', {phase:'enable', title:'Technical certification: 2nd engineer', owner:'partner', due:'2026-12-15'});
      await say('Bluebonnet has one technical engineer certified. I proposed a goal of 4 certified people for FY27 and a step to certify a second engineer by December 15.');
    } else if (/attached/i.test(ask) || /ATTACHED FILES/.test(input)) {
      await say('The rate card lists three Bluebonnet managed tiers. Northwind Backup appears only in the top tier. Bundling it into the middle tier would put it in front of most of their clinic customers. Want me to add that as an onboarding step?');
    } else await say('Two Activate steps are open: first closed-won deal (overdue) and the first QBR. Everything in Recruit, Onboard and Enable is done.');
    return {text};
  };
  const COURSE = {title:'Selling Recovery to Manufacturers', summary:'Help partners position tested recovery for plant-floor systems and win the first project.', certName:'Northwind Manufacturing Recovery Specialist', modules:[
    {title:'Why plants need tested recovery', lessons:[{type:'text', title:'Downtime on the plant floor', minutes:8, body:'## What stops a line\nPlant systems run production schedules, quality checks and shipping.\n- **Scheduling** outages idle crews\n- **Quality** systems hold shipments\n\n**Try it:** List the three systems a plant you know cannot run without.'},
      {type:'text', title:'Who decides', minutes:6, body:'## The buying group\n- Plant manager\n- OT and IT leads\n- Finance\n\n**Try it:** Map the buying group at one account.'},
      {type:'quiz', title:'Check your understanding', minutes:5, questions:[{q:'Who usually feels downtime first?', options:['The plant manager','The marketing team','The auditor','The vendor'], answer:0, explain:'Plant managers own output and feel stoppages first.'},{q:'Which system can hold shipments?', options:['Quality','Email','Payroll','Intranet'], answer:0, explain:'Failed quality checks stop product leaving the plant.'},{q:'What is the Try it exercise about?', options:['Critical systems','Pricing','Logos','Travel'], answer:0, explain:'It asks you to list critical systems.'}]}]},
    {title:'Running the conversation', lessons:[{type:'text', title:'Discovery questions for plants', minutes:9, body:'## Ask about the last outage\n1. What stopped?\n2. How long until you were back?\n\n**Try it:** Use one question this week.'},
      {type:'quiz', title:'Module quiz', minutes:5, questions:[{q:'Best opening question?', options:['What stopped in your last outage?','What is your budget?','Who is your vendor?','How many users?'], answer:0, explain:'Past outages reveal the real gap.'},{q:'What follows discovery?', options:['A recovery readiness assessment','A discount','A webinar','Nothing'], answer:0, explain:'The assessment turns the gap into a plan.'},{q:'What should you record?', options:['Required vs actual recovery time','Office address','Logo colours','Fax number'], answer:0, explain:'That gap is the business case.'}]}]}]};
  const sample = async (input, opts = {}) => opts.tools ? chatReply(input, opts) : /first-touch email/.test(input) ? {text:'Subject: A quick recovery check before your renewal\n\nHi [First name],\n\nTeams like yours have been asked by insurers to prove they can recover, not just back up. We run a 45-minute readiness review with your IT lead that ends with a written summary you can hand to your carrier.\n\nWould [day] or [day] work for a short call?\n\nBest,\n[Partner rep]'} : /hand-off note/.test(input) ? {text:'Hi team,\n\nPassing you a warm lead: [Name], [title] at [company]. They came through our webinar and asked about tested recovery ahead of an insurance renewal.\n\nSuggested first move: offer the 45-minute readiness review this week. Could you accept in the portal and send us a quick update by Friday?\n\nThanks!'} : /logo mark/i.test(input) ? {text:LOGO} : /Write one lesson/.test(input) ? {text:'## Key idea\nTested recovery turns a backup into a plan the business can rely on.\n\n- **Measure** recovery time against the target\n- **Record** gaps and fixes\n\n**Try it:** Time one restore this week.'} : ({text:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 627" width="1200" height="627"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2442C9"/><stop offset="1" stop-color="#16287A"/></linearGradient></defs><rect width="1200" height="627" fill="url(#g)"/><circle cx="960" cy="320" r="190" fill="#D98A1F" fill-opacity=".9"/><circle cx="960" cy="320" r="120" fill="none" stroke="#fff" stroke-width="14"/><path d="M960 220v100l70 40" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round"/><text x="70" y="110" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="#fff" fill-opacity=".85" letter-spacing="2">NORTHWIND CLOUD × BLUEBONNET IT SOLUTIONS</text><text x="70" y="230" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="800" fill="#fff">Recover in hours,</text><text x="70" y="305" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="800" fill="#fff">not weeks</text><text x="70" y="370" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#fff" fill-opacity=".9">Tested, immutable recovery for Texas clinics.</text><rect x="70" y="470" rx="28" width="380" height="56" fill="#fff"/><text x="100" y="506" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#2442C9">Book a readiness assessment</text></svg>'});
  sample.json = async (input) => /engage one account together/.test(input) ? {summary:'The partner already runs this customer\'s infrastructure, so a warm introduction is the fastest way in. Lead with a recovery review the partner hosts.', plays:[{title:'Partner-hosted recovery review',motion:'Partner intro',lead:'Partner',why:'The partner has the relationship and the trust; a review gives the buyer value before any pitch.',steps:['Partner: ask the IT director for 45 minutes','Vendor: prepare the assessment template','Joint: run the review and share findings','Partner: propose a pilot'],talkTrack:'We have been helping teams like yours prove recovery to insurers. Would a short review be useful?',targets:['IT director','CFO'],signals:['Review booked','They share the current plan']},{title:'Executive alignment breakfast',motion:'Executive alignment',lead:'Joint',why:'Gets both sponsors in front of the buyer early.',steps:['Vendor: invite the regional VP','Partner: invite the CIO','Joint: agree a 90-day plan'],talkTrack:'A short breakfast to compare notes on resilience priorities.',targets:['CIO'],signals:['Sponsor named']}]} : /Rank the account/.test(input) ? {items:Object.values(DATA.accounts||{}).length ? Object.entries(DATA.accounts).slice(0,5).map(([id,a]) => ({accountId:id, partnerId:Object.keys(a.partners||{})[0]||'', why:'The partner already serves them and you have no pipeline yet.', firstMove:'Ask the partner owner for a warm introduction this week.', lead:'Partner'})) : []} : /joint go-to-market messaging/.test(input) ? {positioning:'For regional manufacturers who cannot afford a week of downtime, Northwind Cloud and the partner deliver recovery that is tested before it is needed.', tagline:'Back online in hours. Proven every quarter.', vendorValue:'Northwind Cloud provides immutable backups and one-console orchestrated recovery.', partnerValue:'The partner runs quarterly restore drills on site and answers the phone locally, day or night.', jointValue:'Plants get a recovery plan with a measured restore time and a written report insurers accept.', proofPoints:['Quarterly restore drill with written report','[X]-hour recovery time for line systems','Local engineers on site within [X] hours'], ctas:['Book a recovery drill','Join the roundtable']} : /field-marketing manager planning a joint event/.test(input) ? {agenda:[{time:'11:30',item:'Arrival, check-in and lunch',owner:'Partner'},{time:'11:50',item:'Welcome and why recovery testing matters now',owner:'Partner'},{time:'12:05',item:'Live recovery demo',owner:'Vendor'},{time:'12:35',item:'Customer panel: what insurers ask for',owner:'Both'},{time:'12:55',item:'Readiness assessment offer and close',owner:'Partner'}], promo:[{when:'T-28 days',channel:'email',action:'Invite to the partner customer list'},{when:'T-21 days',channel:'field sales',action:'Vendor reps invite named accounts'},{when:'T-14 days',channel:'LinkedIn',action:'Speaker graphic and post'},{when:'T-7 days',channel:'phone',action:'Partner inside sales calls registrants'},{when:'T-1 day',channel:'email',action:'Logistics reminder'}]} : /You design partner training/.test(input) ? COURSE : /multiple-choice questions that check/.test(input) ? {questions:[{q:'What proves a recovery plan works?', options:['A timed test restore','A purchase order','A brochure','A logo'], answer:0, explain:'Only a measured restore proves recovery time.'},{q:'Where should tests restore to?', options:['An isolated environment','Production','A laptop','Email'], answer:0, explain:'Isolation keeps tests safe.'}]} : /brainstorm/i.test(input) ? IDEAS : {headline:'Five questions your insurer will ask about recovery', subhead:'What Texas clinics need to show before renewal, and how to get there.', body:'Cyber insurers have changed the questions. They now want proof that you can recover, not just a backup policy.\n\n- When did you last test a full restore?\n- How long would your EHR be offline?\n- Are your backups immutable?\n- Who runs recovery if your team is unavailable?\n- Where is your written recovery report?\n\nBluebonnet IT Solutions and Northwind Cloud run a recovery drill every quarter and hand you the report your insurer asks for.', cta:'Book a readiness assessment'};
  const dl = {save:async (o) => { window.__dl = {filename:o?.filename, size:o?.data?.size}; return {status:'saved'}; }};
  sample.limits = async () => ({images:true});
  let upN = 0; const up = {upload:async f => { upN++; return {id:'as' + upN, url:URL.createObjectURL(f)}; }};
  const NROWS = {}; let nN = 0; window.__mcpCalls = [];
  const mcp = {
    listTools:async () => ({servers:[{server:'Apollo.io', authStatus:'connected', tools:[]}, {server:'Notion', authStatus:'connected', tools:[]}]}),
    callTool:async (server, tool, input) => {
      window.__mcpCalls.push([server, tool, input]);
      if (tool === 'apollo_contacts_search') return {payload:{contacts:[{id:'apc1', name:'Sam Rivera', first_name:'Sam', last_name:'Rivera', title:'IT Director', email:'sam.rivera@mesaclinic.example', organization_name:'Mesa Family Clinic', account:{name:'Mesa Family Clinic', domain:'mesaclinic.example', city:'Tucson', state:'Arizona'}}, {id:'apc2', name:'Lee Park', first_name:'Lee', last_name:'Park', title:'CFO', email:'lee.park@desertlogistics.example', organization_name:'Desert Logistics', account:{name:'Desert Logistics', domain:'desertlogistics.example'}}], pagination:{total_pages:1}}};
      if (tool === 'apollo_deals_search') return {payload:{opportunities:[{id:'apd1', name:'Mesa Family Clinic - Backup', amount:42000, closed_date:'2026-12-20', account:{name:'Mesa Family Clinic'}}], pagination:{total_pages:1}}};
      if (tool === 'apollo_contacts_create') return {payload:{contact:{id:'apnew1'}}};
      if (tool === 'apollo_accounts_create') return {payload:{account:{id:'apacc1'}}};
      if (tool === 'notion-create-pages') { const k = input.parent.data_source_id; NROWS[k] = NROWS[k] || []; return {payload:{pages:input.pages.map(p => { const id = 'np' + (++nN); NROWS[k].push({...p.properties, url:'https://app.notion.com/p/' + id}); return {id, url:'https://app.notion.com/p/' + id, properties:p.properties}; })}}; }
      if (tool === 'notion-update-page') return {payload:{page_id:input.page_id}};
      if (tool === 'notion-query-data-sources') { const k = input.data.data_source_url.replace('collection://', ''); const rows = (NROWS[k] || []).map(r => ({...r})); if (rows[0]) { const f = Object.keys(rows[0]).find(x => /Next step$/.test(x)); if (f) rows[0][f] = 'Edited in Notion'; } rows.push({...(Object.fromEntries(Object.entries(rows[0] || {}).map(([x]) => [x, '']))), [Object.keys(rows[0] || {Lead:1})[0]]:'Added in Notion row', url:'https://app.notion.com/p/npnew'}); return {payload:{results:rows, has_more:false}}; }
      throw {code:'tool_error', message:'unknown tool'};
    }
  };
  window.claude = {use:async n => n === 'db' ? db : n === 'user' ? {can:() => true, id:async () => 'u_me'} : n === 'sample' ? sample : n === 'downloads' ? dl : n === 'assets' ? up : n === 'mcp' ? mcp : null};
})();
</script>
""" % SEED

PAGE = ('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>:root{color-scheme:light;box-sizing:border-box}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style>'
        '</head><body>' + MOCK + HUB + '</body></html>')

FIND = """([specs]) => specs.map(([sel, txt, idx]) => {
  let els = [...document.querySelectorAll(sel)];
  if (txt) els = els.filter(e => { const h = e.querySelector('h2,h3'); return (h ? h.textContent : e.textContent).trim().startsWith(txt); });
  const e = els[idx || 0]; if (!e) return null;
  const r = e.getBoundingClientRect();
  return {x:r.left + scrollX, y:r.top + scrollY, w:r.width, h:r.height};
})"""

SHOTS = [
  # id, hash, viewport w, callouts [(selector, heading text, index)], extra action, clip height (None=full page)
  ('home', 'home', 1320, [('.search',None,0),('.rail',None,0),('.kpis',None,0),('section.panel','Needs attention',0),('section.panel','Partners',0),('section.panel','Source tools',0),('.focuspick',None,0)], None, None),
  ('focus', 'home', 1320, [('#focusBar',None,0),('.focuspick',None,0),('.kpis',None,0),('#rail',None,0)], 'focus', 900),
  ('search', 'home', 1320, [('#q',None,0),('#results',None,0)], 'search', 560),
  ('partner', 'p-keystone', 1320, [('.crumbs',None,0),('.phead .row',None,1),('.kpis',None,0),('section.panel','Lifecycle',0),('section.panel','Campaigns and MDF',0),('section.panel','Profile',0)], None, 1500),
  ('lifecycle', 'p-bluebonnet', 1320, [('.lcbar',None,0),('.lcitems',None,0),('.lcact',None,0)], 'lc', 760),
  ('partners', 'partners', 1320, [('.phead .btn.primary',None,0),('.lcfunnel',None,0),('.lcfunnel .ready',None,0),('th','',2)], 'thtext', 900),
  ('mdflist', 'mdf', 1320, [('.phead .row',None,0),('.mdfpool',None,0),('.seg',None,0),('th','',6),('th','',7)], 'thtext', 1300),
  ('mdf', 'm4', 1320, [('.chainstrip',None,0),('section.panel','Workflow',0),('section.panel','Request history',0),('section.panel','Pipeline credited',0),('section.panel','Funds this campaign',0)], None, None),
  ('campaign', 'c1', 1320, [('.phead .row',None,1),('.chainstrip',None,0),('section.panel','Brief',0),('section.panel','Joint messaging',0),('section.panel','Discussion',0),('section.panel','Funded by',0)], None, None),
  ('event', 'e3', 1320, [('.banner',None,0),('.chainstrip .cs',None,3),('.chainstrip .cs',None,4),('section.panel','Results',0)], None, 820),
  ('runsheet', 'e1', 1320, [('.phead .btn',None,0),('section.panel','Run sheet',0),('.rsadd',None,0),('section.panel','Results',0),('section.panel','Budget and funding',0),('section.panel','Agenda and promotion',0)], None, None),
  ('newevent', 'events', 1320, [('.opmodal .opgrid',None,0),('#op_date',None,0),('#op_mdfId',None,0),('[data-act="opsave"]',None,0)], 'opnew', 900),
  ('settings', 'home', 1320, [('#op_mdfPool',None,0),('#op_roiTarget',None,0),('#op_voice',None,0)], 'opset', 900),
  ('deal', 'DS038', 1320, [('.phead .row',None,0),('.kpis',None,0),('section.panel table',None,0),('#touchForm',None,0),('.phead .ext',None,0)], None, None),
  ('attribution', 'attribution', 1320, [('.seg',None,0),('.kpis',None,0),('section.panel','Where the money went',0),('section.panel','By campaign',0),('section.panel','By MDF request',0),('section.panel','Reported vs attributed',0)], None, None),
  ('board', 'board', 1320, [('.subtabs',None,0),('.chips',None,0),('.funnel',None,0),('.card',None,0),('.card select',None,0)], None, 900),
  ('map', 'map', 1320, [('.subtabs',None,0),('.mapfilters',None,0),('.mapfilters .chips',None,0),('.zoomctl',None,0),('.maplg',None,0),('.mpanel',None,0)], None, 1180),
  ('maprec', 'map', 1320, [('.mrec .mmetrics',None,0),('.mrec .msec',None,0),('.mrec .msec',None,1),('.mrec .msec',None,3),('.mrec .msec',None,4),('.mrec > .row',None,1),('.mrec .msec.terr',None,0)], 'rec', None),
  ('forecast', 'forecast', 1320, [('.seg',None,0),('.kpis',None,0),('section.panel','Forecast by close month',0),('section.panel','Categories',0),('section.panel','Needs attention',0),('section.panel','Weighted forecast by partner',0)], None, None),
  ('engagement', 'engagement', 1320, [('section.panel','Partner scorecard',0),('aside section.panel',None,0),('#engForm',None,0),('section.panel','Weekly activity',0),('section.panel','Engagement vs pipeline',0)], None, None),
  ('tools', 'tools', 1320, [('.tool',None,0),('.tool .jump',None,0)], None, None),
  ('content', 'content', 1320, [('.kpis',None,0),('.cfilters',None,0),('.cboard .col[data-cstage="review"] .ccard',None,0),('.subtabs',None,0),('.phead .btn.primary',None,0)], None, 1000),
  ('brainstorm', 'brainstorm', 1320, [('#bsForm',None,0),('.campset',None,0),('.ideas .idea',None,0),('section.panel','Saved ideas',0),('section.panel','Add an idea',0)], 'bs', None),
  ('asset', 'a-ex1', 1320, [('section.panel','Assignment',0),('section.panel','Copy',0),('section.panel','Graphic design',0),('section.panel','Workflow',0),('section.panel','Approvals',0),('section.panel','Comments',0)], None, None),
  ('plan', 'plan', 1320, [('.plannav',None,0),('section.panel','Partnership summary',0),('section.panel','Onboarding',0),('section.panel','Goals',0),('section.panel','Brand guide',0),('section.panel','Logos',0),('aside.chat',None,0)], None, None),
  ('planchat', 'plan', 1320, [('.chatlog',None,0),('.cprop',None,0),('.cchipsrow',None,0),('.chatform',None,0)], 'planchat', 1000),
  ('academy', 'academy', 1320, [('.kpis',None,0),('.subtabs',None,0),('.acfilters',None,0),('.ccourse',None,1),('.phead .row',None,0)], None, 1150),
  ('course', 'crs-sales', 1320, [('.phead .row',None,1),('section.panel','Course outline',0),('.kpis',None,0),('section.panel','Certification',0),('section.panel','Learners',0)], None, 1750),
  ('learners', 'academy-learners', 1320, [('section.panel','Completion by partner',0),('section.panel','Learners',0)], None, 1500),
  ('player', 'en-s030', 1320, [('.pout',None,0),('.phead .sub',None,0),('.pprog',None,0),('.plesson h2',None,0),('.pnav',None,0)], None, None),
  ('leadmap', 'leads', 1320, [('.lmbar',None,0),('.kpis',None,0),('section.panel','Overlap matrix',0),('.ovlkey',None,0),('section.panel','Best accounts',0),('section.panel','Overlaps to work',0)], 'prio', 2050),
  ('account', 'ac-s001', 1320, [('.phead .row',None,1),('section.panel','Partner mapping',0),('section.panel','Co-sell plan',0),('section.panel','Engagement brainstorm',0),('section.panel','People',0),('section.panel','Opportunities',0)], 'plays', 2000),
  ('lead', 'ld-s007', 1320, [('.mflow',None,0),('section.panel','Hand-off',0),('section.panel','Partner hand-off note',0),('section.panel','History',0),('section.panel','Account',0)], None, None),
  ('leadimport', 'leads-import', 1320, [('section.panel','1. What',0),('section.panel','2. Add',0),('section.panel','3. Match',0),('section.panel','4. Check',0)], 'limp', None),
  ('crm', 'leads-crm', 1320, [('section.panel','Notion',0),('section.panel','Apollo.io',0),('section.panel','Salesforce',0),('section.panel','Sync history',0)], 'crm', 1250),
  ('regqueue', 'dealreg', 1320, [('.phead .row',None,0),('.subtabs',None,0),('.kpis',None,0),('section.panel table',None,0)], None, None),
  ('reg', 'dr-s010', 1320, [('section.panel','Conflict check',0),('section.panel','Decision',0),('section.panel','Opportunity',0),('section.panel','Submitted by',0)], None, None),
  ('portal', 'portal', 1320, [('.ptwho',None,0),('.portal .subtabs',None,0),('.ptlead',None,0),('section.panel','Leads you',0)], 'portal', 900),
  ('portalreg', 'portal', 1320, [('#ptForm fieldset',None,0),('#ptForm fieldset',None,2),('#ptForm button[type=submit]',None,0)], 'portalreg', 1300),
  ('accept', 'dealreg-leads', 1320, [('.kpis',None,0),('section.panel','Waiting for an answer',0),('section.panel','By partner',0)], None, 1650),
  ('imp', 'map', 1320, [('.modal section',None,0),('.impmap',None,0),('.modal .grid2',None,0),('.modal .tw',None,0),('[data-act="imprun"]',None,0)], 'imp', 1500),
  ('mobile', 'home', 390, [('.rail',None,0),('.kpis',None,0)], None, 1100),
]

out = {}
only = sys.argv[1:]
with sync_playwright() as p:
    b = p.chromium.launch()
    for sid, h, vw, specs, act, clip_h in SHOTS:
        if only and sid not in only: continue
        ctx = b.new_context(viewport={'width':vw, 'height':900}, device_scale_factor=2 if vw < 500 else 1.5, color_scheme='light')
        page = ctx.new_page()
        page.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=font_css))
        page.route('https://fonts.gstatic.com/**', lambda r: r.fulfill(status=200, content_type='font/woff2', body=font_files.get('/' + r.request.url.split('fonts.gstatic.com/')[1], b'')))
        page.route('https://hub.local/**', lambda r: r.fulfill(status=200, content_type='text/html', body=PAGE))
        page.goto('https://hub.local/#' + h)
        page.wait_for_timeout(500)
        page.evaluate('document.fonts.ready')
        if act == 'rec':
            page.click('.mrow[data-cid="C1038"]'); page.wait_for_timeout(250)
            page.add_style_tag(content='.mpanel{max-height:none!important}.mrec{overflow:visible!important}')
            page.evaluate("document.querySelector('.mrec').scrollIntoView()")
            page.evaluate("window.scrollTo(0,0)")
        if act == 'focus':
            page.click('#focusInput'); page.keyboard.type('keys', delay=30); page.keyboard.press('Enter'); page.wait_for_timeout(300); page.evaluate("document.activeElement.blur()"); page.wait_for_timeout(300)
        if act == 'bs':
            page.select_option('#bsPartner','p-bluebonnet'); page.wait_for_timeout(150); page.check('input[data-bscamp="c1"]'); page.fill('#bsAngle','insurer renewals'); page.click('#bsForm button[type=submit]'); page.wait_for_timeout(500)
        if act == 'imp':
            page.set_viewport_size({'width':vw, 'height':1500}); page.wait_for_timeout(100)
            page.click('[data-act="impopen"]'); page.wait_for_timeout(200)
            page.set_input_files('#impFile', str(ROOT / 'test.csv')); page.wait_for_timeout(400)
            page.select_option('#impDup','update'); page.wait_for_timeout(200)
        if act == 'planchat':
            page.set_viewport_size({'width':vw, 'height':1000}); page.wait_for_timeout(100)
            page.click('[data-act=chatchip]'); page.wait_for_timeout(1500)
            page.set_input_files('#chatFile', str(ROOT / 'rates.csv')); page.wait_for_timeout(500)
            page.fill('#chatIn', 'Compare this rate card with our offerings'); page.evaluate("document.activeElement.blur(); window.scrollTo(0,230); document.getElementById('toastRoot').innerHTML=''"); page.wait_for_timeout(200)
        if act == 'lc':
            page.set_viewport_size({'width':vw, 'height':760}); page.wait_for_timeout(100)
            page.click('[data-act=lcview][data-i="3"]'); page.wait_for_timeout(200); page.evaluate("document.querySelector('.lcpanel').scrollIntoView({block:'start'}); window.scrollBy(0,-90)"); sy0 = page.evaluate('scrollY')
        if act == 'opnew':
            page.click('[data-act=opnew][data-kind=event]'); page.wait_for_timeout(250); page.fill('#op_name','Manufacturing DR breakfast, Columbus'); page.select_option('#op_partnerId','p-lakeshore'); page.wait_for_timeout(200); page.fill('#op_location','[Venue], Columbus'); page.evaluate('document.activeElement.blur()')
        if act == 'opset':
            page.click('[data-act=opsettings]'); page.wait_for_timeout(250); page.evaluate('document.activeElement.blur()')
        if act == 'prio':
            page.click('[data-act=lmprio]'); page.wait_for_timeout(500)
        if act == 'plays':
            page.click('[data-act=acctplays]'); page.wait_for_timeout(600)
        if act == 'limp':
            page.click('[data-act=lisample]'); page.wait_for_timeout(300)
        if act == 'crm':
            page.click('[data-act=apfetch]'); page.wait_for_timeout(500)
        if act in ('portal','portalreg'):
            page.select_option('#ptPartner','p-cedar'); page.fill('#ptName','Jamie Cole'); page.fill('#ptEmail','jamie.cole@cedarridge.example'); page.wait_for_timeout(250)
            if act == 'portalreg': page.click('[data-act=pttab][data-val=register]'); page.wait_for_timeout(250)
            page.evaluate('document.activeElement.blur()')
        if act in ('prio','plays','limp','crm','portal','portalreg'):
            page.evaluate('document.activeElement && document.activeElement.blur(); window.scrollTo(0,0)'); page.wait_for_timeout(250)
        if act == 'search':
            page.click('#q'); page.keyboard.type('blue', delay=30); page.wait_for_timeout(200)
        page.wait_for_timeout(300)
        boxes = page.evaluate(FIND, [specs])
        if act in ('planchat','lc'):
            sy = page.evaluate('scrollY'); boxes = [dict(b, y=b['y'] - sy) if b else b for b in boxes]
        full = page.evaluate('({w:document.documentElement.scrollWidth, h:document.documentElement.scrollHeight})')
        H = min(full['h'], clip_h) if clip_h else full['h']
        page.screenshot(path=str(ROOT / 'shots' / f'{sid}.png'), full_page=(act not in ('imp','planchat','opnew','opset','lc')), clip=None if act in ('planchat','lc') else {'x':0, 'y':0, 'width':vw, 'height':H})
        out[sid] = {'w':vw, 'h':H, 'boxes':boxes}
        print(sid, vw, H, [bool(x) for x in boxes])
        ctx.close()
    b.close()
prev = json.loads((ROOT / 'boxes.json').read_text()) if (ROOT / 'boxes.json').exists() and only else {}
prev.update(out)
(ROOT / 'boxes.json').write_text(json.dumps(prev, indent=1))
