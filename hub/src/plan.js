/* ---------- Business plan: summary, onboarding, goals, brand guide, logos, plan assistant ---------- */
const PHASES = [['recruit','Recruit'],['onboard','Onboard'],['enable','Enable'],['activate','Activate'],['grow','Grow']];
const OWNERS = {vendor:'Vendor', partner:'Partner', joint:'Joint'};
const PLAYBOOK = [
  ['recruit','Mutual NDA signed','joint',0,'nda'], ['recruit','Partner agreement signed','joint',7,'agreement'], ['recruit','Executive sponsors named on both sides','joint',7,'sponsor'],
  ['onboard','Portal and PRM access provisioned','vendor',10,'portal'], ['onboard','Kickoff meeting held','joint',14,'kickoff'], ['onboard','Ideal customer profile agreed','joint',21,'icp'], ['onboard','Pricing and deal registration walkthrough','vendor',21,'pricing'],
  ['enable','Sales certification: 2 reps','partner',45,'salescert'], ['enable','Technical certification: 1 engineer','partner',60,'techcert'], ['enable','Demo environment ready','vendor',45,'demo'], ['enable','Joint value proposition and messaging approved','joint',50,'playbook'],
  ['activate','First joint campaign launched','joint',75,'firstcamp'], ['activate','First deal registered','partner',90,'dealreg'], ['activate','First closed-won deal','partner',120,'firstwin'],
  ['grow','Quarterly business review held','joint',120,'qbr'], ['grow','Joint business plan refreshed for next half','joint',180,'jbp']
];
const GOAL_METRICS = {
  pipeline:['Pipeline registered', '$', pid => sum(vals(S.deals).filter(d => d.partnerId === pid && d.stage !== 'lost'), d => d.amount)],
  won:['Closed-won revenue', '$', pid => sum(vals(S.deals).filter(d => d.partnerId === pid && d.stage === 'won'), d => d.amount)],
  deals:['Deals registered', '#', pid => vals(S.deals).filter(d => d.partnerId === pid).length],
  mdfroi:['Pipeline per MDF dollar', '×', pid => { const sp = mdfUsed(pid); return sp ? pipeOf(rollup(S.model).partner[pid]) / sp : 0; }],
  campaigns:['Joint campaigns launched', '#', pid => vals(S.campaigns).filter(c => c.partnerId === pid && ['live','complete'].includes(c.status)).length],
  content:['Content pieces published', '#', pid => vals(S.assets).filter(a => a.partnerId === pid && a.stage === 'published').length],
  certs:['Certified people', '#', pid => (planOf(pid)?.onboarding || []).filter(s => /certification/i.test(s.title) && s.done).reduce((t, s) => t + (parseInt((s.title.match(/(\d+)\s/) || [])[1]) || 1), 0)],
  custom:['Custom goal', '', () => null]
};
const lines = v => Array.isArray(v) ? v.join('\n') : String(v || '');
const toList = v => Array.isArray(v) ? v : String(v || '').split('\n').map(x => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
const fmtGoal = (u, v) => v == null ? '—' : u === '$' ? money(v) : u === '×' ? mult(v) : Math.round(v).toLocaleString('en-US');
const planOf = pid => (S._full || S).plans?.[pid] || S.plans?.[pid] || null;
const planPid = () => (S.focus && S.partners[S.focus]) ? S.focus : (S.planPid && S.partners[S.planPid]) ? S.planPid : sortedPartners()[0]?.id || '';
const uidp = () => Math.random().toString(36).slice(2, 9);
const PCOLORS = ['#2F6FD1','#6B3FA0','#C2571A','#1F8A6C','#4E7D3A','#2E8B9A','#B23A6E','#8A6A00'];
const partnerColor = (pid, pl) => pl?.brand?.partnerColor || PCOLORS[Math.abs([...pid].reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, 7)) % PCOLORS.length];
const initials = n => String(n || '').replace(/\b(the|and|of|inc|llc)\b/gi, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';

function defaultPlan(pid) {
  const p = P(pid) || {}, start = p.joinedAt || today();
  const add = (d, n) => { const x = pd(d); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  return {partnerId:pid,
    summary:{overview:'', valueProp:'', targetMarket:'', offerings:'', sponsorVendor:'', sponsorPartner:'', startDate:start, term:'12 months', period:'FY27'},
    onboarding:PLAYBOOK.map(([phase, title, owner, off, key]) => ({id:uidp(), phase, title, owner, due:add(start, off), done:false, key})),
    goals:[], brand:{partnerColor:partnerColor(pid), typography:'Headlines in Helvetica Neue Bold; body in Helvetica Neue Regular. Never stretch or outline type.', voice:brand().voice, dos:['Name both companies in the first line','Lead with the customer outcome','Use the approved co-brand lockup'], donts:['Don’t change logo colours or proportions','Don’t put the lockup on busy photos','Don’t invent statistics or customer names'], lockupRules:'Vendor logo on the left, partner on the right, separated by a thin rule. Keep clear space equal to the height of the monogram on all sides.', partnerLogo:''},
    logos:[], files:[], chat:[], createdAt:now(), updatedAt:now()};
}
async function savePlan(pid, patch, ok) {
  const exists = !!(S._full || S).plans?.[pid];
  return write(db => exists ? db.doc('plans/' + pid).update({...patch, updatedAt:now()}) : db.doc('plans/' + pid).set({...defaultPlan(pid), ...patch, updatedAt:now()}), ok);
}

/* ----- logo graphics ----- */
function markSVG(name, color, size = 120, round = 26) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${round}" fill="${color}"/><path d="M${size * .18} ${size * .78} Q${size * .5} ${size * .58} ${size * .82} ${size * .78}" stroke="#fff" stroke-opacity=".35" stroke-width="${size * .05}" fill="none" stroke-linecap="round"/><text x="${size / 2}" y="${size * .6}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${size * .42}" font-weight="800" fill="#fff" letter-spacing="-1">${xmlEsc(initials(name))}</text></svg>`;
}
function lockupSVG(vName, vColor, pName_, pColor, mode = 'light', layout = 'h') {
  const ink = mode === 'dark' ? '#FFFFFF' : '#111827', bg = mode === 'dark' ? '#111827' : '#FFFFFF', F = 'font-family="Helvetica Neue, Helvetica, Arial, sans-serif"';
  const m = (x, y, n, c, s) => `<g transform="translate(${x} ${y})"><rect width="${s}" height="${s}" rx="${s * .22}" fill="${c}"/><text x="${s / 2}" y="${s * .62}" text-anchor="middle" ${F} font-size="${s * .42}" font-weight="800" fill="#fff">${xmlEsc(initials(n))}</text></g>`;
  const tw = n => Math.max(80, n.length * 15.5);
  if (layout === 'h') {
    const w1 = tw(vName), w2 = tw(pName_), W = 40 + 64 + 14 + w1 + 40 + 2 + 40 + 64 + 14 + w2 + 40, H = 144;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${bg}"/>
      ${m(40, 40, vName, vColor, 64)}<text x="${118}" y="${82}" ${F} font-size="28" font-weight="700" fill="${ink}">${xmlEsc(vName)}</text>
      <rect x="${118 + w1 + 40}" y="34" width="2" height="76" fill="${ink}" fill-opacity=".25"/>
      ${m(118 + w1 + 82, 40, pName_, pColor, 64)}<text x="${118 + w1 + 160}" y="${82}" ${F} font-size="28" font-weight="700" fill="${ink}">${xmlEsc(pName_)}</text></svg>`;
  }
  const W = Math.max(tw(vName), tw(pName_)) + 120, H = 300;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${bg}"/>
    ${m(W / 2 - 104, 40, vName, vColor, 72)}<text x="${W / 2}" y="${144}" text-anchor="middle" ${F} font-size="18" font-weight="700" fill="${ink}" fill-opacity=".5">×</text>${m(W / 2 + 32, 40, pName_, pColor, 72)}
    <text x="${W / 2}" y="${196}" text-anchor="middle" ${F} font-size="26" font-weight="700" fill="${ink}">${xmlEsc(vName)}</text>
    <text x="${W / 2}" y="${236}" text-anchor="middle" ${F} font-size="26" font-weight="700" fill="${ink}">${xmlEsc(pName_)}</text></svg>`;
}
async function dlSVG(svg, name, kind) {
  if (!S.dl) { toast('Downloads aren’t available in this view.'); return; }
  const base = name.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  try {
    if (kind === 'svg') { await S.dl.save({filename:base + '.svg', data:new Blob([svg], {type:'image/svg+xml'})}); return; }
    const vb = (svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/) || [0, 600, 300]).slice(1).map(Number);
    const img = new Image(); img.src = svgSrc(svg); await img.decode();
    const cv = document.createElement('canvas'); cv.width = vb[0] * 2; cv.height = vb[1] * 2; cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    await S.dl.save({filename:base + '.png', data:await new Promise(r => cv.toBlob(r, 'image/png'))});
  } catch (e) { if (e?.code !== 'declined') toast('Couldn’t prepare the file.'); }
}

/* ----- view ----- */
function vPlan() {
  const pid = planPid(), p = P(pid);
  if (!p) return `${crumbs(['Home','home'],['Business plan'])}<div class="panel"><div class="empty">Add a partner first.</div></div>`;
  const stored = planOf(pid), pl = stored || defaultPlan(pid), d = S.pdraft?.[pid] || {};
  const sm = {...pl.summary, ...(d.summary || {})}, br = {...pl.brand, ...(d.brand || {})};
  const steps = pl.onboarding || [], done = steps.filter(s => s.done).length, t0 = today();
  const pc = partnerColor(pid, {brand:br}), b = brand();
  const fields = [sm.overview, sm.valueProp, sm.targetMarket, sm.offerings, sm.sponsorVendor, sm.sponsorPartner].filter(Boolean).length;
  const completeness = Math.round(100 * (fields / 6 * .35 + (steps.length ? done / steps.length : 0) * .35 + Math.min(1, (pl.goals || []).length / 3) * .2 + ((pl.logos || []).length || br.partnerLogo ? 1 : .5) * .1));
  const dirtyS = !!d.summary, dirtyB = !!d.brand;
  const ta = (k, label, rows = 3, ph = '') => `<div class="field"><label for="ps-${k}">${label}</label><textarea class="inp" id="ps-${k}" data-ps="${k}" rows="${rows}" placeholder="${esc(ph)}">${esc(sm[k] || '')}</textarea></div>`;
  const tin = (k, label, ph = '') => `<div class="field"><label for="ps-${k}">${label}</label><input class="inp" id="ps-${k}" data-ps="${k}" value="${esc(sm[k] || '')}" placeholder="${esc(ph)}"></div>`;
  const lockH = lockupSVG(b.vendorName, b.vendorColor, p.name, pc, 'light', 'h'), lockD = lockupSVG(b.vendorName, b.vendorColor, p.name, pc, 'dark', 'h'), lockS = lockupSVG(b.vendorName, b.vendorColor, p.name, pc, 'light', 's');
  const logos = [
    ['Co-brand lockup · light', lockH, 'lockup-light'], ['Co-brand lockup · dark', lockD, 'lockup-dark'], ['Stacked lockup', lockS, 'lockup-stacked'],
    [p.name + ' monogram', markSVG(p.name, pc), 'partner-mark'], [b.vendorName + ' monogram', markSVG(b.vendorName, b.vendorColor), 'vendor-mark'],
    ...(pl.logos || []).map((l, i) => [l.name || 'AI logo concept ' + (i + 1), l.svg, 'concept-' + (i + 1), i])
  ];
  return `${crumbs(['Home','home'],['Business plan'])}
  <div class="phead"><div><span class="eyebrow">Joint business plan · ${esc(sm.period || 'FY27')}</span><h1>${esc(b.vendorName)} × ${esc(p.name)}</h1>
    <p class="sub">${esc(p.type)} · ${esc(p.tier)} · ${esc(p.region)} · partner since ${fdate(p.joinedAt)}</p></div>
    <div class="row">${S.focus ? '' : `<div class="field"><label for="planPick">Partner</label><select class="inp" id="planPick">${sortedPartners().map(x => `<option value="${esc(x.id)}" ${x.id === pid ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>`}</div></div>
  <nav class="plannav" aria-label="Plan sections">${[['pl-summary','Summary'],['pl-onboard','Onboarding & enablement'],['pl-goals','Goals'],['pl-brand','Brand guide'],['pl-logos','Logos'],['pl-files','Files']].map(([a, l]) => `<a href="#${a}" data-act="planjump" data-to="${a}">${l}</a>`).join('')}<span class="pcomp" title="Plan completeness"><span class="bar"><i style="width:${completeness}%;background:var(--accent)"></i></span><b class="num">${completeness}%</b> complete</span></nav>
  ${!stored ? `<div class="banner info"><span><b>No plan saved yet for ${esc(p.name)}.</b> This is the standard starting plan. Edit anything, or ask the plan assistant to draft it.</span><button class="btn sm primary" data-act="plancreate" data-pid="${esc(pid)}">Save this plan</button></div>` : ''}
  <div class="plangrid">
    <div class="stack" style="gap:22px">
      <section class="panel" id="pl-summary"><div class="panel-h"><h2>Partnership summary</h2><div class="row">${dirtyS ? '<span class="pill warn">Unsaved</span><button class="btn sm" data-act="psdiscard">Discard</button>' : ''}<button class="btn sm primary" data-act="pssave" data-pid="${esc(pid)}" ${dirtyS && S.canWrite ? '' : 'disabled'}>Save</button></div></div>
        <div class="panel-b stack" style="gap:12px">
          ${ta('overview', 'Why this partnership', 4, 'What each side brings and why it matters to customers')}
          <div class="grid2" style="gap:12px">${ta('valueProp', 'Joint value proposition', 3)}${ta('targetMarket', 'Target market', 3, 'Industries, company size, regions')}</div>
          ${ta('offerings', 'Joint offerings', 2, 'Which solutions the partner sells, services they wrap around them')}
          <div class="grid2" style="gap:12px">${tin('sponsorVendor', b.vendorName + ' sponsor', 'Name, title')}${tin('sponsorPartner', p.name + ' sponsor', 'Name, title')}</div>
          <div class="grid3">${tin('period', 'Plan period', 'FY27')}${tin('startDate', 'Start date', 'YYYY-MM-DD')}${tin('term', 'Term', '12 months')}</div>
        </div></section>

      <section class="panel" id="pl-onboard"><div class="panel-h"><h2>Onboarding & enablement</h2><span class="muted small num">${done} of ${steps.length} steps done</span></div>
        <div class="panel-b"><div class="phasebar">${PHASES.map(([k, l]) => { const ss = steps.filter(s => s.phase === k), dn = ss.filter(s => s.done).length; return `<div class="ph ${ss.length && dn === ss.length ? 'done' : dn ? 'part' : ''}"><b>${l}</b><span class="num">${dn}/${ss.length}</span><span class="bar"><i style="width:${ss.length ? dn / ss.length * 100 : 0}%"></i></span></div>`; }).join('')}</div></div>
        ${PHASES.map(([k, l]) => { const ss = steps.filter(s => s.phase === k); return ss.length ? `<div class="phase"><h3>${l}</h3><ol class="steplist">${ss.map(s => { const late = !s.done && s.due && s.due < t0; return `<li class="${s.done ? 'done' : ''}"><label class="check"><input type="checkbox" data-act="steptoggle" data-pid="${esc(pid)}" data-sid="${esc(s.id)}" ${s.done ? 'checked' : ''} ${S.canWrite ? '' : 'disabled'}><span>${esc(s.title)}</span></label><span class="pill ${s.owner === 'vendor' ? 'camp' : s.owner === 'partner' ? 'mdf' : ''}">${OWNERS[s.owner] || s.owner}</span><span class="small num ${late ? 'late' : 'muted'}">${s.done ? 'Done ' + fdate((s.doneAt || '').slice(0, 10) || s.due) : (late ? 'Overdue · ' : 'Due ') + fdate(s.due)}</span><button class="btn sm ghost" data-act="stepdel" data-pid="${esc(pid)}" data-sid="${esc(s.id)}" aria-label="Remove step">✕</button></li>`; }).join('')}</ol></div>` : ''; }).join('')}
        <form class="panel-b addstep" id="stepForm" data-pid="${esc(pid)}" style="border-top:1px solid var(--line)"><div class="fgrid">
          <div class="field"><label for="stTitle">New step</label><input class="inp" id="stTitle" placeholder="e.g. Second technical certification"></div>
          <div class="field"><label for="stPhase">Phase</label><select class="inp" id="stPhase">${PHASES.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
          <div class="field"><label for="stOwner">Owner</label><select class="inp" id="stOwner">${Object.entries(OWNERS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
          <div class="field"><label for="stDue">Due</label><input class="inp" type="date" id="stDue"></div></div>
          <div class="row" style="margin-top:10px"><button class="btn sm" type="submit">Add step</button>${steps.length ? '' : `<button class="btn sm" type="button" data-act="playbook" data-pid="${esc(pid)}">Load the standard playbook</button>`}</div></form>
      </section>

      <section class="panel" id="pl-goals"><div class="panel-h"><h2>Goals</h2><span class="muted small">Progress updates from the hub’s own data</span></div>
        ${(pl.goals || []).length ? `<div class="goals">${pl.goals.map(g => { const M = GOAL_METRICS[g.metric] || GOAL_METRICS.custom, cur = g.metric === 'custom' ? Number(g.current) || 0 : M[2](pid), pctv = g.target ? Math.min(1, cur / g.target) : 0; return `<div class="goal"><div class="spread"><b>${esc(g.label || M[0])}</b><button class="btn sm ghost" data-act="goaldel" data-pid="${esc(pid)}" data-gid="${esc(g.id)}" aria-label="Remove goal">✕</button></div>
          <div class="gnum"><span class="num">${fmtGoal(M[1], cur)}</span><span class="muted small">of ${fmtGoal(M[1], Number(g.target))} · ${esc(g.period || sm.period || '')}</span></div>
          <div class="bar"><i style="width:${pctv * 100}%;background:${pctv >= 1 ? 'var(--ok)' : pctv >= .5 ? 'var(--pipe)' : 'var(--warn)'}"></i></div><span class="small muted">${Math.round(pctv * 100)}%${g.notes ? ' · ' + esc(g.notes) : ''}</span></div>`; }).join('')}</div>` : '<div class="empty">No goals yet. Add one below, or ask the plan assistant to suggest goals.</div>'}
        <form class="panel-b" id="goalForm" data-pid="${esc(pid)}" style="border-top:1px solid var(--line)"><div class="fgrid">
          <div class="field"><label for="gMetric">Measure</label><select class="inp" id="gMetric">${Object.entries(GOAL_METRICS).map(([k, m]) => `<option value="${k}">${m[0]}</option>`).join('')}</select></div>
          <div class="field"><label for="gTarget">Target</label><input class="inp" type="number" min="0" step="any" id="gTarget" placeholder="e.g. 1500000"></div>
          <div class="field"><label for="gPeriod">Period</label><input class="inp" id="gPeriod" value="${esc(sm.period || 'FY27')}"></div>
          <div class="field"><label for="gLabel">Label <span class="muted">(optional)</span></label><input class="inp" id="gLabel" placeholder="Shown on the card"></div></div>
          <div class="row" style="margin-top:10px"><button class="btn sm" type="submit">Add goal</button></div></form>
      </section>

      <section class="panel" id="pl-brand"><div class="panel-h"><h2>Brand guide</h2><div class="row">${dirtyB ? '<span class="pill warn">Unsaved</span><button class="btn sm" data-act="pbdiscard">Discard</button>' : ''}<button class="btn sm primary" data-act="pbsave" data-pid="${esc(pid)}" ${dirtyB && S.canWrite ? '' : 'disabled'}>Save</button></div></div>
        <div class="panel-b stack" style="gap:16px">
          <div class="lockprev"><img src="${svgSrc(lockH)}" alt="Co-brand lockup preview"></div>
          <div class="swatches">
            <div class="sw"><span style="background:${b.vendorColor}"></span><b>${esc(b.vendorName)}</b><code>${esc(b.vendorColor)}</code></div>
            <div class="sw"><span style="background:${pc}"></span><b>${esc(p.name)}</b><label class="small"><input type="color" id="pbColor" data-pb="partnerColor" value="${esc(pc)}"> <code>${esc(pc)}</code></label></div>
            <div class="sw"><span style="background:#111827"></span><b>Ink</b><code>#111827</code></div>
            <div class="sw"><span style="background:#FFFFFF;border:1px solid var(--line)"></span><b>Paper</b><code>#FFFFFF</code></div>
          </div>
          <div class="grid2" style="gap:12px">
            <div class="field"><label for="pb-typography">Typography</label><textarea class="inp" id="pb-typography" data-pb="typography" rows="3">${esc(br.typography || '')}</textarea></div>
            <div class="field"><label for="pb-voice">Voice and tone</label><textarea class="inp" id="pb-voice" data-pb="voice" rows="3">${esc(br.voice || '')}</textarea></div>
          </div>
          <div class="grid2" style="gap:12px">
            <div class="field"><label for="pb-dos">Do <span class="muted">(one per line)</span></label><textarea class="inp" id="pb-dos" data-pb="dos" rows="4">${esc(lines(br.dos))}</textarea></div>
            <div class="field"><label for="pb-donts">Don’t <span class="muted">(one per line)</span></label><textarea class="inp" id="pb-donts" data-pb="donts" rows="4">${esc(lines(br.donts))}</textarea></div>
          </div>
          <div class="field"><label for="pb-lockupRules">Lockup and clear-space rules</label><textarea class="inp" id="pb-lockupRules" data-pb="lockupRules" rows="2">${esc(br.lockupRules || '')}</textarea></div>
        </div></section>

      <section class="panel" id="pl-logos"><div class="panel-h"><h2>Logos and graphics</h2><div class="row">${S.ai && !S.aiOff ? `<button class="btn sm ai" data-act="logoai" data-pid="${esc(pid)}" ${S.busy['logo:' + pid] ? 'disabled' : ''}>${S.busy['logo:' + pid] ? '<span class="thinking">Designing…</span>' : '✦ Logo concept with AI'}</button>` : ''}${S.up ? `<label class="btn sm" for="logoUp">Upload logo</label><input type="file" id="logoUp" data-pid="${esc(pid)}" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden>` : ''}</div></div>
        <div class="panel-b logos">${logos.map(([name, svg, key, ci]) => `<figure class="logo"><div class="lbox ${/dark/.test(key) ? 'dark' : ''}"><img src="${svgSrc(svg)}" alt="${esc(name)}"></div><figcaption><b>${esc(name)}</b><span class="row">${S.dl ? `<button class="btn sm" data-act="logodl" data-key="${esc(key)}" data-kind="svg">SVG</button><button class="btn sm" data-act="logodl" data-key="${esc(key)}" data-kind="png">PNG</button>` : ''}${ci != null ? `<button class="btn sm ghost" data-act="logodel" data-pid="${esc(pid)}" data-i="${ci}" aria-label="Remove concept">✕</button>` : ''}</span></figcaption></figure>`).join('')}
          ${(pl.files || []).filter(f => /^image\//.test(f.type)).map(f => `<figure class="logo"><div class="lbox"><img src="${esc(f.url)}" alt="${esc(f.name)}"></div><figcaption><b>${esc(f.name)}</b><span class="small muted">Uploaded</span></figcaption></figure>`).join('')}
        </div>
        <p class="panel-b small muted" style="border-top:1px solid var(--line)">Lockups and monograms are drawn from the brand colours above. Uploaded logos are stored with this plan for everyone who can open the hub.</p></section>

      <section class="panel" id="pl-files"><div class="panel-h"><h2>Files</h2>${S.up ? `<label class="btn sm" for="planFile">Upload file</label><input type="file" id="planFile" data-pid="${esc(pid)}" hidden multiple>` : ''}</div>
        <div class="list">${(pl.files || []).length ? pl.files.slice().reverse().map(f => `<div class="li"><span class="kind tool">${esc((f.name.split('.').pop() || 'file').slice(0, 4))}</span><span class="t"><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name)}</a></span><span class="d">${Math.max(1, Math.round((f.size || 0) / 1024))} KB · added ${fdate((f.at || '').slice(0, 10))}${f.readable ? ' · readable by the assistant' : ''}</span></div>`).join('') : `<div class="empty">No files yet. ${S.up ? 'Upload decks, agreements, logos or price lists, or attach them in the plan assistant.' : 'File uploads need a signed-in editor.'}</div>`}</div></section>
    </div>
    ${planChat(pid, pl)}
  </div>`;
}

/* ----- plan assistant (chat) ----- */
const CHAT_CHIPS = ['Draft the partnership summary', 'Suggest goals for this plan period', 'Which onboarding steps are overdue?', 'Write brand do’s and don’ts for this partner', 'Summarize the file I attached'];
function planChat(pid, pl) {
  const msgs = pl.chat || [], live = S.chatLive?.[pid], att = S.chatAtt?.[pid] || [], prop = S.chatProp?.[pid];
  return `<aside class="panel chat" aria-label="Plan assistant"><div class="panel-h"><h2>Plan assistant</h2>${msgs.length ? `<button class="btn sm ghost" data-act="chatclear" data-pid="${esc(pid)}">Clear</button>` : ''}</div>
    <div class="chatlog" id="chatlog" aria-live="polite">
      ${msgs.length ? '' : `<div class="cbub bot"><p>I can draft parts of this plan, suggest goals, check onboarding progress, or read a file you attach. When you ask me to change the plan, I’ll show the changes for you to apply.</p></div>`}
      ${msgs.map(m => `<div class="cbub ${m.role === 'user' ? 'me' : 'bot'}">${m.files?.length ? `<div class="catt">${m.files.map(f => `<span>📎 ${esc(f)}</span>`).join('')}</div>` : ''}<p>${esc(m.text).replace(/\n/g, '<br>')}</p>${m.applied ? `<span class="small muted">✓ ${esc(m.applied)}</span>` : ''}</div>`).join('')}
      ${live != null ? `<div class="cbub bot"><p>${live ? esc(live).replace(/\n/g, '<br>') : '<span class="thinking">Thinking…</span>'}</p></div>` : ''}
      ${prop?.length ? `<div class="cprop"><b>Proposed changes</b><ul>${prop.map(x => `<li>${esc(x.desc)}</li>`).join('')}</ul><div class="row"><button class="btn sm primary" data-act="propapply" data-pid="${esc(pid)}">Apply ${prop.length} change${prop.length > 1 ? 's' : ''}</button><button class="btn sm" data-act="propdrop" data-pid="${esc(pid)}">Discard</button></div></div>` : ''}
    </div>
    ${S.ai && !S.aiOff ? `<div class="chips cchipsrow">${CHAT_CHIPS.map(c => `<button class="chip" data-act="chatchip" data-pid="${esc(pid)}" data-q="${esc(c)}" ${live != null ? 'disabled' : ''}>${esc(c)}</button>`).join('')}</div>
    <form class="chatform" id="chatForm" data-pid="${esc(pid)}">
      ${att.length ? `<div class="catt">${att.map((f, i) => `<span>📎 ${esc(f.name)} <button type="button" data-act="attdel" data-pid="${esc(pid)}" data-i="${i}" aria-label="Remove attachment">×</button></span>`).join('')}</div>` : ''}
      <textarea class="inp" id="chatIn" rows="2" placeholder="Ask for help, or tell me what to update…" ${live != null ? 'disabled' : ''}>${esc(S.chatDraft?.[pid] || '')}</textarea>
      <div class="row"><label class="btn sm" for="chatFile" title="Attach a file">📎 Attach</label><input type="file" id="chatFile" data-pid="${esc(pid)}" hidden multiple>
        ${live != null ? `<button class="btn sm" type="button" data-act="chatstop">Stop</button>` : `<button class="btn sm primary" type="submit">Send</button>`}<span class="small muted" style="margin-left:auto">Uses your Claude account</span></div>
    </form>` : `<div class="panel-b small muted">The assistant needs AI access, which isn’t available in this view. Everything else on this page works by hand.</div>`}
  </aside>`;
}
function planContext(pid) {
  const pl = planOf(pid) || defaultPlan(pid), p = P(pid), b = brand();
  const goals = (pl.goals || []).map(g => { const M = GOAL_METRICS[g.metric] || GOAL_METRICS.custom; return `${g.label || M[0]}: target ${g.target} (${g.period}), current ${fmtGoal(M[1], g.metric === 'custom' ? Number(g.current) || 0 : M[2](pid))}`; });
  return `Vendor: ${b.vendorName}. Partner: ${p.name} (${p.type}, ${p.tier} tier, ${p.region}, lifecycle ${p.stage}, joined ${p.joinedAt}). Today is ${today()}.
Hub data for this partner: open pipeline ${money(partnerPipe(pid))}; closed won ${money(GOAL_METRICS.won[2](pid))}; ${vals(S.deals).filter(d => d.partnerId === pid).length} deals; MDF used ${money(mdfUsed(pid))} of ${money(p.mdfAllocated)}; campaigns: ${vals(S.campaigns).filter(c => c.partnerId === pid).map(c => c.name + ' (' + c.status + ')').join(', ') || 'none'}; contacts: ${vals(S.contacts).filter(c => c.partnerId === pid).length}.
Plan summary: ${JSON.stringify(pl.summary)}
Onboarding steps: ${(pl.onboarding || []).map(s => `[${s.done ? 'x' : ' '}] ${s.phase}: ${s.title} (owner ${s.owner}, due ${s.due})`).join('; ')}
Goals: ${goals.join('; ') || 'none'}
Brand guide: ${JSON.stringify({...pl.brand, partnerLogo:undefined})}`;
}
function chatTools(pid, staged) {
  const st = (desc, fn) => { staged.push({desc, fn}); return 'Staged for the user to review and apply.'; };
  const sumFields = ['overview','valueProp','targetMarket','offerings','sponsorVendor','sponsorPartner','period','startDate','term'];
  const brandFields = ['typography','voice','dos','donts','lockupRules','partnerColor'];
  return [
    {name:'update_summary', description:'Propose a new value for one field of the partnership summary. Fields: ' + sumFields.join(', ') + '. The user must apply it.',
      inputSchema:{type:'object', properties:{field:{type:'string', enum:sumFields}, value:{type:'string'}}, required:['field','value']},
      execute:({field, value}) => { if (!sumFields.includes(field)) throw new Error('Unknown field'); return st(`Summary · ${field}: “${String(value).slice(0, 90)}${String(value).length > 90 ? '…' : ''}”`, pl => ({summary:{...pl.summary, [field]:String(value)}})); }},
    {name:'add_onboarding_step', description:'Propose a new onboarding or enablement step.', inputSchema:{type:'object', properties:{phase:{type:'string', enum:PHASES.map(x => x[0])}, title:{type:'string'}, owner:{type:'string', enum:['vendor','partner','joint']}, due:{type:'string', description:'YYYY-MM-DD'}}, required:['phase','title','owner']},
      execute:({phase, title, owner, due}) => st(`Add ${phase} step “${title}” (${owner}${due ? ', due ' + due : ''})`, pl => ({onboarding:[...(pl.onboarding || []), {id:uidp(), phase:String(phase), title:String(title), owner:String(owner), due:String(due || ''), done:false}]}))},
    {name:'set_step_done', description:'Propose marking an existing onboarding step done or not done, matched by its title.', inputSchema:{type:'object', properties:{title:{type:'string'}, done:{type:'boolean'}}, required:['title','done']},
      execute:({title, done}) => { const pl = planOf(pid) || defaultPlan(pid), s = (pl.onboarding || []).find(x => x.title.toLowerCase().includes(String(title).toLowerCase())); if (!s) throw new Error('No step matches that title'); return st(`Mark “${s.title}” ${done ? 'done' : 'not done'}`, pl2 => ({onboarding:pl2.onboarding.map(x => x.id === s.id ? {...x, done:!!done, doneAt:done ? now() : ''} : x)})); }},
    {name:'add_goal', description:'Propose a goal. metric is one of: ' + Object.keys(GOAL_METRICS).join(', ') + ' (use custom for anything else, with a label). Target is a plain number (dollars for money).',
      inputSchema:{type:'object', properties:{metric:{type:'string', enum:Object.keys(GOAL_METRICS)}, target:{type:'number'}, period:{type:'string'}, label:{type:'string'}, notes:{type:'string'}}, required:['metric','target']},
      execute:({metric, target, period, label, notes}) => st(`Add goal: ${label || GOAL_METRICS[metric]?.[0] || metric} → ${fmtGoal(GOAL_METRICS[metric]?.[1] || '', Number(target))}${period ? ' (' + period + ')' : ''}`, pl => ({goals:[...(pl.goals || []), {id:uidp(), metric:String(metric), target:Number(target), period:String(period || pl.summary?.period || ''), label:String(label || ''), notes:String(notes || '')}]}))},
    {name:'update_brand', description:'Propose a brand guide change. Fields: ' + brandFields.join(', ') + '. For dos and donts pass one item per line. partnerColor is a hex colour.',
      inputSchema:{type:'object', properties:{field:{type:'string', enum:brandFields}, value:{type:'string'}}, required:['field','value']},
      execute:({field, value}) => { if (!brandFields.includes(field)) throw new Error('Unknown field'); const v = ['dos','donts'].includes(field) ? String(value).split(/\n+/).map(x => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean) : String(value); return st(`Brand · ${field}: ${Array.isArray(v) ? v.length + ' items' : '“' + v.slice(0, 80) + '”'}`, pl => ({brand:{...pl.brand, [field]:v}})); }},
  ];
}
async function sendChat(pid, text) {
  const pl0 = planOf(pid) || defaultPlan(pid), att = S.chatAtt?.[pid] || [];
  if (!text.trim() && !att.length) return;
  S.chatAtt[pid] = []; S.chatLive[pid] = ''; S.chatProp[pid] = []; render();
  const userMsg = {role:'user', text:text.trim() || 'Please look at the attached file.', at:now(), by:S.uid || '', files:att.map(f => f.name)};
  const history = [...(pl0.chat || []), userMsg].slice(-30);
  if (!(await savePlan(pid, {chat:history}))) { delete S.chatLive[pid]; render(); return; }
  const staged = [];
  const textFiles = att.filter(f => f.text != null).map(f => `--- ${f.name} ---\n${f.text.slice(0, 40000)}`).join('\n\n');
  const images = att.filter(f => f.image).map(f => f.blob);
  const otherFiles = att.filter(f => f.text == null && !f.image).map(f => f.name);
  const transcript = (pl0.chat || []).slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
  const prompt = `You are the plan assistant inside a partner account manager's hub, helping with the joint business plan between a vendor and one channel partner.
Answer concisely in plain text (no markdown headings; short paragraphs or "- " bullets). Never invent statistics, customer names or prices; use [X] placeholders.
When the user asks you to change, add, draft or fill in plan content, call the tools to propose the changes (the user reviews and applies them), then briefly say what you proposed. Don't call tools for plain questions.

PLAN CONTEXT
${planContext(pid)}
${transcript ? '\nRECENT CONVERSATION\n' + transcript : ''}
${textFiles ? '\nATTACHED FILES\n' + textFiles : ''}${otherFiles.length ? '\n(Also attached, stored but not readable as text: ' + otherFiles.join(', ') + ')' : ''}

USER
${userMsg.text}`;
  S.chatCtl = new AbortController();
  let reply = '';
  try {
    const opts = {signal:S.chatCtl.signal, cache:false, tools:chatTools(pid, staged), onText:({text}) => { S.chatLive[pid] = text; const log = $('#chatlog'); if (log) { const last = log.querySelector('.cbub.bot:last-of-type p'); if (last) last.textContent = text; log.scrollTop = log.scrollHeight; } }};
    if (images.length && S.aiImages) opts.images = images;
    const r = await S.ai(prompt, opts); reply = r.text;
  } catch (e) {
    reply = e?.text || ''; if (e?.code !== 'cancelled') toast(aiCopy(e?.code)); if (e?.code === 'not_granted') S.aiOff = true;
    if (e?.code === 'tools_unavailable') toast('This view can’t let the assistant propose changes; answers still work.');
  }
  delete S.chatLive[pid];
  S.chatProp[pid] = staged;
  const pl1 = planOf(pid) || pl0;
  await savePlan(pid, {chat:[...(pl1.chat || history), {role:'assistant', text:reply || '(No answer.)', at:now(), by:'ai'}].slice(-30)});
}
async function uploadFiles(pid, files, forChat) {
  const out = [];
  for (const f of files) {
    if (f.size > 20e6) { toast(f.name + ' is over 20 MB.'); continue; }
    const isText = /^text\/|json|csv|markdown/.test(f.type) || /\.(txt|md|csv|json|tsv)$/i.test(f.name);
    const isImg = /^image\/(png|jpeg|webp|gif)$/.test(f.type);
    let rec = {name:f.name, size:f.size, type:f.type || 'application/octet-stream', at:now(), by:S.uid || ''};
    if (S.up) { try { const r = await S.up.upload(f); rec = {...rec, id:r.id, url:r.url}; } catch (e) { toast(e?.code === 'not_uploader' || e?.code === 'not_granted' ? 'Only editors can upload files.' : `Couldn’t store ${f.name}.`); if (!forChat) continue; } }
    let text = null; if (isText) { try { text = (await f.text()).slice(0, 60000); rec.readable = true; } catch (x) {} }
    out.push({...rec, text, image:isImg, blob:isImg ? f : null});
  }
  const stored = out.filter(x => x.url).map(({text, image, blob, ...r}) => r);
  if (stored.length) { const pl = planOf(pid) || defaultPlan(pid); await savePlan(pid, {files:[...(pl.files || []), ...stored]}, forChat ? '' : `${stored.length} file${stored.length > 1 ? 's' : ''} added`); }
  return out;
}

/* ----- events ----- */
S.pdraft = S.pdraft || {}; S.chatDraft = {}; S.chatLive = {}; S.chatAtt = {}; S.chatProp = {};
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, pid = b.dataset.pid;
  const handled = {planjump:1, plancreate:1, pssave:1, psdiscard:1, pbsave:1, pbdiscard:1, steptoggle:1, stepdel:1, playbook:1, goaldel:1, logoai:1, logodl:1, logodel:1, chatchip:1, chatclear:1, chatstop:1, propapply:1, propdrop:1, attdel:1};
  if (!handled[act]) return;
  if (act === 'planjump') { e.preventDefault(); document.getElementById(b.dataset.to)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'}); }
  else if (act === 'plancreate') savePlan(pid, {}, 'Plan saved');
  else if (act === 'pssave') { const pl = planOf(pid) || defaultPlan(pid); if (await savePlan(pid, {summary:{...pl.summary, ...S.pdraft[pid].summary}}, 'Summary saved')) { delete S.pdraft[pid].summary; render(); } }
  else if (act === 'psdiscard') { delete S.pdraft[planPid()].summary; render(); }
  else if (act === 'pbsave') { const pl = planOf(pid) || defaultPlan(pid); if (await savePlan(pid, {brand:(nb => ({...nb, dos:toList(nb.dos), donts:toList(nb.donts)}))({...pl.brand, ...S.pdraft[pid].brand})}, 'Brand guide saved')) { delete S.pdraft[pid].brand; render(); } }
  else if (act === 'pbdiscard') { delete S.pdraft[planPid()].brand; render(); }
  else if (act === 'steptoggle') { const pl = planOf(pid) || defaultPlan(pid); savePlan(pid, {onboarding:pl.onboarding.map(s => s.id === b.dataset.sid ? {...s, done:b.checked, doneAt:b.checked ? now() : ''} : s)}, b.checked ? 'Step done' : 'Step reopened'); }
  else if (act === 'stepdel') { const pl = planOf(pid) || defaultPlan(pid); savePlan(pid, {onboarding:pl.onboarding.filter(s => s.id !== b.dataset.sid)}, 'Step removed'); }
  else if (act === 'playbook') { const pl = planOf(pid) || defaultPlan(pid); savePlan(pid, {onboarding:defaultPlan(pid).onboarding}, 'Standard playbook loaded'); }
  else if (act === 'goaldel') { const pl = planOf(pid); savePlan(pid, {goals:(pl.goals || []).filter(g => g.id !== b.dataset.gid)}, 'Goal removed'); }
  else if (act === 'logoai') await withAI('logo:' + pid, async sample => {
    const p = P(pid), pl = planOf(pid) || defaultPlan(pid), c = partnerColor(pid, pl);
    const {text} = await sample(`Design a simple, professional logo mark for the channel partner "${p.name}" (${p.type}, ${p.region}) as a standalone SVG.
viewBox="0 0 480 160" width="480" height="160". Left: a geometric symbol inside 140×140 built from basic shapes; right: the wordmark "${p.name}" in font-family="Helvetica Neue, Helvetica, Arial, sans-serif", bold, fitting inside the canvas (use two lines if needed).
Colours: primary ${c}, ink #111827, white. Flat, no gradients beyond one subtle linear gradient, no images, no script or style elements, no external references. Return only the SVG markup.`, {cache:false});
    const svg = cleanSVG(text, 480, 160); if (!svg) { toast('That concept couldn’t be used. Try again.'); return; }
    await savePlan(pid, {logos:[...(pl.logos || []), {svg, name:'AI logo concept ' + ((pl.logos || []).length + 1), at:now()}].slice(-6)}, 'Logo concept added');
  });
  else if (act === 'logodl') {
    const pidN = planPid(), p = P(pidN), pl = planOf(pidN) || defaultPlan(pidN), bb = brand(), pc = partnerColor(pidN, pl), k = b.dataset.key;
    const svg = k === 'lockup-light' ? lockupSVG(bb.vendorName, bb.vendorColor, p.name, pc, 'light', 'h') : k === 'lockup-dark' ? lockupSVG(bb.vendorName, bb.vendorColor, p.name, pc, 'dark', 'h') : k === 'lockup-stacked' ? lockupSVG(bb.vendorName, bb.vendorColor, p.name, pc, 'light', 's') : k === 'partner-mark' ? markSVG(p.name, pc) : k === 'vendor-mark' ? markSVG(bb.vendorName, bb.vendorColor) : (pl.logos || [])[+k.split('-')[1] - 1]?.svg;
    if (svg) dlSVG(svg, `${p.name} ${k}`, b.dataset.kind);
  }
  else if (act === 'logodel') { const pl = planOf(pid); savePlan(pid, {logos:(pl.logos || []).filter((_, i) => i !== +b.dataset.i)}, 'Concept removed'); }
  else if (act === 'chatchip') sendChat(pid, b.dataset.q);
  else if (act === 'chatclear') savePlan(pid, {chat:[]}, 'Conversation cleared');
  else if (act === 'chatstop') S.chatCtl?.abort();
  else if (act === 'propapply') {
    let pl = {...(planOf(pid) || defaultPlan(pid))}; const prop = S.chatProp[pid] || [], patch = {};
    for (const x of prop) { const ch = x.fn({...pl, ...patch}); Object.assign(patch, ch); }
    const chat = [...(pl.chat || [])]; for (let i = chat.length - 1; i >= 0; i--) if (chat[i].role === 'assistant') { chat[i] = {...chat[i], applied:`Applied ${prop.length} change${prop.length > 1 ? 's' : ''}`}; break; }
    if (await savePlan(pid, {...patch, chat}, `Applied ${prop.length} change${prop.length > 1 ? 's' : ''}`)) { S.chatProp[pid] = []; render(); }
  }
  else if (act === 'propdrop') { S.chatProp[pid] = []; render(); }
  else if (act === 'attdel') { S.chatAtt[pid].splice(+b.dataset.i, 1); render(); }
});
document.addEventListener('change', async e => {
  const el = e.target, pid = planPid();
  if (el.id === 'planPick') { S.planPid = el.value; render(); }
  else if (el.dataset.pb && el.type === 'color') { const d = S.pdraft[pid] || (S.pdraft[pid] = {}); d.brand = {...(d.brand || {}), partnerColor:el.value}; render(); }
  else if (el.id === 'logoUp' || el.id === 'planFile') { const fs = [...el.files]; el.value = ''; if (fs.length) await uploadFiles(el.dataset.pid, fs, false); }
  else if (el.id === 'chatFile') { const fs = [...el.files]; el.value = ''; if (!fs.length) return; toast('Adding ' + fs.length + ' file' + (fs.length > 1 ? 's' : '') + '…'); const got = await uploadFiles(el.dataset.pid, fs, true); S.chatAtt[el.dataset.pid] = [...(S.chatAtt[el.dataset.pid] || []), ...got]; render(); $('#chatIn')?.focus(); }
});
const markDirty = act => { const btn = $(`[data-act="${act}"]`); if (!btn || !btn.disabled) return; btn.disabled = !S.canWrite; btn.insertAdjacentHTML('beforebegin', `<span class="pill warn">Unsaved</span><button class="btn sm" data-act="${act === 'pssave' ? 'psdiscard' : 'pbdiscard'}">Discard</button>`); };
document.addEventListener('input', e => {
  const el = e.target, pid = planPid();
  if (el.dataset.ps) { const d = S.pdraft[pid] || (S.pdraft[pid] = {}); d.summary = {...(d.summary || {}), [el.dataset.ps]:el.value}; markDirty('pssave'); }
  else if (el.dataset.pb && el.type !== 'color') { const d = S.pdraft[pid] || (S.pdraft[pid] = {}); d.brand = {...(d.brand || {}), [el.dataset.pb]:el.value}; markDirty('pbsave'); }
  else if (el.id === 'chatIn') S.chatDraft[pid] = el.value;
});
document.addEventListener('submit', async e => {
  const f = e.target;
  if (f.id === 'chatForm') { e.preventDefault(); const t = $('#chatIn').value; $('#chatIn').value = ''; S.chatDraft[f.dataset.pid] = ''; sendChat(f.dataset.pid, t); }
  else if (f.id === 'stepForm') { e.preventDefault(); const t = $('#stTitle').value.trim(); if (!t) { toast('Name the step.'); $('#stTitle').focus(); return; } const pl = planOf(f.dataset.pid) || defaultPlan(f.dataset.pid); await savePlan(f.dataset.pid, {onboarding:[...(pl.onboarding || []), {id:uidp(), phase:$('#stPhase').value, title:t, owner:$('#stOwner').value, due:$('#stDue').value, done:false}]}, 'Step added'); }
  else if (f.id === 'goalForm') { e.preventDefault(); const tg = Number($('#gTarget').value); if (!(tg > 0)) { toast('Enter a target above zero.'); $('#gTarget').focus(); return; } const pl = planOf(f.dataset.pid) || defaultPlan(f.dataset.pid); await savePlan(f.dataset.pid, {goals:[...(pl.goals || []), {id:uidp(), metric:$('#gMetric').value, target:tg, period:$('#gPeriod').value.trim(), label:$('#gLabel').value.trim(), notes:''}]}, 'Goal added'); }
}, true);
document.addEventListener('keydown', e => { if (e.target.id === 'chatIn' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#chatForm')?.requestSubmit(); } });
