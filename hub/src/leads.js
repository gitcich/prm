/* ---------- leads and account mapping ---------- */
const VST = {customer:['Customer',3,'ok'], opportunity:['Open opportunity',2,'pipe'], prospect:['Prospect',1,'warn'], none:['Not engaged',0,'']};
const VST_KEYS = Object.keys(VST);
const OVL = {
  intro:['Partner can introduce','camp','The partner already serves this account and you don’t. Ask for a warm introduction.'],
  cosell:['Active co-sell','pipe','One or both sides have pipeline here. Agree one plan, one owner and one next step.'],
  bringin:['Bring the partner in','mdf','You serve this account and the partner doesn’t. Offer their services, or refer the work to them.'],
  expand:['Expand together','ok','Both of you already serve this account. Plan expansion and protect the renewal together.'],
  joint:['Joint prospect','warn','Neither side is in yet, but one of you is targeting it. Decide who leads the first touch.'],
  white:['Whitespace','','Nobody is engaged. Decide whether it fits your ideal customer profile.']
};
const OVL_KEYS = Object.keys(OVL);
const ASTAGE = {identified:['Identified',''], mapped:['Mapped','pipe'], engaging:['Engaging','warn'], cosell:['Co-selling','camp'], won:['Won','ok'], parked:['Parked','bad']};
const MOTION = {cosell:'Co-sell', partner:'Partner-led', vendor:'Vendor-led', referral:'Referral'};
const PROLE = {resell:'Resells', services:'Services', referral:'Referral', influence:'Influence'};
const LST = {new:['New','warn'], assigned:['Assigned to partner','camp'], accepted:['Accepted','pipe'], working:['Working','pipe'], qualified:['Qualified','ok'], converted:['Converted','ok'], declined:['Declined by partner','bad'], disqualified:['Disqualified','']};
const LFLOW = ['new','assigned','accepted','working','qualified','converted'];
const LOPEN = new Set(['new','assigned','accepted','working','qualified']);
const RATING = {hot:['Hot','bad'], warm:['Warm','warn'], cold:['Cold','pipe']};
const LEAD_TABS = [['leads','Account mapping'],['leads-accounts','Accounts'],['leads-people','Leads'],['leads-import','Import'],['leads-crm','CRM connections']];

const AC = id => S.accounts?.[id], LD = id => S.leads?.[id];
const aRefL = id => AC(id) ? ref(id, 'pipe', AC(id).name) : '<span class="muted">No account</span>';
const lRef = id => LD(id) ? ref(id, 'camp', LD(id).name) : '<span class="muted">No lead</span>';
const vRank = s => VST[s]?.[1] || 0;
function overlapOf(vs, ps) { const v = vRank(vs), p = vRank(ps); if (v === 3 && p === 3) return 'expand'; if (p === 3) return 'intro'; if (v === 3) return 'bringin'; if (v === 2 || p === 2) return 'cosell'; if (v === 1 || p === 1) return 'joint'; return 'white'; }
const pairsOf = a => Object.entries(a.partners || {}).filter(([pid]) => S.partners[pid]).map(([pid, r]) => ({pid, ...r, ovl:overlapOf(a.vendorStatus, r.status)}));
function bestOverlap(a, pid) {
  const ps = pairsOf(a).filter(x => !pid || x.pid === pid);
  if (!ps.length) return pid ? null : 'white';
  return ps.map(x => x.ovl).sort((x, y) => OVL_KEYS.indexOf(x) - OVL_KEYS.indexOf(y))[0];
}
const ovlPill = k => k ? `<span class="pill ${OVL[k][1]}" title="${esc(OVL[k][2])}">${esc(OVL[k][0])}</span>` : '';
const vstPill = k => `<span class="pill ${VST[k]?.[2] || ''}">${esc(VST[k]?.[0] || 'Not engaged')}</span>`;
const dealsForAcct = a => vals(S.deals).filter(d => (a.id && d.accountId === a.id) || (d.account && normCo(d.account) === normCo(a.name)));
const leadsForAcct = id => vals(S.leads).filter(l => l.accountId === id);
const acctOpenPipe = a => sum(dealsForAcct(a).filter(d => OPEN.has(d.stage)), d => d.amount);
function acctByName(name, domain) {
  const dn = String(domain || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  const all = vals(S._full?.accounts || S.accounts);
  return (dn && all.find(a => (a.domain || '').toLowerCase() === dn)) || all.find(a => normCo(a.name) === normCo(name)) || null;
}
const cleanDomain = d => String(d || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
const leadAge = l => l.createdAt ? days(String(l.createdAt).slice(0, 10), today()) : 0;
const lhist = (l, action, note) => [...(l.history || []), {action, at:now(), by:meName(), ...(note ? {note} : {})}];

function leadsHead(cur, sub, actions = '') {
  const label = LEAD_TABS.find(t => t[0] === cur)[1];
  const counts = {leads:vals(S.accounts).reduce((n, a) => n + pairsOf(a).length, 0), 'leads-accounts':Object.keys(S.accounts).length, 'leads-people':vals(S.leads).filter(l => LOPEN.has(l.status)).length};
  return `${crumbs(['Home','home'], ...(cur === 'leads' ? [['Leads & accounts']] : [['Leads & accounts','leads'], [label]]))}
  <div class="phead"><div><h1>Leads & accounts${cur === 'leads' ? '' : ' · ' + esc(label)}</h1><p class="sub">${sub}</p></div>${actions}</div>
  <nav class="subtabs" aria-label="Leads views">${LEAD_TABS.map(([k, l]) => `<a href="#${k}" ${k === cur ? 'aria-current="page"' : ''}>${l}${counts[k] != null ? `<span class="n">${counts[k]}</span>` : ''}</a>`).join('')}</nav>`;
}
const LF = () => S.lf || (S.lf = {partner:'', ovl:'', stage:'', q:'', cell:'', lstatus:'open', lpartner:'', lq:''});
const lfPartner = () => S.focus && S.partners[S.focus] ? S.focus : LF().partner;
const partnerOpts = (sel, all = 'All partners') => `<option value="">${esc(all)}</option>${sortedPartners().map(p => `<option value="${esc(p.id)}" ${sel === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}`;

/* ----- account mapping ----- */
function vLeadMap() {
  const F = LF(), pid = lfPartner(), accts = vals(S.accounts);
  const pairs = []; accts.forEach(a => pairsOf(a).forEach(x => { if (!pid || x.pid === pid) pairs.push({...x, a}); }));
  const grid = {}; pairs.forEach(x => { const k = (x.a.vendorStatus || 'none') + '|' + (x.status || 'none'); grid[k] = (grid[k] || 0) + 1; });
  const shown = F.cell ? pairs.filter(x => (x.a.vendorStatus || 'none') + '|' + (x.status || 'none') === F.cell) : pairs.filter(x => ['intro','cosell','bringin'].includes(x.ovl));
  const worth = pairs.filter(x => ['intro','cosell','bringin'].includes(x.ovl)).length;
  const mappedAccts = new Set(pairs.map(x => x.a.id));
  const openLeads = vals(S.leads).filter(l => LOPEN.has(l.status) && (!pid || l.partnerId === pid)).length;
  const pipe = sum([...mappedAccts].map(id => ({id, ...AC(id)})), a => acctOpenPipe(a));
  const prio = S.prio && S.prio.pid === pid ? S.prio : null, busy = S.busy['prio'];
  return `${leadsHead('leads', 'Which accounts you and each partner share, who already has the relationship, and where to work together next.', `<div class="row"><a class="btn" href="#leads-import">Import list</a><button class="btn primary" data-act="opnew" data-kind="account" data-pid="${esc(pid)}">New account</button></div>`)}
  <div class="spread lmbar" style="margin-top:16px"><div class="field" style="min-width:240px"><label for="lmPartner">Partner</label><select class="inp" id="lmPartner" data-lf="partner" ${S.focus ? 'disabled' : ''}>${partnerOpts(pid)}</select></div>
    ${F.cell ? `<button class="btn sm" data-act="lmcell" data-v="" data-p="">Clear the cell filter</button>` : ''}</div>
  <div class="kpis">
    <div class="kpi"><span class="eyebrow">Mapped accounts</span><span class="v num">${mappedAccts.size}</span><span class="s">${pairs.length} account–partner pairs</span></div>
    <div class="kpi camp"><span class="eyebrow">Overlaps worth working</span><span class="v num">${worth}</span><span class="s">introductions, co-sells and hand-ins</span></div>
    <a class="kpi" href="#leads-people"><span class="eyebrow">Open leads</span><span class="v num">${openLeads}</span><span class="s">${vals(S.leads).filter(l => l.status === 'new' && (!pid || l.partnerId === pid)).length} new, not yet routed</span></a>
    <div class="kpi pipe"><span class="eyebrow">Open pipeline on mapped accounts</span><span class="v num">${money(pipe)}</span><span class="s">from partner deals on these accounts</span></div>
  </div>
  <section class="panel"><div class="panel-h"><h2>Overlap matrix</h2><span class="muted small">Click a cell to list its accounts</span></div>
      <div class="panel-b lmgrid"><div class="tw"><table class="lmatrix"><thead><tr><th scope="col"><span class="small muted">You ↓ · Partner →</span></th>${VST_KEYS.map(p => `<th scope="col">${esc(VST[p][0])}</th>`).join('')}</tr></thead>
      <tbody>${VST_KEYS.map(v => `<tr><th scope="row">${esc(VST[v][0])}</th>${VST_KEYS.map(p => { const k = v + '|' + p, n = grid[k] || 0, o = overlapOf(v, p); return `<td><button class="lmc o-${o} ${F.cell === k ? 'on' : ''}" data-act="lmcell" data-v="${v}" data-p="${p}" ${n ? '' : 'disabled'} title="${esc(OVL[o][0])}: ${n}"><b class="num">${n}</b><span>${esc(OVL[o][0])}</span></button></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
      <dl class="ovlkey">${OVL_KEYS.map(k => `<div><dt>${ovlPill(k)}</dt><dd>${esc(OVL[k][2])}</dd></div>`).join('')}</dl></div></section>
    <section class="panel" style="margin-top:16px"><div class="panel-h"><h2>Best accounts to work</h2><button class="btn sm ai" data-act="lmprio" ${busy || !pairs.length ? 'disabled' : ''}>${busy ? 'Thinking…' : prio ? 'Ask again' : 'Suggest with AI'}</button></div>
      ${prio ? `<div class="list priolist">${prio.items.map((x, i) => `<div class="li prio"><span class="num prion">${i + 1}</span><span class="t">${aRefL(x.accountId)} <span class="small muted">with ${esc(pName(x.partnerId))}</span>${x.lead ? ` <span class="pill">${esc(x.lead)} leads</span>` : ''}</span><span class="d">${esc(x.why)}${x.firstMove ? `<br><b>First move:</b> ${esc(x.firstMove)}` : ''}</span></div>`).join('')}</div>` : `<div class="empty">Claude reads the overlaps, open pipeline, leads and next steps${pid ? ` for ${esc(pName(pid))}` : ''} and picks the five accounts most worth your time this week, with a first move for each.</div>`}</section>
  <section class="panel" style="margin-top:16px"><div class="panel-h"><h2>${F.cell ? `${esc(VST[F.cell.split('|')[0]][0])} for you, ${esc(VST[F.cell.split('|')[1]][0].toLowerCase())} for the partner` : 'Overlaps to work'}</h2><span class="muted small">${plural(shown.length, 'pair')}</span></div>
    ${table('lm-pairs', [
      {h:'Account', asc:1, sort:r => r.a.name.toLowerCase(), v:r => `${aRefL(r.a.id)}${ex(r.a)}<span class="sub">${esc(pName(r.pid))}${r.owner ? ' · ' + esc(r.owner) : ''}</span>`},
      {h:'You', sort:r => vRank(r.a.vendorStatus), v:r => vstPill(r.a.vendorStatus)},
      {h:'Partner', sort:r => vRank(r.status), v:r => vstPill(r.status)},
      {h:'Overlap', asc:1, sort:r => OVL_KEYS.indexOf(r.ovl), v:r => ovlPill(r.ovl)},
      {h:'Who leads', asc:1, sort:r => MOTION[r.a.motion] || 'zz', v:r => esc(MOTION[r.a.motion] || '—')},
      {h:'Next step', asc:1, sort:r => r.a.nextStepDate || '9999', v:r => r.a.nextStep ? `${esc(r.a.nextStep)}<span class="sub ${r.a.nextStepDate && r.a.nextStepDate < today() ? 'late' : ''}">${fdate(r.a.nextStepDate)}</span>` : '<span class="muted">—</span>'}
    ], S.lmAll || F.cell ? shown : shown.slice(0, 15), F.cell ? 'No accounts in this cell.' : 'No overlaps yet. Map partners onto accounts, or import a list.')}
    ${!F.cell && shown.length > 15 ? `<div class="panel-b" style="border-top:1px solid var(--line)"><button class="btn sm" data-act="lmall">${S.lmAll ? 'Show the first 15' : `Show all ${shown.length}`}</button></div>` : ''}</section>

  </div>
`;
}

/* ----- accounts list ----- */
function vLeadAccounts() {
  const F = LF(), pid = lfPartner(), q = (F.q || '').toLowerCase();
  const rows = vals(S.accounts).filter(a => (!pid || a.partners?.[pid]) && (!F.ovl || bestOverlap(a, pid) === F.ovl) && (!F.stage || a.stage === F.stage) && (!q || `${a.name} ${a.domain} ${a.industry} ${a.city} ${a.state}`.toLowerCase().includes(q)));
  return `${leadsHead('leads-accounts', 'Every shared account, which partners are mapped to it, and the plan for working it together.', `<div class="row"><a class="btn" href="#leads-import">Import list</a><button class="btn primary" data-act="opnew" data-kind="account" data-pid="${esc(pid)}">New account</button></div>`)}
  <div class="fbar lafilters" style="margin-top:16px"><div class="field f-q"><label for="laQ">Search</label><input class="inp" id="laQ" data-lf="q" value="${esc(F.q)}" placeholder="Name, domain, industry or city"></div>
    <div class="field"><label for="laPartner">Partner</label><select class="inp" id="laPartner" data-lf="partner" ${S.focus ? 'disabled' : ''}>${partnerOpts(pid)}</select></div>
    <div class="field"><label for="laOvl">Overlap</label><select class="inp" id="laOvl" data-lf="ovl"><option value="">Any overlap</option>${OVL_KEYS.map(k => `<option value="${k}" ${F.ovl === k ? 'selected' : ''}>${esc(OVL[k][0])}</option>`).join('')}</select></div>
    <div class="field"><label for="laStage">Stage</label><select class="inp" id="laStage" data-lf="stage"><option value="">Any stage</option>${Object.entries(ASTAGE).map(([k, v]) => `<option value="${k}" ${F.stage === k ? 'selected' : ''}>${esc(v[0])}</option>`).join('')}</select></div></div>
  <section class="panel">${table('la', [
    {h:'Account', asc:1, sort:r => r.name.toLowerCase(), v:r => `${aRefL(r.id)}${ex(r)}<span class="sub">${esc([r.domain, r.industry].filter(Boolean).join(' · '))}</span>`},
    {h:'Partners', v:r => `<div class="pchips">${pairsOf(r).map(x => `<span class="pchip ${VST[x.status]?.[2] || ''}" title="${esc(pName(x.pid))}: ${esc(VST[x.status]?.[0] || '')}">${esc(pName(x.pid).split(' ').slice(0, 2).join(' '))}</span>`).join('') || '<span class="muted small">None mapped</span>'}</div>`},
    {h:'You', sort:r => vRank(r.vendorStatus), v:r => vstPill(r.vendorStatus)},
    {h:'Overlap', asc:1, sort:r => OVL_KEYS.indexOf(bestOverlap(r, pid) || 'white'), v:r => ovlPill(bestOverlap(r, pid))},
    {h:'Stage', asc:1, sort:r => Object.keys(ASTAGE).indexOf(r.stage), v:r => stPill(ASTAGE, r.stage || 'identified')},
    {h:'Next step', asc:1, sort:r => r.nextStepDate || '9999', v:r => r.nextStep ? `${esc(r.nextStep)}<span class="sub ${r.nextStepDate && r.nextStepDate < today() ? 'late' : ''}">${fdate(r.nextStepDate)}</span>` : '<span class="muted">—</span>'},
    {h:'Leads', r:1, sort:r => leadsForAcct(r.id).length, v:r => leadsForAcct(r.id).length || '—'},
    {h:'Open pipeline', r:1, sort:r => acctOpenPipe(r), v:r => money(acctOpenPipe(r))}
  ], rows, 'No accounts match. Clear a filter, add an account, or import a list.')}</section>`;
}

/* ----- leads list ----- */
function vLeadPeople() {
  const F = LF(), pid = S.focus && S.partners[S.focus] ? S.focus : F.lpartner, q = (F.lq || '').toLowerCase(), st = S.filter.lstatusx || 'open';
  const all = vals(S.leads).filter(l => (!pid || l.partnerId === pid) && (!q || `${l.name} ${l.title} ${l.company} ${l.email}`.toLowerCase().includes(q)));
  const rows = all.filter(l => st === 'all' ? true : st === 'open' ? LOPEN.has(l.status) : st === 'closed' ? !LOPEN.has(l.status) : l.status === st);
  const segs = [['open','Open'],['new','New'],['assigned','Waiting on partner'],['working','Working'],['qualified','Qualified'],['closed','Closed'],['all','All']];
  const cnt = k => all.filter(l => k === 'all' ? true : k === 'open' ? LOPEN.has(l.status) : k === 'closed' ? !LOPEN.has(l.status) : l.status === k).length;
  return `${leadsHead('leads-people', 'People to reach, who owns each one, and where they are in the hand-off between you and the partner.', `<div class="row"><a class="btn" href="#leads-import">Import list</a><button class="btn primary" data-act="opnew" data-kind="lead" data-pid="${esc(pid)}">New lead</button></div>`)}
  <div class="spread" style="margin-top:16px;align-items:flex-end"><div class="seg" role="group" aria-label="Filter leads">${segs.map(([k, l]) => `<button data-act="filter" data-key="lstatusx" data-val="${k}" aria-pressed="${st === k}">${l} <span class="num small">${cnt(k)}</span></button>`).join('')}</div>
    <div class="row"><div class="field"><label for="lpQ">Search</label><input class="inp" id="lpQ" data-lf="lq" value="${esc(F.lq)}" placeholder="Name, title, company"></div><div class="field"><label for="lpPartner">Partner</label><select class="inp" id="lpPartner" data-lf="lpartner" ${S.focus ? 'disabled' : ''}>${partnerOpts(pid)}</select></div></div></div>
  <section class="panel" style="margin-top:12px">${table('lp', [
    {h:'Lead', asc:1, sort:r => r.name.toLowerCase(), v:r => `${lRef(r.id)}${ex(r)}<span class="sub">${esc(r.title || '')}</span>`},
    {h:'Account', asc:1, sort:r => (AC(r.accountId)?.name || r.company || '').toLowerCase(), v:r => r.accountId && AC(r.accountId) ? aRefL(r.accountId) : esc(r.company || '—')},
    {h:'Partner', asc:1, sort:r => r.partnerId ? pName(r.partnerId) : 'zzz', v:r => r.partnerId ? pRef(r.partnerId) : '<span class="pill warn">Unassigned</span>'},
    {h:'Status', sort:r => LFLOW.indexOf(r.status), v:r => stPill(LST, r.status)},
    {h:'Rating', sort:r => ['cold','warm','hot'].indexOf(r.rating), v:r => r.rating ? stPill(RATING, r.rating) : '—'},
    {h:'Source', asc:1, sort:r => r.source || '', v:r => esc(r.source || '—')},
    {h:'Age', r:1, sort:r => leadAge(r), v:r => `${leadAge(r)}d`},
    {h:'Next step', asc:1, sort:r => r.nextStepDate || '9999', v:r => r.nextStep ? `${esc(r.nextStep)}<span class="sub ${r.nextStepDate && r.nextStepDate < today() ? 'late' : ''}">${fdate(r.nextStepDate)}</span>` : '<span class="muted">—</span>'}
  ], rows, 'No leads match this filter.')}</section>`;
}

/* ----- account record ----- */
function vAccount(id) {
  const a = {id, ...AC(id)}, pairs = pairsOf(a), leads = leadsForAcct(id);
  const unmapped = sortedPartners().filter(p => !a.partners?.[p.id]);
  const dis = S.canWrite ? '' : 'disabled', AI = S.acctAI?.[id] || {}, busy = S.busy['plays:' + id];
  const plays = a.plays || [];
  return `${crumbs(['Home','home'],['Leads & accounts','leads'],['Accounts','leads-accounts'],[a.name])}
  <div class="phead"><div><div class="row"><span class="kind pipe">account</span>${stPill(ASTAGE, a.stage || 'identified')}${vstPill(a.vendorStatus)}${a.tier ? `<span class="tier">${esc(a.tier)}</span>` : ''}${ex(a)}</div><h1 style="margin-top:6px">${esc(a.name)}</h1><p class="sub">${esc([a.domain, a.industry, [a.city, a.state].filter(Boolean).join(', '), a.employees ? Number(a.employees).toLocaleString() + ' employees' : ''].filter(Boolean).join(' · '))}</p></div>
    <div class="row">${crmPushBtns('account', id)}<button class="btn sm" data-act="opnew" data-kind="lead" data-acct="${esc(id)}" ${dis}>Add lead</button><button class="btn sm primary" data-act="opopen" data-kind="account" data-id="${esc(id)}" ${dis}>Edit account</button></div></div>
  <div class="grid-main">
    <div class="stack">
      <section class="panel"><div class="panel-h"><h2>Partner mapping</h2><span class="muted small">Who has the relationship today</span></div>
        <div class="tw"><table class="amap"><thead><tr><th>Partner</th><th>Their status</th><th>Their role</th><th>Partner owner</th><th>Overlap</th><th></th></tr></thead><tbody>
        ${pairs.map(x => `<tr><td>${pRef(x.pid)}</td>
          <td><select class="inp sm" data-amap="${esc(x.pid)}" data-f="status" aria-label="${esc(pName(x.pid))} status" ${dis}>${VST_KEYS.map(k => `<option value="${k}" ${x.status === k ? 'selected' : ''}>${esc(VST[k][0])}</option>`).join('')}</select></td>
          <td><select class="inp sm" data-amap="${esc(x.pid)}" data-f="role" aria-label="${esc(pName(x.pid))} role" ${dis}><option value="">—</option>${Object.entries(PROLE).map(([k, l]) => `<option value="${k}" ${x.role === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></td>
          <td><input class="inp sm" data-amap="${esc(x.pid)}" data-f="owner" value="${esc(x.owner || '')}" placeholder="Name" aria-label="${esc(pName(x.pid))} owner" ${dis}></td>
          <td>${ovlPill(x.ovl)}</td>
          <td><button class="btn sm ghost ${S.armed === 'unmap-' + x.pid ? 'armed' : ''}" data-act="aunmap" data-id="${esc(id)}" data-pid="${esc(x.pid)}" aria-label="Remove ${esc(pName(x.pid))}" ${dis}>${S.armed === 'unmap-' + x.pid ? 'Confirm' : '✕'}</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">No partners mapped yet.</td></tr>'}
        </tbody></table></div>
        ${unmapped.length ? `<div class="panel-b row" style="border-top:1px solid var(--line)"><select class="inp" id="amapAdd" aria-label="Partner to add" style="max-width:280px">${unmapped.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select><select class="inp" id="amapAddSt" aria-label="Their status" style="max-width:200px">${VST_KEYS.map(k => `<option value="${k}" ${k === 'prospect' ? 'selected' : ''}>${esc(VST[k][0])}</option>`).join('')}</select><button class="btn" data-act="amapadd" data-id="${esc(id)}" ${dis}>Map partner</button></div>` : ''}
        ${pairs.length ? `<p class="panel-b small muted" style="border-top:1px solid var(--line)">${esc(OVL[bestOverlap(a)][2])}</p>` : ''}</section>
      <section class="panel"><div class="panel-h"><h2>Co-sell plan</h2><span class="muted small">Changes save as you make them</span></div><div class="panel-b"><div class="fgrid">
        <div class="field"><label for="apStage">Stage</label><select class="inp" id="apStage" data-acf="stage" ${dis}>${Object.entries(ASTAGE).map(([k, v]) => `<option value="${k}" ${(a.stage || 'identified') === k ? 'selected' : ''}>${esc(v[0])}</option>`).join('')}</select></div>
        <div class="field"><label for="apMotion">Who leads</label><select class="inp" id="apMotion" data-acf="motion" ${dis}><option value="">Not decided</option>${Object.entries(MOTION).map(([k, l]) => `<option value="${k}" ${a.motion === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
        <div class="field"><label for="apVs">Your status</label><select class="inp" id="apVs" data-acf="vendorStatus" ${dis}>${VST_KEYS.map(k => `<option value="${k}" ${(a.vendorStatus || 'none') === k ? 'selected' : ''}>${esc(VST[k][0])}</option>`).join('')}</select></div>
        <div class="field"><label for="apOwner">${esc(brand().vendorName)} owner</label><input class="inp" id="apOwner" data-acf="vendorOwner" value="${esc(dv(id + ':vendorOwner', a.vendorOwner || ''))}" placeholder="Account executive" ${dis}></div>
        <div class="field" style="grid-column:span 3"><label for="apNext">Next step</label><input class="inp" id="apNext" data-acf="nextStep" value="${esc(dv(id + ':nextStep', a.nextStep || ''))}" placeholder="e.g. Partner intro call with the CIO" ${dis}></div>
        <div class="field"><label for="apNextD">Due</label><input class="inp" type="date" id="apNextD" data-acf="nextStepDate" value="${esc(a.nextStepDate || '')}" ${dis}></div></div></div></section>
      <section class="panel"><div class="panel-h"><h2>Engagement brainstorm</h2><span class="muted small">AI plays for this account</span></div>
        <div class="panel-b stack" style="gap:10px"><div class="fgrid" style="grid-template-columns:minmax(0,1fr) minmax(0,2fr) auto">
          <div class="field"><label for="abPartner">With partner</label><select class="inp" id="abPartner">${pairs.length ? pairs.map(x => `<option value="${esc(x.pid)}" ${AI.pid === x.pid ? 'selected' : ''}>${esc(pName(x.pid))}</option>`).join('') : '<option value="">Map a partner first</option>'}</select></div>
          <div class="field"><label for="abAngle">Angle (optional)</label><input class="inp" id="abAngle" value="${esc(AI.angle || '')}" placeholder="e.g. renewal in Q1, new CISO, insurance audit"></div>
          <button class="btn ai" data-act="acctplays" data-id="${esc(id)}" ${busy || !pairs.length ? 'disabled' : ''}>${busy ? 'Brainstorming…' : 'Brainstorm plays'}</button></div>
          ${AI.summary ? `<p class="aisum">${esc(AI.summary)}</p>` : ''}
          ${(AI.plays || []).map((p, i) => playCard(p, id, 'n' + i, false)).join('')}
        </div>
        ${plays.length ? `<div class="panel-b" style="border-top:1px solid var(--line)"><span class="eyebrow">Saved plays</span><div class="stack" style="gap:10px;margin-top:8px">${plays.map(p => playCard(p, id, p.id, true)).join('')}</div></div>` : ''}</section>
      ${acctThread(id)}
    </div>
    <div class="stack">
      <section class="panel"><div class="panel-h"><h2>People</h2><button class="btn sm" data-act="opnew" data-kind="lead" data-acct="${esc(id)}" ${dis}>Add lead</button></div>
        <div class="list">${leads.map(l => `<div class="li"><span class="kind camp">lead</span><span class="t">${lRef(l.id)}</span><span class="d">${esc([l.title, l.partnerId ? pName(l.partnerId) : ''].filter(Boolean).join(' · '))}</span><span class="a">${stPill(LST, l.status)}</span></div>`).join('') || '<div class="empty">No leads at this account yet.</div>'}</div></section>
      <section class="panel"><div class="panel-h"><h2>Opportunities</h2><button class="btn sm" data-act="opnew" data-kind="opp" data-acct="${esc(id)}" ${dis}>Log opportunity</button></div>
        <div class="list">${dealsForAcct(a).map(d => { const did = d.id; return `<div class="li"><span class="kind pipe">deal</span><span class="t">${dRef(did)}</span><span class="d">${esc(d.product || '')} · ${pName(d.partnerId)} · ${STAGE[d.stage]?.label || ''}</span><span class="a num">${money(d.amount)}</span></div>`; }).join('') || '<div class="empty">No partner deals on this account yet.</div>'}</div></section>
      <section class="panel"><div class="panel-h"><h2>Account facts</h2></div><div class="panel-b"><dl class="facts" style="grid-template-columns:1fr 1fr">
        <div><dt>Tier</dt><dd>${esc(a.tier || '—')}</dd></div><div><dt>Source</dt><dd>${esc(a.source || 'Added here')}</dd></div>
        <div><dt>${esc(brand().vendorName)} owner</dt><dd>${esc(a.vendorOwner || '—')}</dd></div><div><dt>Synced to</dt><dd>${[a.crm?.notion ? 'Notion' : '', a.crm?.apollo ? 'Apollo' : ''].filter(Boolean).join(', ') || '—'}</dd></div>
        ${a.notes ? `<div style="grid-column:1/-1"><dt>Notes</dt><dd>${esc(a.notes)}</dd></div>` : ''}</dl></div></section>
    </div>
  </div>`;
}
function playCard(p, aid, key, saved) {
  const em = S.playEmail?.[aid + ':' + key], ebusy = S.busy['pmail:' + aid + ':' + key];
  return `<article class="play ${saved ? 'saved' : ''}"><div class="spread"><h3>${esc(p.title)}</h3><div class="row">${p.motion ? `<span class="pill camp">${esc(p.motion)}</span>` : ''}${p.lead ? `<span class="pill">${esc(p.lead)} leads</span>` : ''}${saved ? `<select class="inp sm" data-playst="${esc(p.id)}" data-id="${esc(aid)}" aria-label="Play status">${[['idea','Idea'],['active','In progress'],['done','Done']].map(([k, l]) => `<option value="${k}" ${(p.status || 'idea') === k ? 'selected' : ''}>${l}</option>`).join('')}</select>` : ''}</div></div>
    ${p.partnerId ? `<p class="small muted">With ${esc(pName(p.partnerId))}</p>` : ''}
    <p class="small">${esc(p.why || '')}</p>
    ${(p.steps || []).length ? `<ol class="small">${p.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
    ${p.talkTrack ? `<p class="small talk"><b>Opener:</b> ${esc(p.talkTrack)}</p>` : ''}
    ${(p.targets || []).length ? `<p class="small"><b>Reach:</b> ${p.targets.map(esc).join(', ')}</p>` : ''}
    ${(p.signals || []).length ? `<p class="small muted"><b>It’s working when:</b> ${p.signals.map(esc).join('; ')}</p>` : ''}
    ${em ? `<div class="field"><label for="pm-${esc(key)}">Draft intro email</label><textarea class="inp" id="pm-${esc(key)}" rows="8">${esc(em)}</textarea></div>` : ''}
    <div class="row">${saved ? `<button class="btn sm ghost ${S.armed === 'pdel-' + p.id ? 'armed' : ''}" data-act="playdel" data-id="${esc(aid)}" data-k="${esc(p.id)}">${S.armed === 'pdel-' + p.id ? 'Confirm remove' : 'Remove'}</button>` : `<button class="btn sm primary" data-act="playsave" data-id="${esc(aid)}" data-k="${esc(key)}" ${S.canWrite ? '' : 'disabled'}>Save play</button><button class="btn sm ghost" data-act="playdrop" data-id="${esc(aid)}" data-k="${esc(key)}">Dismiss</button>`}
      <button class="btn sm ai" data-act="playmail" data-id="${esc(aid)}" data-k="${esc(key)}" ${ebusy ? 'disabled' : ''}>${ebusy ? 'Writing…' : em ? 'Rewrite email' : 'Draft intro email'}</button>${em ? `<button class="btn sm" data-act="copytext" data-src="pm-${esc(key)}">Copy</button>` : ''}</div></article>`;
}
function acctThread(id) {
  const th = AC(id).thread || [];
  return `<section class="panel"><div class="panel-h"><h2>Account notes</h2><span class="muted small">${plural(th.length, 'note')}</span></div>
    <div class="list">${th.map(t => `<div class="li"><span class="kind pipe">${esc(t.by === 'sample' ? 'note' : t.by || 'note')}</span><span class="t" style="white-space:pre-wrap;font-weight:500">${esc(t.text)}</span><span class="d">${fdate(String(t.at).slice(0, 10))}</span></div>`).join('') || '<div class="empty">No notes yet. Record what each side learned and agreed.</div>'}</div>
    <div class="panel-b" style="border-top:1px solid var(--line)"><label class="small muted" for="acmt">Add a note</label><textarea class="inp" id="acmt" rows="2" placeholder="What you or the partner learned, decided or promised">${esc(dv(id + ':acmt', ''))}</textarea><div class="row" style="margin-top:8px;justify-content:flex-end"><button class="btn sm primary" data-act="acmtpost" data-id="${esc(id)}" ${S.canWrite ? '' : 'disabled'}>Post note</button></div></div></section>`;
}

/* ----- lead record ----- */
function vLead(id) {
  const l = {id, ...LD(id)}, a = AC(l.accountId), dis = S.canWrite ? '' : 'disabled', at = LFLOW.indexOf(l.status);
  const pair = a && l.partnerId && a.partners?.[l.partnerId] ? {...a.partners[l.partnerId], ovl:overlapOf(a.vendorStatus, a.partners[l.partnerId].status)} : null;
  const ho = S.handoff?.[id], hbusy = S.busy['handoff:' + id];
  let act = '';
  if (l.status === 'new' || l.status === 'declined') act = `<div class="row"><select class="inp" id="lAssign" aria-label="Partner" style="max-width:260px">${sortedPartners().map(p => `<option value="${esc(p.id)}" ${l.partnerId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select><button class="btn primary" data-act="lassign" data-id="${esc(id)}" ${dis}>Assign to partner</button><button class="btn" data-act="lstep" data-id="${esc(id)}" data-to="working" ${dis}>Keep it, we’ll work it</button></div>`;
  else if (l.status === 'assigned') act = `<div class="row"><button class="btn ok" data-act="lstep" data-id="${esc(id)}" data-to="accepted" ${dis}>Partner accepted</button><button class="btn" data-act="opopen" data-kind="ldecline" data-id="${esc(id)}" ${dis}>Partner declined…</button></div>`;
  else if (l.status === 'accepted') act = `<button class="btn primary" data-act="lstep" data-id="${esc(id)}" data-to="working" ${dis}>Start working</button>`;
  else if (l.status === 'working') act = `<button class="btn primary" data-act="lstep" data-id="${esc(id)}" data-to="qualified" ${dis}>Mark qualified</button>`;
  else if (l.status === 'qualified') act = `<button class="btn ok" data-act="opopen" data-kind="convert" data-id="${esc(id)}" ${dis}>Convert to opportunity…</button>`;
  const hint = {new:'Route it to the partner best placed to work it, or keep it on your side.', assigned:`Waiting for ${esc(pName(l.partnerId))} to accept. Record their answer here.`, accepted:'The partner has it. Start when the first touch happens.', working:'Mark it qualified once there’s a real need, budget and timeline.', qualified:'Turn it into a partner opportunity so it shows in pipeline and attribution.', converted:'This lead became an opportunity.', declined:'The partner passed. Reassign it, or keep it yourself.', disqualified:'Closed without an opportunity.'}[l.status] || '';
  return `${crumbs(['Home','home'],['Leads & accounts','leads'],['Leads','leads-people'],[l.name])}
  <div class="phead"><div><div class="row"><span class="kind camp">lead</span>${stPill(LST, l.status)}${l.rating ? stPill(RATING, l.rating) : ''}${ex(l)}</div><h1 style="margin-top:6px">${esc(l.name)}</h1><p class="sub">${esc(l.title || '')}${l.title ? ' · ' : ''}${a ? aRefL(l.accountId) : esc(l.company || '')}${l.partnerId ? ' · ' + pRef(l.partnerId) : ''}</p></div>
    <div class="row">${crmPushBtns('lead', id)}<button class="btn sm primary" data-act="opopen" data-kind="lead" data-id="${esc(id)}" ${dis}>Edit lead</button></div></div>
  <div class="grid-main">
    <div class="stack">
      <section class="panel"><div class="panel-h"><h2>Hand-off</h2>${stPill(LST, l.status)}</div><div class="panel-b stack" style="gap:12px">
        <ol class="mflow">${LFLOW.map((s, i) => `<li class="${i < at ? 'done' : i === at ? 'cur' : ''}">${esc(LST[s][0].replace(' to partner', ''))}</li>`).join('')}</ol>
        <p class="small muted">${hint}</p>${act}
        ${l.status === 'converted' && l.dealId ? `<p>Opportunity: ${dRef(l.dealId)}</p>` : ''}
        ${LOPEN.has(l.status) ? `<button class="linkbtn small" style="align-self:flex-start" data-act="opopen" data-kind="ldisq" data-id="${esc(id)}" ${dis}>Disqualify…</button>` : ''}
        <div class="fgrid" style="grid-template-columns:minmax(0,3fr) minmax(0,1fr)"><div class="field"><label for="lNext">Next step</label><input class="inp" id="lNext" data-lfld="nextStep" value="${esc(dv(id + ':nextStep', l.nextStep || ''))}" placeholder="e.g. Partner books discovery call" ${dis}></div><div class="field"><label for="lNextD">Due</label><input class="inp" type="date" id="lNextD" data-lfld="nextStepDate" value="${esc(l.nextStepDate || '')}" ${dis}></div></div>
      </div></section>
      <section class="panel"><div class="panel-h"><h2>Partner hand-off note</h2><button class="btn sm ai" data-act="lhandoff" data-id="${esc(id)}" ${hbusy ? 'disabled' : ''}>${hbusy ? 'Writing…' : ho ? 'Rewrite' : 'Draft with AI'}</button></div>
        ${ho ? `<div class="panel-b"><textarea class="inp" id="lHandoff" rows="9">${esc(ho)}</textarea><div class="row" style="margin-top:8px;justify-content:flex-end"><button class="btn sm" data-act="copytext" data-src="lHandoff">Copy</button></div></div>` : `<div class="empty">A short note for the partner rep: who this is, why now, what you know, and the first move you suggest.</div>`}</section>
      <section class="panel"><div class="panel-h"><h2>History</h2></div><div class="list">${(l.history || []).slice().reverse().map(h => `<div class="li"><span class="num small muted">${fdate(String(h.at).slice(0, 10))}</span><span class="t">${esc(h.action)}</span><span class="d">${esc([h.note, h.by && h.by !== 'sample' ? h.by : ''].filter(Boolean).join(' · '))}</span></div>`).join('') || '<div class="empty">No history yet.</div>'}</div></section>
    </div>
    <div class="stack">
      <section class="panel"><div class="panel-h"><h2>Contact</h2></div><div class="panel-b"><dl class="facts" style="grid-template-columns:1fr">
        <div><dt>Email</dt><dd>${l.email ? `<a href="mailto:${esc(l.email)}">${esc(l.email)}</a>` : '—'}</dd></div>
        <div><dt>Phone</dt><dd>${esc(l.phone || '—')}</dd></div>
        <div><dt>Owner</dt><dd>${l.owner === 'partner' ? 'Partner' : esc(brand().vendorName)}</dd></div>
        <div><dt>Source</dt><dd>${esc(l.source || '—')} · added ${fdate(String(l.createdAt || '').slice(0, 10))}</dd></div>
        ${l.notes ? `<div><dt>Notes</dt><dd>${esc(l.notes)}</dd></div>` : ''}</dl></div></section>
      ${a ? `<section class="panel"><div class="panel-h"><h2>Account</h2></div><div class="panel-b stack" style="gap:8px"><p>${aRefL(l.accountId)} ${vstPill(a.vendorStatus)}</p>${pair ? `<p class="small">${esc(pName(l.partnerId))}: ${vstPill(pair.status)} ${ovlPill(pair.ovl)}</p><p class="small muted">${esc(OVL[pair.ovl][2])}</p>` : l.partnerId ? `<p class="small muted">${esc(pName(l.partnerId))} isn’t mapped to this account yet. <button class="linkbtn" data-act="lmapacct" data-id="${esc(id)}">Map them as a prospect</button></p>` : ''}${a.nextStep ? `<p class="small"><b>Account next step:</b> ${esc(a.nextStep)}</p>` : ''}</div></section>` : `<section class="panel"><div class="panel-h"><h2>Account</h2></div><div class="panel-b"><p class="small muted">${esc(l.company || 'No company')} isn’t an account in the hub yet.</p><button class="btn sm" data-act="lmkacct" data-id="${esc(id)}" ${dis}>Create account</button></div></section>`}
    </div>
  </div>`;
}

/* ----- AI ----- */
async function aiPlays(id) {
  const a = {id, ...AC(id)}, pid = $('#abPartner')?.value, angle = $('#abAngle')?.value.trim() || '', p = P(pid) || {}, b = brand();
  S.acctAI = S.acctAI || {}; S.acctAI[id] = {...(S.acctAI[id] || {}), pid, angle};
  if (!pid) return;
  const r0 = a.partners?.[pid] || {}, ovl = overlapOf(a.vendorStatus, r0.status);
  const others = pairsOf(a).filter(x => x.pid !== pid).map(x => `${pName(x.pid)}: ${VST[x.status]?.[0]}`).join('; ');
  const people = leadsForAcct(id).slice(0, 10).map(l => `${l.name} — ${l.title || 'unknown title'} — ${LST[l.status]?.[0]}${l.partnerId ? ' (with ' + pName(l.partnerId) + ')' : ''}`).join('\n');
  const opps = dealsForAcct(a).slice(0, 6).map(d => `${d.name || d.product} — ${STAGE[d.stage]?.label} — ${money(d.amount)} (${pName(d.partnerId)})`).join('\n');
  const notes = (a.thread || []).slice(-5).map(t => '- ' + t.text).join('\n');
  await withAI('plays:' + id, async sample => {
    const prompt = `You are a channel sales strategist helping a vendor's partner account manager plan how to engage one account together with a channel partner.\n\nVendor: ${b.vendorName}\nVendor voice: ${b.voice}\n\nAccount: ${a.name}${a.domain ? ' (' + a.domain + ')' : ''}\nIndustry: ${a.industry || 'unknown'}\nLocation: ${[a.city, a.state].filter(Boolean).join(', ') || 'unknown'}\nEmployees: ${a.employees || 'unknown'}\nTier: ${a.tier || 'not set'}\nVendor relationship: ${VST[a.vendorStatus]?.[0] || 'Not engaged'}\nCo-sell stage: ${ASTAGE[a.stage]?.[0] || 'Identified'}; who leads: ${MOTION[a.motion] || 'not decided'}\n\nPartner: ${p.name} (${p.type || 'partner'}, ${p.tier || ''} tier, ${p.region || ''})\nPartner relationship with this account: ${VST[r0.status]?.[0] || 'Not engaged'}${r0.role ? ', role: ' + PROLE[r0.role] : ''}${r0.owner ? ', partner owner: ' + r0.owner : ''}\nOverlap: ${OVL[ovl][0]} — ${OVL[ovl][2]}${others ? '\nOther partners mapped: ' + others : ''}\n\nPeople we know there:\n${people || 'none yet'}\n\nOpen or recent opportunities:\n${opps || 'none'}${notes ? '\n\nRecent notes:\n' + notes : ''}${(a.plays || []).length ? '\n\nPlays already saved (do not repeat): ' + a.plays.map(x => x.title).join('; ') : ''}${angle ? '\n\nAngle to emphasize: ' + angle : ''}\n\nSuggest 4 distinct, realistic plays for engaging this account together. Fit them to the overlap: a partner-held account calls for an introduction, a vendor-held one for bringing the partner's services in, shared pipeline for a single co-sell plan. Each play names who leads and gives concrete first steps with an owner. Do not invent facts about the account (no made-up initiatives, numbers or people); where a specific would help, write a placeholder in square brackets.\n\nReply with only JSON: {"summary":"two sentences on the situation and the best opening","plays":[{"title":"short name","motion":"Co-sell|Partner intro|Referral|Expansion|Event|Executive alignment","lead":"Vendor|Partner|Joint","why":"one or two sentences","steps":["3 or 4 first steps, each starting with the owner"],"talkTrack":"a 2-3 sentence opener","targets":["roles to reach"],"signals":["2 signs it is working"]}]}`;
    const r = await sample.json(prompt, {cache:false});
    if (!r || !Array.isArray(r.plays)) throw {code:'invalid_json'};
    const plays = r.plays.slice(0, 6).map(x => ({title:String(x.title || 'Play'), motion:String(x.motion || ''), lead:String(x.lead || ''), why:String(x.why || ''), steps:(x.steps || []).map(String).slice(0, 6), talkTrack:String(x.talkTrack || ''), targets:(x.targets || []).map(String).slice(0, 6), signals:(x.signals || []).map(String).slice(0, 4), partnerId:pid}));
    S.acctAI[id] = {pid, angle, summary:String(r.summary || ''), plays};
  });
}
async function aiPrio() {
  const pid = lfPartner(), b = brand(), lines = [];
  vals(S.accounts).forEach(a => pairsOf(a).forEach(x => { if ((!pid || x.pid === pid) && x.ovl !== 'white') lines.push({a, x}); }));
  const list = lines.sort((u, v) => acctOpenPipe(v.a) - acctOpenPipe(u.a)).slice(0, 60).map(({a, x}) => `${a.id} | ${a.name} | ${x.pid} ${pName(x.pid)} | you: ${VST[a.vendorStatus]?.[0]} | partner: ${VST[x.status]?.[0]} | ${OVL[x.ovl][0]} | stage ${ASTAGE[a.stage]?.[0] || 'Identified'} | open pipeline ${money(acctOpenPipe(a))} | ${leadsForAcct(a.id).filter(l => LOPEN.has(l.status)).length} open leads | next: ${a.nextStep || 'none'}${a.nextStepDate ? ' by ' + a.nextStepDate : ''}`).join('\n');
  await withAI('prio', async sample => {
    const prompt = `You are a channel sales strategist for ${b.vendorName}. Below are accounts shared with channel partners, one account–partner pair per line (id | account | partner id and name | vendor status | partner status | overlap | stage | open pipeline | open leads | next step). Today is ${today()}.\n\n${list}\n\nRank the account–partner pairs most worth the partner account manager's time this week. Favour warm introductions the partner can make, live co-sell pipeline without a next step, and overdue next steps. Use only the facts given.\n\nReply with only JSON: {"items":[{"accountId":"id from the list","partnerId":"partner id from the list","why":"one sentence","firstMove":"one concrete action","lead":"Vendor|Partner|Joint"}]} with exactly 5 items.`;
    const r = await sample.json(prompt, {cache:false});
    if (!r || !Array.isArray(r.items)) throw {code:'invalid_json'};
    S.prio = {pid, items:r.items.filter(x => AC(x.accountId)).slice(0, 5).map(x => ({accountId:x.accountId, partnerId:S.partners[x.partnerId] ? x.partnerId : (pairsOf(AC(x.accountId))[0]?.pid || ''), why:String(x.why || ''), firstMove:String(x.firstMove || ''), lead:String(x.lead || '')}))};
  });
}
async function aiPlayMail(aid, key) {
  const a = AC(aid), p = key.startsWith('n') ? S.acctAI?.[aid]?.plays?.[+key.slice(1)] : (a.plays || []).find(x => x.id === key); if (!p) return;
  const pt = P(p.partnerId) || {}, b = brand();
  await withAI('pmail:' + aid + ':' + key, async sample => {
    const r = await sample(`Write a short first-touch email for this account play. It is sent by ${p.lead === 'Vendor' ? 'the ' + b.vendorName + ' account executive' : 'the partner rep at ' + (pt.name || 'the partner')}${p.lead === 'Joint' ? ', with the other side copied' : ''} to ${(p.targets || [])[0] || 'the right leader'} at ${a.name}.\n\nPlay: ${p.title}\nWhy: ${p.why}\nOpener idea: ${p.talkTrack}\nVoice: ${b.voice}\n\nUnder 140 words, a subject line first ("Subject: ..."), one clear ask for a short call. No invented facts, numbers or names; use [square-bracket placeholders] for anything you'd need to fill in. Plain text only.`, {cache:false});
    S.playEmail = S.playEmail || {}; S.playEmail[aid + ':' + key] = String(r.text || '').trim();
  });
}
async function aiHandoff(id) {
  const l = LD(id), a = AC(l.accountId), b = brand();
  await withAI('handoff:' + id, async sample => {
    const r = await sample(`Write a short hand-off note from ${b.vendorName}'s partner account manager to the partner rep at ${pName(l.partnerId) || 'the partner'} about a lead.\n\nLead: ${l.name}, ${l.title || 'title unknown'} at ${a?.name || l.company || 'unknown company'}\nRating: ${RATING[l.rating]?.[0] || 'not rated'}; source: ${l.source || 'unknown'}\n${a ? `Account: ${a.industry || ''} ${[a.city, a.state].filter(Boolean).join(', ')}; vendor status ${VST[a.vendorStatus]?.[0]}; partner status ${VST[a.partners?.[l.partnerId]?.status]?.[0] || 'not mapped'}` : ''}\nNotes: ${l.notes || 'none'}\nNext step on file: ${l.nextStep || 'none'}\n\nCover who they are, why now, what we know, what we suggest as the first move, and when we'd like an update. Under 120 words, friendly and direct. No invented facts; use [placeholders]. Plain text.`, {cache:false});
    S.handoff = S.handoff || {}; S.handoff[id] = String(r.text || '').trim();
  });
}

/* ----- forms (extend the shared modal) ----- */
Object.assign(OP_FORMS, {
  account:{title:M => M.id ? 'Edit account' : 'New account', sub:'A company you and your partners share. Map partners on the account page.', fields:M => [
    {k:'name', l:'Account name', req:1, span:2}, {k:'domain', l:'Website domain', span:2, ph:'example.com'},
    {k:'industry', l:'Industry', span:2}, {k:'city', l:'City'}, {k:'state', l:'State'},
    {k:'vendorStatus', l:'Your status', t:'select', o:VST_KEYS.map(k => [k, VST[k][0]])}, {k:'tier', l:'Tier', t:'select', o:[['', '—'], ['Strategic','Strategic'], ['Growth','Growth'], ['Emerging','Emerging']]}, {k:'employees', l:'Employees', t:'num'}, {k:'vendorOwner', l:brand().vendorName + ' owner'},
    ...(M.id ? [] : [{k:'partnerId', l:'Map a partner', t:'select', o:[['', 'Not yet'], ...opPartnerOpts()], span:2}, {k:'partnerStatus', l:'Their status', t:'select', o:VST_KEYS.map(k => [k, VST[k][0]]), span:2}]),
    {k:'notes', l:'Notes', t:'area', span:4}],
    init:id => id ? {...AC(id)} : {vendorStatus:'prospect', partnerStatus:'prospect'},
    save:async (M, v) => {
      const doc = {name:v.name.trim(), domain:cleanDomain(v.domain), industry:v.industry || '', city:v.city || '', state:(v.state || '').toUpperCase().slice(0, 2), vendorStatus:v.vendorStatus || 'none', tier:v.tier || '', employees:numOr(v.employees, 0), vendorOwner:v.vendorOwner || '', notes:v.notes || '', updatedAt:now()};
      if (M.id) return {ok:await write(db => db.doc('accounts/' + M.id).update(doc), 'Account saved')};
      const dup = acctByName(doc.name, doc.domain); if (dup) { M.err = `${dup.name} is already an account.`; return {ok:false}; }
      const nid = newId('ac-'), partners = v.partnerId ? {[v.partnerId]:{status:v.partnerStatus || 'prospect', role:'', owner:''}} : {};
      return {ok:await write(db => db.doc('accounts/' + nid).set({...doc, partners, partnerIds:Object.keys(partners), stage:v.partnerId ? 'mapped' : 'identified', motion:'', nextStep:'', nextStepDate:'', plays:[], thread:[], source:'Added here', createdAt:now()}), 'Account added'), go:nid};
    },
    del:async M => write(async db => { await db.doc('accounts/' + M.id).delete(); for (const l of vals(S.leads).filter(x => x.accountId === M.id)) await db.doc('leads/' + l.id).update({accountId:''}); }, 'Account deleted. Its leads stay, unlinked.'), delTo:'leads-accounts'},
  lead:{title:M => M.id ? 'Edit lead' : 'New lead', sub:'A person to reach. Route it to a partner from the lead page.', fields:M => [
    {k:'first', l:'First name', req:1}, {k:'last', l:'Last name'}, {k:'title', l:'Title', span:2},
    {k:'email', l:'Email', req:1, span:2}, {k:'phone', l:'Phone', span:2},
    {k:'company', l:'Company', req:1, span:2}, {k:'partnerId', l:'Partner', t:'select', o:[['', 'Unassigned'], ...opPartnerOpts()], span:2},
    {k:'rating', l:'Rating', t:'select', o:Object.entries(RATING).map(([k, x]) => [k, x[0]])}, {k:'owner', l:'Owner', t:'select', o:[['vendor', brand().vendorName], ['partner', 'Partner']]}, {k:'source', l:'Source', span:2, ph:'Webinar, referral, inbound…'},
    {k:'notes', l:'Notes', t:'area', span:4}],
    init:id => id ? {...LD(id)} : {rating:'warm', owner:'vendor', source:'Added here'},
    save:async (M, v) => {
      const email = v.email.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { M.err = 'Enter a valid email address.'; return {ok:false}; }
      const dupe = vals(S.leads).find(x => (x.email || '').toLowerCase() === email && x.id !== M.id); if (dupe) { M.err = `${dupe.name} already has that email.`; return {ok:false}; }
      const acct = v.accountId && AC(v.accountId) ? {id:v.accountId, ...AC(v.accountId)} : acctByName(v.company, email.split('@')[1]);
      const doc = {first:v.first.trim(), last:(v.last || '').trim(), name:[v.first.trim(), (v.last || '').trim()].filter(Boolean).join(' '), title:v.title || '', email, phone:v.phone || '', company:acct?.name || v.company.trim(), accountId:acct?.id || '', partnerId:v.partnerId || '', rating:v.rating || '', owner:v.owner || 'vendor', source:v.source || '', notes:v.notes || '', updatedAt:now()};
      if (M.id) return {ok:await write(db => db.doc('leads/' + M.id).update(doc), 'Lead saved')};
      const nid = newId('ld-');
      return {ok:await write(db => db.doc('leads/' + nid).set({...doc, status:doc.partnerId ? 'assigned' : 'new', assignedAt:doc.partnerId ? now() : '', nextStep:'', nextStepDate:'', createdAt:now(), history:[{action:'Created', at:now(), by:meName()}, ...(doc.partnerId ? [{action:'Assigned to ' + pName(doc.partnerId), at:now(), by:meName()}] : [])]}), 'Lead added'), go:nid};
    },
    del:async M => write(db => db.doc('leads/' + M.id).delete(), 'Lead deleted'), delTo:'leads-people'},
  convert:{title:() => 'Convert to opportunity', sub:'Creates a partner deal on this account. It shows in Pipeline and can carry marketing touches.', fields:() => [
    {k:'name', l:'Opportunity name', req:1, span:4}, {k:'amount', l:'Amount ($)', t:'num', req:1}, {k:'stage', l:'Stage', t:'select', o:STAGES.filter(s => OPEN.has(s[0])).map(s => [s[0], s[1]])}, {k:'closeDate', l:'Expected close', t:'date', req:1}, {k:'product', l:'Product'}],
    init:id => { const l = LD(id); return {name:(AC(l.accountId)?.name || l.company) + ' — new opportunity', stage:'registered', closeDate:addDays(today(), 90), amount:''}; },
    save:async (M, v) => {
      const l = LD(M.id), did = newId('DL'), acct = AC(l.accountId);
      const ok = await write(async db => {
        await db.doc('deals/' + did).set({name:v.name.trim(), account:acct?.name || l.company, accountId:l.accountId || '', partnerId:l.partnerId || '', contactId:'', product:v.product || '', stage:v.stage || 'registered', amount:numOr(v.amount), createdAt:today(), closeDate:v.closeDate, nextStep:l.nextStep || '', leadId:M.id, source:'lead'});
        await db.doc('leads/' + M.id).update({status:'converted', dealId:did, history:lhist(l, 'Converted to opportunity'), updatedAt:now()});
        if (acct && acct.vendorStatus !== 'customer') await db.doc('accounts/' + l.accountId).update({vendorStatus:'opportunity', stage:['identified','mapped','engaging'].includes(acct.stage || 'identified') ? 'cosell' : acct.stage, updatedAt:now()});
      }, 'Opportunity created');
      return {ok, go:did};
    }},
  opp:{title:() => 'Log an opportunity', sub:'A partner deal on this account. It shows in Pipeline straight away.', fields:() => [
    {k:'name', l:'Opportunity name', req:1, span:2}, {k:'partnerId', l:'Partner', t:'select', o:opPartnerOpts(), req:1, span:2}, {k:'amount', l:'Amount ($)', t:'num', req:1}, {k:'stage', l:'Stage', t:'select', o:STAGES.map(s => [s[0], s[1]])}, {k:'closeDate', l:'Expected close', t:'date', req:1}, {k:'product', l:'Product'}],
    init:() => ({stage:'registered', closeDate:addDays(today(), 90)}),
    save:async (M, v) => { const a = AC(M.v.accountId), did = newId('DL'); const ok = await write(async db => { await db.doc('deals/' + did).set({name:v.name.trim(), account:a?.name || '', accountId:M.v.accountId || '', partnerId:v.partnerId, contactId:'', product:v.product || '', stage:v.stage, amount:numOr(v.amount), createdAt:today(), closeDate:v.closeDate, nextStep:'', source:'account'}); if (a && !a.partners?.[v.partnerId]) await db.doc('accounts/' + M.v.accountId).update({partners:{...(a.partners || {}), [v.partnerId]:{status:'opportunity', role:'', owner:''}}, partnerIds:[...new Set([...(a.partnerIds || []), v.partnerId])]}); }, 'Opportunity logged'); return {ok, go:did}; }},
  ldecline:{title:() => 'Partner declined the lead', sub:'The reason is kept in the lead’s history.', fields:() => [{k:'note', l:'Reason', t:'area', req:1, span:4}],
    save:async (M, v) => { const l = LD(M.id); return {ok:await write(db => db.doc('leads/' + M.id).update({status:'declined', history:lhist(l, 'Declined by ' + pName(l.partnerId), v.note.trim()), updatedAt:now()}), 'Recorded. Reassign it or keep it.')}; }},
  ldisq:{title:() => 'Disqualify lead', sub:'The reason is kept in the lead’s history.', fields:() => [{k:'note', l:'Reason', t:'area', req:1, span:4}],
    save:async (M, v) => { const l = LD(M.id); return {ok:await write(db => db.doc('leads/' + M.id).update({status:'disqualified', history:lhist(l, 'Disqualified', v.note.trim()), updatedAt:now()}), 'Lead disqualified')}; }}
});

/* ----- import ----- */
const LI_FIELDS = {
  accounts:[
    ['name','Account name',1,['account name','account','company','company name','organization','organisation','name']],
    ['partner','Partner',1,['partner','partner name','reseller','channel partner','partner account']],
    ['vendorStatus','Your status',2,['your status','our status','vendor status','relationship','customer status','account type','type','lifecycle stage']],
    ['partnerStatus','Partner’s status',2,['partner status','partner relationship','partner account status']],
    ['domain','Website domain',2,['domain','website','company domain','website url','company domain name','primary domain']],
    ['motion','Who leads',2,['who leads','motion','sales motion','lead']],
    ['partnerOwner','Partner owner',2,['partner owner','partner rep','partner contact','partner am']],
    ['owner','Your owner',0,['account owner','owner','vendor owner','ae','account executive','company owner']],
    ['industry','Industry',0,['industry','vertical']], ['city','City',0,['city','billing city']], ['state','State',0,['state','billing state','billing state/province','state/region','state province']],
    ['employees','Employees',0,['employees','number of employees','company size','headcount']], ['nextStep','Next step',0,['next step','next steps']], ['crmId','CRM ID',0,['account id','record id','id','crm id','salesforce id','hubspot id']], ['notes','Notes',0,['notes','description','comments']]],
  leads:[
    ['name','Full name',1,['name','full name','contact name','lead name']], ['first','First name',1,['first','first name','firstname']], ['last','Last name',0,['last','last name','lastname','surname']],
    ['email','Email',1,['email','e-mail','email address']], ['company','Company',1,['company','account','company name','account name','organization']],
    ['partner','Partner',1,['partner','partner name','assigned partner','reseller','channel partner']],
    ['title','Title',2,['title','job title','role']], ['status','Status',2,['status','lead status','stage']], ['rating','Rating',2,['rating','lead rating','priority','temperature']],
    ['phone','Phone',0,['phone','phone number','mobile','mobile phone']], ['source','Source',0,['source','lead source','original source']], ['owner','Owner',0,['owner','lead owner','contact owner']], ['crmId','CRM ID',0,['lead id','contact id','record id','id','crm id']], ['notes','Notes',0,['notes','description','comments']]],
  opps:[
    ['account','Account',1,['account','account name','company','company name']], ['name','Opportunity name',2,['opportunity name','opportunity','deal name','name']],
    ['amount','Amount',1,['amount','deal amount','value','opportunity amount','total']], ['stage','Stage',1,['stage','deal stage','opportunity stage']],
    ['closeDate','Close date',1,['close date','expected close date','closedate','close']], ['partner','Partner',1,['partner','partner name','partner account','reseller','channel partner']],
    ['product','Product',2,['product','product name','solution']], ['created','Created date',0,['created date','create date','created']], ['nextStep','Next step',0,['next step','next steps']], ['crmId','CRM ID',0,['opportunity id','deal id','record id','id','crm id']]]
};
const LI_LABEL = {accounts:'Accounts', leads:'Leads', opps:'Opportunities'};
const LI_SAMPLE = {
  accounts:'Account name,Partner,Your status,Partner’s status,Website domain,Who leads,Partner owner,Industry,City,State\nRiverbend Health,Bluebonnet IT Solutions,Prospect,Customer,riverbendhealth.example,Partner-led,Lauren Mosley,Healthcare,Austin,TX\n',
  leads:'First name,Last name,Email,Company,Partner,Title,Status,Rating,Source\nDana,Ortiz,dana.ortiz@riverbendhealth.example,Riverbend Health,Bluebonnet IT Solutions,IT Director,New,Hot,Webinar\n',
  opps:'Account,Opportunity name,Amount,Stage,Close date,Partner,Product\nRiverbend Health,Riverbend Health — Backup,85000,Qualification,2026-12-15,Bluebonnet IT Solutions,Backup and Recovery\n'
};
const normVst = s => { s = String(s || '').toLowerCase(); if (!s) return ''; if (/customer|client|closed.?won|active|current|evangelist/.test(s)) return 'customer'; if (/opp|pipeline|open|negotiat|proposal|qualif|sql/.test(s)) return 'opportunity'; if (/prospect|target|lead|mql|subscriber|marketing/.test(s)) return 'prospect'; if (/none|no|not|whitespace/.test(s)) return 'none'; return ''; };
const normMotion = s => { s = String(s || '').toLowerCase(); return /co.?sell|joint/.test(s) ? 'cosell' : /partner/.test(s) ? 'partner' : /vendor|direct|us\b|we\b/.test(s) ? 'vendor' : /referr/.test(s) ? 'referral' : ''; };
const normStage = s => { s = String(s || '').toLowerCase().replace(/[^a-z]/g, ''); if (/closedwon|won/.test(s)) return 'won'; if (/closedlost|lost/.test(s)) return 'lost'; if (/negotiat|review|contractsent|decisionmaker/.test(s)) return 'negotiation'; if (/proposal|quote|value|presentation/.test(s)) return 'proposal'; if (/qualif|needs|appointment|discovery/.test(s)) return 'qualified'; if (/prospect|register|new|lead/.test(s)) return 'registered'; return ''; };
const normLst = s => { s = String(s || '').toLowerCase(); if (!s) return ''; if (/convert/.test(s)) return 'converted'; if (/disqual|unqual|junk|dead|lost/.test(s)) return 'disqualified'; if (/decline|reject/.test(s)) return 'declined'; if (/qualif|sql/.test(s)) return 'qualified'; if (/work|contact|progress|engag/.test(s)) return 'working'; if (/accept/.test(s)) return 'accepted'; if (/assign/.test(s)) return 'assigned'; if (/new|open|mql/.test(s)) return 'new'; return ''; };
const normRating = s => { s = String(s || '').toLowerCase(); return /hot|high|a\b/.test(s) ? 'hot' : /warm|med/.test(s) ? 'warm' : /cold|low/.test(s) ? 'cold' : ''; };
const parseAmt = s => { const n = Number(String(s || '').replace(/[^0-9.\-]/g, '')); return isNaN(n) ? NaN : n; };
function parseDateL(s) { s = String(s || '').trim(); if (!s) return ''; let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`; m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/); if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`; } const d = new Date(s); return isNaN(d) ? '' : d.toISOString().slice(0, 10); }
const LI = () => S.li || (S.li = {type:'accounts', rows:[], headers:[], map:{}, hasHeader:true, dup:'update', defPartner:'', paste:'', fileName:'', result:null, running:false, done:0});
function liLoad(text, fileName) {
  const M = LI(), all = parseCSV(text); M.raw = text; M.fileName = fileName || ''; M.result = null;
  if (!all.length) { M.rows = []; M.headers = []; return; }
  M.headers = M.hasHeader ? all[0] : all[0].map((_, i) => 'Column ' + (i + 1)); M.rows = M.hasHeader ? all.slice(1) : all;
  M.map = {}; LI_FIELDS[M.type].forEach(([f, , , keys]) => { const i = M.headers.findIndex(h => keys.includes(normKey(h))); if (i >= 0 && !Object.values(M.map).includes(i)) M.map[f] = i; });
}
function liCheck() {
  const M = LI(), F = LI_FIELDS[M.type], g = (r, f) => M.map[f] != null && M.map[f] !== '' ? String(r[M.map[f]] ?? '').trim() : '';
  const seen = new Set();
  return M.rows.map(r => {
    const o = {r, errs:[], warns:[]};
    const pRaw = g(r, 'partner'), pid = pRaw ? matchPartner(pRaw) : M.defPartner;
    if (!pid) o.errs.push(pRaw ? `Partner “${pRaw}” not found` : 'No partner');
    o.pid = pid;
    if (M.type === 'accounts') {
      o.name = g(r, 'name'); o.domain = cleanDomain(g(r, 'domain'));
      if (!o.name) o.errs.push('No account name');
      o.vs = normVst(g(r, 'vendorStatus')); o.ps = normVst(g(r, 'partnerStatus'));
      if (!o.vs) o.warns.push('Your status missing, set to Prospect'); if (!o.ps) o.warns.push('Partner status missing, set to Prospect');
      o.ex = o.name ? acctByName(o.name, o.domain) : null; o.key = o.domain || normCo(o.name);
    } else if (M.type === 'leads') {
      o.name = g(r, 'name') || [g(r, 'first'), g(r, 'last')].filter(Boolean).join(' '); o.email = g(r, 'email').toLowerCase(); o.company = g(r, 'company');
      if (!o.name) o.errs.push('No name'); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)) o.errs.push(o.email ? 'Email looks wrong' : 'No email'); if (!o.company) o.errs.push('No company');
      o.ex = o.email ? vals(S._full?.leads || S.leads).find(l => (l.email || '').toLowerCase() === o.email) : null; o.key = o.email;
      o.acct = o.company ? acctByName(o.company, o.email.split('@')[1]) : null; if (o.company && !o.acct) o.warns.push('New account will be created');
    } else {
      o.account = g(r, 'account'); o.amount = parseAmt(g(r, 'amount')); o.stage = normStage(g(r, 'stage')); o.close = parseDateL(g(r, 'closeDate')); o.name = g(r, 'name') || (o.account ? o.account + ' — ' + (g(r, 'product') || 'opportunity') : '');
      if (!o.account) o.errs.push('No account'); if (isNaN(o.amount) || g(r, 'amount') === '') o.errs.push('Amount missing'); if (!o.stage) o.errs.push(g(r, 'stage') ? `Stage “${g(r, 'stage')}” not recognized` : 'No stage'); if (!o.close) o.errs.push('Close date missing');
      const crm = g(r, 'crmId'); o.ex = crm ? vals(S._full?.deals || S.deals).find(d => d.crmId === crm) : vals(S._full?.deals || S.deals).find(d => normCo(d.account) === normCo(o.account) && normCo(d.name || '') === normCo(o.name)); o.key = crm || normCo(o.account) + '|' + normCo(o.name);
      o.acct = o.account ? acctByName(o.account) : null; if (o.account && !o.acct) o.warns.push('New account will be created');
    }
    if (o.key && seen.has(o.key)) o.errs.push('Duplicate of an earlier row'); else if (o.key) seen.add(o.key);
    o.action = o.errs.length ? 'error' : o.ex ? (M.dup === 'skip' ? 'skip' : 'update') : 'new';
    o.get = f => g(r, f);
    return o;
  });
}
function vLeadImport() {
  const M = LI(), F = LI_FIELDS[M.type], chk = M.rows.length ? liCheck() : [];
  const req = F.filter(f => f[2] === 1), rec = F.filter(f => f[2] === 2);
  const missing = req.filter(([f]) => M.map[f] == null || M.map[f] === '').filter(([f]) => !(f === 'partner' && M.defPartner) && !(M.type === 'leads' && ((f === 'name' && M.map.first != null && M.map.first !== '') || (f === 'first' && M.map.name != null && M.map.name !== ''))));
  const n = k => chk.filter(o => o.action === k).length;
  return `${leadsHead('leads-import', 'Bring in accounts, leads or opportunities from a CSV or a spreadsheet paste, including Salesforce and HubSpot exports.')}
  <div class="grid-main" style="margin-top:16px">
    <div class="stack">
      <section class="panel"><div class="panel-h"><h2>1. What are you importing?</h2></div><div class="panel-b stack" style="gap:12px">
        <div class="seg" role="group" aria-label="Import type">${Object.entries(LI_LABEL).map(([k, l]) => `<button data-act="litype" data-val="${k}" aria-pressed="${M.type === k}">${l}</button>`).join('')}</div>
        <div class="lireq"><div><span class="eyebrow">Required</span><ul>${req.map(f => `<li>${esc(f[1])}${f[0] === 'partner' ? ' <span class="small muted">(or pick a default below)</span>' : f[0] === 'name' && M.type === 'leads' ? ' <span class="small muted">(or first name)</span>' : ''}</li>`).join('')}</ul></div>
          <div><span class="eyebrow">Needed to co-manage the account</span><ul>${rec.map(f => `<li>${esc(f[1])}</li>`).join('')}</ul></div>
          <div><span class="eyebrow">Optional</span><p class="small muted">${F.filter(f => !f[2]).map(f => f[1]).join(', ')}</p></div></div>
        <div class="row"><button class="btn sm" data-act="litemplate">${S.dl ? 'Download template' : 'Copy template header'}</button><span class="small muted">Salesforce and HubSpot export column names are recognized automatically.</span></div></div></section>
      <section class="panel"><div class="panel-h"><h2>2. Add the file</h2>${M.fileName ? `<span class="small muted">${esc(M.fileName)} · ${plural(M.rows.length, 'row')}</span>` : ''}</div><div class="panel-b stack" style="gap:10px">
        <div class="row"><label class="btn" for="liFile">Choose CSV file</label><input type="file" id="liFile" accept=".csv,.tsv,.txt,text/csv" class="vh"><label class="check"><input type="checkbox" id="liHeader" ${M.hasHeader ? 'checked' : ''}> First row is headings</label></div>
        <label class="small muted" for="liPaste">Or paste rows from a spreadsheet</label><textarea class="inp mono" id="liPaste" rows="4" placeholder="${esc(LI_SAMPLE[M.type].split('\n')[0])}">${esc(M.paste)}</textarea>
        <div class="row"><button class="btn sm" data-act="liparse">Read pasted rows</button><button class="btn sm ghost" data-act="lisample">Try a sample row</button></div></div></section>
      ${M.rows.length ? `<section class="panel"><div class="panel-h"><h2>3. Match the columns</h2>${missing.length ? `<span class="pill bad">Missing: ${missing.map(f => esc(f[1])).join(', ')}</span>` : '<span class="pill ok">Required columns matched</span>'}</div><div class="panel-b"><div class="impmap">${F.map(([f, l, rq]) => `<div class="field"><label for="lim-${f}">${esc(l)}${rq === 1 ? ' <span style="color:var(--bad)">*</span>' : ''}</label><select class="inp" id="lim-${f}" data-limap="${f}"><option value="">Not in file</option>${M.headers.map((h, i) => `<option value="${i}" ${M.map[f] === i ? 'selected' : ''}>${esc(h || 'Column ' + (i + 1))}</option>`).join('')}</select></div>`).join('')}</div>
        <div class="fgrid" style="margin-top:12px;grid-template-columns:repeat(2,minmax(0,1fr))"><div class="field"><label for="liDef">Partner for rows without one</label><select class="inp" id="liDef" data-liset="defPartner">${partnerOpts(M.defPartner, 'None (rows need a partner)')}</select></div>
          <div class="field"><label for="liDup">When a record already exists</label><select class="inp" id="liDup" data-liset="dup"><option value="update" ${M.dup === 'update' ? 'selected' : ''}>Update it with the file’s values</option><option value="skip" ${M.dup === 'skip' ? 'selected' : ''}>Skip it</option></select></div></div></div></section>` : ''}
    </div>
    <div class="stack">
      ${M.rows.length ? `<section class="panel"><div class="panel-h"><h2>4. Check and import</h2></div><div class="panel-b stack" style="gap:10px">
        <div class="row small"><span class="pill ok">${n('new')} new</span><span class="pill pipe">${n('update')} update</span><span class="pill">${n('skip')} skip</span><span class="pill bad">${n('error')} can’t import</span></div>
        <div class="tw" style="max-height:420px;overflow:auto"><table class="small"><thead><tr><th>#</th><th>Record</th><th>Result</th></tr></thead><tbody>${chk.slice(0, 200).map((o, i) => `<tr><td class="num">${i + 1}</td><td>${esc(o.name || o.account || '—')}<span class="sub">${esc(o.pid ? pName(o.pid) : '')}</span></td><td>${o.action === 'error' ? `<span style="color:var(--bad)">${esc(o.errs.join('; '))}</span>` : `<b>${o.action === 'new' ? 'New' : o.action === 'update' ? 'Update' : 'Skip'}</b>${o.warns.length ? `<span class="sub" style="color:var(--warn)">${esc(o.warns.join('; '))}</span>` : ''}`}</td></tr>`).join('')}</tbody></table></div>
        ${M.result ? `<div class="banner ok"><span><b>Imported.</b> ${M.result}</span></div>` : ''}
        <button class="btn primary" data-act="lirun" ${missing.length || !(n('new') + n('update')) || M.running || !S.canWrite ? 'disabled' : ''}>${M.running ? `Importing… ${M.done}` : `Import ${n('new') + n('update')} ${LI_LABEL[M.type].toLowerCase()}`}</button></div></section>` : `<section class="panel"><div class="panel-h"><h2>How matching works</h2></div><div class="panel-b small stack" style="gap:8px"><p><b>Accounts</b> match on website domain, then on name. Importing the same account for a second partner adds that partner to its mapping.</p><p><b>Leads</b> match on email. Their company is matched to an account, or a new one is created and mapped to the lead’s partner.</p><p><b>Opportunities</b> match on CRM ID, or on account plus name. They land in Pipeline as partner deals, and the account is created or mapped if needed.</p><p>Status words are translated: “Closed Won”, “Customer” or “Active” become Customer; “Qualification” and “Proposal/Price Quote” map to the hub’s deal stages.</p></div></section>`}
    </div>
  </div>`;
}
async function liRun() {
  const M = LI(), chk = liCheck().filter(o => o.action === 'new' || o.action === 'update'); if (!chk.length) return;
  M.running = true; M.done = 0; render();
  let made = 0, upd = 0, accMade = 0; const t = now(), touched = {};
  const ensureAcct = async (db, name, domain, pid, pst) => {
    let a = touched[normCo(name)] || acctByName(name, domain);
    if (!a) { const id = newId('ac-'); a = {id, name, domain:cleanDomain(domain), vendorStatus:'prospect', partners:{}, partnerIds:[], stage:'mapped', industry:'', city:'', state:'', motion:'', nextStep:'', nextStepDate:'', plays:[], thread:[], source:'Import', createdAt:t}; await db.doc('accounts/' + id).set({...a, id:undefined}); accMade++; }
    if (pid && !a.partners?.[pid]) { a = {...a, partners:{...(a.partners || {}), [pid]:{status:pst || 'prospect', role:'', owner:''}}}; a.partnerIds = Object.keys(a.partners); await db.doc('accounts/' + a.id).update({partners:a.partners, partnerIds:a.partnerIds, updatedAt:t}); }
    touched[normCo(name)] = a; return a;
  };
  const ok = await write(async db => {
    for (const o of chk) {
      const g = o.get;
      if (M.type === 'accounts') {
        const ex = touched[normCo(o.name)] || o.ex, pRow = {status:o.ps || 'prospect', role:'', owner:g('partnerOwner')};
        const base = {name:o.name, domain:o.domain || ex?.domain || '', industry:g('industry') || ex?.industry || '', city:g('city') || ex?.city || '', state:(g('state') || ex?.state || '').toUpperCase().slice(0, 2), employees:numOr(g('employees'), ex?.employees || 0), vendorOwner:g('owner') || ex?.vendorOwner || '', updatedAt:t};
        if (ex) {
          const partners = {...(ex.partners || {}), [o.pid]:{...(ex.partners?.[o.pid] || {}), ...pRow, owner:pRow.owner || ex.partners?.[o.pid]?.owner || ''}};
          await db.doc('accounts/' + ex.id).update({...base, partners, partnerIds:Object.keys(partners), ...(o.vs ? {vendorStatus:o.vs} : {}), ...(normMotion(g('motion')) ? {motion:normMotion(g('motion'))} : {}), ...(g('nextStep') ? {nextStep:g('nextStep')} : {}), ...(g('crmId') ? {crmId:g('crmId')} : {}), ...(g('notes') ? {notes:g('notes')} : {})});
          touched[normCo(o.name)] = {...ex, partners}; upd++;
        } else {
          const id = newId('ac-'), partners = {[o.pid]:pRow};
          await db.doc('accounts/' + id).set({...base, vendorStatus:o.vs || 'prospect', partners, partnerIds:[o.pid], stage:'mapped', motion:normMotion(g('motion')), nextStep:g('nextStep'), nextStepDate:'', crmId:g('crmId'), notes:g('notes'), plays:[], thread:[], source:'Import', createdAt:t});
          touched[normCo(o.name)] = {id, ...base, partners}; made++;
        }
      } else if (M.type === 'leads') {
        const a = await ensureAcct(db, o.company, o.email.split('@')[1], o.pid, 'prospect');
        const st = normLst(g('status')), first = g('first') || o.name.split(' ')[0], last = g('last') || o.name.split(' ').slice(1).join(' ');
        const doc = {first, last, name:o.name, email:o.email, title:g('title'), phone:g('phone'), company:a.name, accountId:a.id, partnerId:o.pid, rating:normRating(g('rating')), source:g('source') || 'Import', owner:/partner/i.test(g('owner')) ? 'partner' : 'vendor', crmId:g('crmId'), notes:g('notes'), updatedAt:t};
        if (o.ex) { await db.doc('leads/' + o.ex.id).update({...doc, ...(st ? {status:st} : {})}); upd++; }
        else { await db.doc('leads/' + newId('ld-')).set({...doc, status:st || 'assigned', assignedAt:t, nextStep:'', nextStepDate:'', createdAt:t, history:[{action:'Imported' + (M.fileName ? ' from ' + M.fileName : ''), at:t, by:meName()}]}); made++; }
      } else {
        const a = await ensureAcct(db, o.account, '', o.pid, 'opportunity');
        const doc = {name:o.name, account:a.name, accountId:a.id, partnerId:o.pid, product:g('product'), stage:o.stage, amount:o.amount, closeDate:o.close, nextStep:g('nextStep'), crmId:g('crmId'), source:'import', updatedAt:t};
        if (o.ex) { const did = o.ex.id; await db.doc('deals/' + did).update(doc); upd++; }
        else { await db.doc('deals/' + newId('DL')).set({...doc, contactId:'', createdAt:parseDateL(g('created')) || today()}); made++; }
        if (a.vendorStatus !== 'customer' && OPEN.has(o.stage)) await db.doc('accounts/' + a.id).update({vendorStatus:'opportunity'});
      }
      M.done++; if (M.done % 10 === 0) render();
    }
  }, null);
  M.running = false;
  if (ok) { M.result = `${made} added, ${upd} updated${accMade ? `, ${accMade} new accounts created` : ''}.`; toast(`Imported ${made + upd} ${LI_LABEL[M.type].toLowerCase()}`); }
  render();
}

/* ----- CRM connections ----- */
const CRM_CODES = {
  server_not_connected:s => `${s} isn’t connected to your claude.ai account. Add it in claude.ai Settings → Connectors, then reload this page.`,
  needs_reauth:s => `${s} needs to be reconnected. Reconnect it in claude.ai Settings → Connectors.`,
  not_in_manifest:s => `${s} access is turned off for this page. Turn it back on from the page’s Permissions menu.`,
  approval_required:s => `${s} needs your approval for this. Try again and choose Allow when claude.ai asks.`,
  blocked_by_policy:s => `Your organization’s policy blocks this ${s} action.`,
  selection_required:s => `You have more than one ${s} connection. Choose one when claude.ai asks, then try again.`,
  server_unavailable:s => `${s} didn’t answer. Wait a moment and try again.`,
  tool_error:(s, e) => `${s} reported a problem: ${String(e?.message || '').slice(0, 200)}`
};
const crmMsg = (e, s) => (CRM_CODES[e?.code] || ((x) => `${x} couldn’t finish this (${e?.code || 'error'}). Try again.`))(s, e);
const CRM = () => S.crm || (S.crm = {log:[], apollo:{q:'', rows:null, sel:new Set(), pid:'', busy:false, err:'', kind:'contacts'}, notion:{busy:'', err:'', pull:null}});
const NCFG = () => S.settings.crm?.notion || null;
function crmPushBtns(kind, id) {
  if (!S.mcp) return '';
  const r = kind === 'account' ? AC(id) : LD(id), busyN = S.busy['n:' + id], busyA = S.busy['a:' + id];
  return `${NCFG() ? `<button class="btn sm" data-act="npushone" data-kind="${kind}" data-id="${esc(id)}" ${busyN ? 'disabled' : ''} title="${r?.crm?.notion ? 'Update the Notion row' : 'Add a Notion row'}">${busyN ? 'Sending…' : r?.crm?.notion ? 'Update in Notion' : 'Send to Notion'}</button>` : ''}${r?.crm?.apollo ? '<span class="pill ok" title="Already in Apollo">In Apollo</span>' : `<button class="btn sm ${S.armed === 'ap-' + id ? 'armed' : ''}" data-act="apush" data-kind="${kind}" data-id="${esc(id)}" ${busyA ? 'disabled' : ''}>${busyA ? 'Sending…' : S.armed === 'ap-' + id ? 'Confirm: add to Apollo' : 'Send to Apollo'}</button>`}`;
}
function vLeadCrm() {
  const C = CRM(), ap = C.apollo, nt = C.notion, cfg = NCFG(), log = S.settings.crm?.log || [];
  const avail = S.mcp ? '' : `<div class="banner warn"><span><b>Live connections aren’t available in this view.</b> Open the hub on claude.ai while signed in. Importing a CSV still works.</span></div>`;
  const st = s => S.mcpStatus?.[s];
  const stPillC = s => st(s) === 'connected' ? '<span class="pill ok">Connected</span>' : st(s) === 'needs_reauth' ? '<span class="pill bad">Reconnect needed</span>' : st(s) === 'missing' ? '<span class="pill bad">Not connected</span>' : '<span class="pill">Asks on first use</span>';
  const changed = k => vals(k === 'accounts' ? S.accounts : k === 'leads' ? S.leads : S.deals).filter(r => !r.crm?.notion || (r.updatedAt && r.crm?.notionAt && r.updatedAt > r.crm.notionAt)).length;
  return `${leadsHead('leads-crm', 'Pull records from your CRM tools into the hub, and push the hub’s accounts, leads and opportunities back out.')}
  ${avail}
  <div class="crmgrid" style="margin-top:16px">
    <section class="panel crmcard"><div class="panel-h"><h2>Notion</h2>${stPillC('Notion')}</div><div class="panel-b stack" style="gap:12px">
      <p class="small">Three Notion databases mirror the hub: <b>Accounts</b>, <b>Leads</b> and <b>Opportunities</b>. Each row carries a Hub ID so the two stay matched. Edit in either place, then push or pull.</p>
      ${cfg ? `<p class="small"><a class="ext" href="${esc(cfg.page)}" target="_blank" rel="noopener">Open the Notion CRM page ${extIcon}</a></p>
      <div class="tw"><table class="small"><thead><tr><th>Database</th><th class="r">To push</th><th></th></tr></thead><tbody>${[['accounts','Accounts'],['leads','Leads'],['opps','Opportunities']].map(([k, l]) => `<tr><td>${l}</td><td class="r num">${changed(k)}</td><td class="r"><button class="btn sm" data-act="npush" data-k="${k}" ${!S.mcp || nt.busy || !changed(k) ? 'disabled' : ''}>${nt.busy === 'push:' + k ? 'Pushing…' : 'Push'}</button> <button class="btn sm" data-act="npull" data-k="${k}" ${!S.mcp || nt.busy ? 'disabled' : ''}>${nt.busy === 'pull:' + k ? 'Reading…' : 'Pull'}</button></td></tr>`).join('')}</tbody></table></div>
      <p class="small muted">“To push” counts records that are new or changed since their last push. Pull shows what changed in Notion before anything is saved.</p>` : '<p class="small muted">The Notion databases haven’t been set up for this hub yet. Ask Claude in this project to set up Notion sync.</p>'}
      ${nt.err ? `<div class="banner bad"><span>${esc(nt.err)}</span></div>` : ''}
      ${nt.pull ? notionPullPreview(nt.pull) : ''}
    </div></section>
    <section class="panel crmcard"><div class="panel-h"><h2>Apollo.io</h2>${stPillC('Apollo.io')}</div><div class="panel-b stack" style="gap:12px">
      <p class="small">Pull contacts saved in Apollo in as leads, or their deals in as opportunities. Send any hub lead or account to Apollo from its page. Nothing here spends Apollo credits.</p>
      <div class="seg" role="group" aria-label="Apollo records">${[['contacts','Contacts → leads'],['deals','Deals → opportunities']].map(([k, l]) => `<button data-act="apkind" data-val="${k}" aria-pressed="${ap.kind === k}">${l}</button>`).join('')}</div>
      <div class="row" style="align-items:flex-end"><div class="field" style="flex:1"><label for="apQ">Keywords (optional)</label><input class="inp" id="apQ" value="${esc(ap.q)}" placeholder="${ap.kind === 'contacts' ? 'Name, title, company or email' : 'Deal name'}"></div><button class="btn" data-act="apfetch" ${!S.mcp || ap.busy ? 'disabled' : ''}>${ap.busy ? 'Fetching…' : 'Fetch from Apollo'}</button></div>
      ${ap.err ? `<div class="banner bad"><span>${esc(ap.err)}</span></div>` : ''}
      ${ap.rows ? apolloPreview(ap) : ''}
    </div></section>
    <section class="panel crmcard"><div class="panel-h"><h2>Salesforce</h2><span class="pill">Not connected</span></div><div class="panel-b stack" style="gap:10px">
      <p class="small">Salesforce isn’t connected to your claude.ai account yet. Until it is, export Accounts, Leads or Opportunities as CSV and bring them in with <a href="#leads-import">Import</a>. Salesforce’s standard column names are recognized.</p>
      <p class="small muted">To sync live: add the Salesforce connector in claude.ai Settings → Connectors, then ask Claude in this project to switch on Salesforce sync for the hub.</p></div></section>
    <section class="panel crmcard"><div class="panel-h"><h2>HubSpot</h2><span class="pill">Not connected</span></div><div class="panel-b stack" style="gap:10px">
      <p class="small">HubSpot isn’t connected yet. Export Companies, Contacts or Deals as CSV and use <a href="#leads-import">Import</a>; HubSpot’s column names and deal stages are recognized.</p>
      <p class="small muted">To sync live: add the HubSpot connector in claude.ai Settings → Connectors, then ask Claude to switch on HubSpot sync.</p></div></section>
  </div>
  <section class="panel" style="margin-top:16px"><div class="panel-h"><h2>Sync history</h2></div><div class="list">${log.slice().reverse().slice(0, 12).map(x => `<div class="li"><span class="kind tool">${esc(x.tool.replace('.io', ''))}</span><span class="t">${esc(x.what)}</span><span class="d">${fdate(String(x.at).slice(0, 10))}${x.by ? ' · ' + esc(x.by) : ''}</span></div>`).join('') || '<div class="empty">Nothing synced yet.</div>'}</div></section>`;
}
async function crmLog(tool, what) { const log = [...(S.settings.crm?.log || []), {tool, what, at:now(), by:meName()}].slice(-40); await write(db => db.doc('settings/crm').set({...(S.settings.crm || {}), log})); }

/* Apollo */
function apolloPreview(ap) {
  const rows = ap.rows;
  if (!rows.length) return '<div class="empty">Apollo returned nothing for that search.</div>';
  const known = r => ap.kind === 'contacts' ? vals(S.leads).some(l => (l.email || '').toLowerCase() === (r.email || '').toLowerCase()) : vals(S.deals).some(d => d.crm?.apollo === r.id);
  return `<div class="tw" style="max-height:340px;overflow:auto"><table class="small"><thead><tr><th><input type="checkbox" data-act="apall" aria-label="Select all" ${rows.every(r => ap.sel.has(r.id) || known(r)) ? 'checked' : ''}></th><th>${ap.kind === 'contacts' ? 'Contact' : 'Deal'}</th><th>${ap.kind === 'contacts' ? 'Company' : 'Amount'}</th></tr></thead><tbody>
    ${rows.map(r => `<tr class="${known(r) ? 'muted' : ''}"><td><input type="checkbox" data-apsel="${esc(r.id)}" ${ap.sel.has(r.id) ? 'checked' : ''} ${known(r) ? 'disabled' : ''} aria-label="Select ${esc(r.name)}"></td><td>${esc(r.name)}<span class="sub">${esc(ap.kind === 'contacts' ? (r.title || '') + (r.email ? ' · ' + r.email : '') : (r.stage || ''))}${known(r) ? ' · already in the hub' : ''}</span></td><td>${ap.kind === 'contacts' ? esc(r.company || '—') : money(r.amount)}${ap.kind === 'deals' ? `<span class="sub">${esc(r.account || '')}</span>` : ''}</td></tr>`).join('')}</tbody></table></div>
    <div class="row" style="align-items:flex-end"><div class="field" style="flex:1"><label for="apPid">Partner for these</label><select class="inp" id="apPid">${partnerOpts(ap.pid || S.focus || '', ap.kind === 'contacts' ? 'Unassigned' : 'Choose a partner')}</select></div><button class="btn primary" data-act="apimport" ${ap.sel.size && S.canWrite ? '' : 'disabled'}>Import ${ap.sel.size} as ${ap.kind === 'contacts' ? 'leads' : 'opportunities'}</button></div>
    ${ap.more ? '<p class="small muted">Showing the first 50. Add keywords to narrow it down.</p>' : ''}`;
}
async function apFetch() {
  const ap = CRM().apollo; ap.q = $('#apQ')?.value.trim() || ''; ap.busy = true; ap.err = ''; render();
  try {
    if (ap.kind === 'contacts') {
      const res = await S.mcp.callTool('Apollo.io', 'apollo_contacts_search', {per_page:50, page:1, ...(ap.q ? {q_keywords:ap.q} : {}), sort_by_field:'contact_updated_at'}, {cache:false});
      const p = res.payload || {};
      ap.rows = (p.contacts || []).map(c => ({id:c.id, name:c.name || [c.first_name, c.last_name].filter(Boolean).join(' '), first:c.first_name || '', last:c.last_name || '', title:c.title || '', email:c.email || '', company:c.organization_name || c.account?.name || '', domain:c.account?.domain || c.account?.primary_domain || c.organization?.primary_domain || '', city:c.account?.city || c.city || '', state:c.account?.state || c.state || '', accountId:c.account_id || '', phone:c.phone_numbers?.[0]?.raw_number || ''}));
      ap.more = (p.pagination?.total_pages || 1) > 1;
    } else {
      const res = await S.mcp.callTool('Apollo.io', 'apollo_deals_search', {per_page:50, page:1, ...(ap.q ? {q_keywords:ap.q} : {})}, {cache:false});
      const p = res.payload || {};
      ap.rows = (p.opportunities || []).map(o => ({id:o.id, name:o.name || 'Untitled deal', amount:Number(o.amount) || 0, close:String(o.closed_date || o.close_date || '').slice(0, 10), stage:o.stage_name || o.opportunity_stage?.name || '', account:o.account?.name || o.account_name || '', accountId:o.account_id || ''}));
      ap.more = (p.pagination?.total_pages || 1) > 1;
    }
    ap.sel = new Set();
  } catch (e) { ap.err = crmMsg(e, 'Apollo.io'); ap.rows = null; if (e?.code === 'server_not_connected') S.mcpStatus = {...(S.mcpStatus || {}), 'Apollo.io':'missing'}; }
  ap.busy = false; render();
}
async function apImport() {
  const ap = CRM().apollo, pid = $('#apPid')?.value || '', rows = ap.rows.filter(r => ap.sel.has(r.id)); if (!rows.length) return;
  if (ap.kind === 'deals' && !pid) { toast('Choose the partner these opportunities belong to.'); return; }
  const t = now(); let n = 0;
  const ok = await write(async db => {
    const made = {};
    const acctFor = async (name, domain, pst) => {
      if (!name) return null;
      let a = made[normCo(name)] || acctByName(name, domain);
      if (!a) { const id = newId('ac-'); a = {id, name, domain:cleanDomain(domain), partners:pid ? {[pid]:{status:pst, role:'', owner:''}} : {}, vendorStatus:'prospect'}; await db.doc('accounts/' + id).set({name, domain:a.domain, industry:'', city:'', state:'', vendorStatus:'prospect', partners:a.partners, partnerIds:Object.keys(a.partners), stage:pid ? 'mapped' : 'identified', motion:'', nextStep:'', nextStepDate:'', plays:[], thread:[], source:'Apollo.io', createdAt:t}); }
      else if (pid && !a.partners?.[pid]) { a = {...a, partners:{...(a.partners || {}), [pid]:{status:pst, role:'', owner:''}}}; await db.doc('accounts/' + a.id).update({partners:a.partners, partnerIds:Object.keys(a.partners)}); }
      made[normCo(name)] = a; return a;
    };
    for (const r of rows) {
      if (ap.kind === 'contacts') {
        const a = await acctFor(r.company, r.domain, 'prospect');
        await db.doc('leads/' + newId('ld-')).set({first:r.first, last:r.last, name:r.name, title:r.title, email:(r.email || '').toLowerCase(), phone:r.phone, company:a?.name || r.company, accountId:a?.id || '', partnerId:pid, status:pid ? 'assigned' : 'new', assignedAt:pid ? t : '', rating:'', owner:'vendor', source:'Apollo.io', notes:'', nextStep:'', nextStepDate:'', crm:{apollo:r.id}, createdAt:t, history:[{action:'Pulled from Apollo.io', at:t, by:meName()}]});
      } else {
        const a = await acctFor(r.account, '', 'opportunity');
        await db.doc('deals/' + newId('DL')).set({name:r.name, account:a?.name || r.account, accountId:a?.id || '', partnerId:pid, contactId:'', product:'', stage:normStage(r.stage) || 'registered', amount:r.amount, createdAt:today(), closeDate:r.close || addDays(today(), 90), nextStep:'', source:'apollo', crm:{apollo:r.id}});
      }
      n++;
    }
  }, null);
  if (ok) { toast(`Imported ${n} from Apollo.io`); await crmLog('Apollo.io', `Pulled ${plural(n, ap.kind === 'contacts' ? 'contact' : 'deal')} into the hub`); ap.sel = new Set(); render(); }
}
async function apPush(kind, id) {
  if (S.armed !== 'ap-' + id) { S.armed = 'ap-' + id; render(); setTimeout(() => { if (S.armed === 'ap-' + id) { S.armed = null; render(); } }, 5000); return; }
  S.armed = null; S.busy['a:' + id] = true; render();
  try {
    if (kind === 'lead') {
      const l = LD(id), a = AC(l.accountId);
      const res = await S.mcp.callTool('Apollo.io', 'apollo_contacts_create', {first_name:l.first || l.name.split(' ')[0], last_name:l.last || l.name.split(' ').slice(1).join(' '), email:l.email, ...(l.title ? {title:l.title} : {}), organization_name:a?.name || l.company, ...(a?.domain ? {website_url:'https://' + a.domain} : {}), ...(l.phone ? {direct_phone:l.phone} : {})});
      const cid = res.payload?.contact?.id || res.payload?.id || 'yes';
      await write(db => db.doc('leads/' + id).update({crm:{...(l.crm || {}), apollo:cid}, history:lhist(l, 'Sent to Apollo.io')}), 'Added to Apollo as a contact');
      await crmLog('Apollo.io', `Sent lead ${l.name}`);
    } else {
      const a = AC(id);
      const res = await S.mcp.callTool('Apollo.io', 'apollo_accounts_create', {name:a.name, ...(a.domain ? {domain:a.domain} : {}), ...([a.city, a.state].some(Boolean) ? {raw_address:[a.city, a.state].filter(Boolean).join(', ')} : {})});
      const aid = res.payload?.account?.id || res.payload?.id || 'yes';
      await write(db => db.doc('accounts/' + id).update({crm:{...(a.crm || {}), apollo:aid}}), 'Added to Apollo as an account');
      await crmLog('Apollo.io', `Sent account ${a.name}`);
    }
  } catch (e) { toast(crmMsg(e, 'Apollo.io')); }
  delete S.busy['a:' + id]; render();
}

/* Notion */
const N_DS = k => NCFG()?.[k] || '';
const nDate = (p, d) => d ? {[`date:${p}:start`]:d, [`date:${p}:is_datetime`]:0} : {};
function toNotion(k, r) {
  if (k === 'accounts') { const ps = pairsOf(r); return {Account:r.name, Domain:r.domain || '', Industry:r.industry || '', City:r.city || '', State:r.state || '', Employees:Number(r.employees) || 0, 'Our status':VST[r.vendorStatus || 'none'][0], Partners:ps.map(x => pName(x.pid)).join(', '), 'Partner status':ps.map(x => `${pName(x.pid)}: ${VST[x.status]?.[0]}`).join('; '), Overlap:OVL[bestOverlap(r) || 'white'][0], Stage:ASTAGE[r.stage || 'identified'][0], ...(r.motion ? {'Who leads':MOTION[r.motion]} : {}), 'Vendor owner':r.vendorOwner || '', 'Next step':r.nextStep || '', ...nDate('Next step date', r.nextStepDate), Notes:r.notes || '', 'Hub ID':r.id}; }
  if (k === 'leads') return {Lead:r.name, Title:r.title || '', Email:r.email || '', Phone:r.phone || '', Company:AC(r.accountId)?.name || r.company || '', Partner:r.partnerId ? pName(r.partnerId) : '', Status:LST[r.status]?.[0] || 'New', ...(r.rating ? {Rating:RATING[r.rating][0]} : {}), Owner:r.owner === 'partner' ? 'Partner' : 'Vendor', Source:r.source || '', 'Next step':r.nextStep || '', ...nDate('Next step date', r.nextStepDate), Notes:r.notes || '', 'Hub ID':r.id};
  return {Opportunity:r.name || r.account || 'Opportunity', Account:r.account || '', Partner:pName(r.partnerId), Product:r.product || '', Amount:Number(r.amount) || 0, Stage:STAGE[r.stage]?.label || 'Registered', ...nDate('Close date', r.closeDate), 'Next step':r.nextStep || '', 'Hub ID':r.id};
}
const NCOLL = {accounts:'accounts', leads:'leads', opps:'deals'};
async function nPush(k, onlyId) {
  const C = CRM().notion, coll = NCOLL[k], src = S[coll];
  const recs = Object.entries(src).map(([id, r]) => ({id, ...r})).filter(r => onlyId ? r.id === onlyId : (!r.crm?.notion || (r.updatedAt && r.crm?.notionAt && r.updatedAt > r.crm.notionAt)));
  if (!recs.length) return;
  if (!onlyId) C.busy = 'push:' + k; C.err = ''; render();
  let made = 0, upd = 0, failed = 0;
  try {
    const fresh = recs.filter(r => !r.crm?.notion), old = recs.filter(r => r.crm?.notion);
    for (let i = 0; i < fresh.length; i += 50) {
      const chunk = fresh.slice(i, i + 50);
      const res = await S.mcp.callTool('Notion', 'notion-create-pages', {parent:{type:'data_source_id', data_source_id:N_DS(k).replace('collection://', '')}, allow_async:false, pages:chunk.map(r => ({properties:toNotion(k, r)}))});
      const pages = res.payload?.pages || [];
      const t = now();
      await write(async db => { for (let j = 0; j < chunk.length; j++) { const pg = pages.find(p => p.properties?.['Hub ID'] === chunk[j].id) || pages[j]; if (pg?.id) { await db.doc(coll + '/' + chunk[j].id).update({crm:{...(chunk[j].crm || {}), notion:pg.id, notionAt:t}}); made++; } else failed++; } });
    }
    for (const r of old) {
      try { await S.mcp.callTool('Notion', 'notion-update-page', {page_id:r.crm.notion, command:'update_properties', properties:toNotion(k, r), allow_async:false}); await write(db => db.doc(coll + '/' + r.id).update({crm:{...r.crm, notionAt:now()}})); upd++; }
      catch (e) { if (e?.code === 'tool_error') failed++; else throw e; }
    }
    toast(`Notion: ${made} added, ${upd} updated${failed ? `, ${failed} failed` : ''}`);
    await crmLog('Notion', `Pushed ${LI_LABEL[k].toLowerCase()}: ${made} added, ${upd} updated${failed ? `, ${failed} failed` : ''}`);
  } catch (e) { C.err = crmMsg(e, 'Notion'); if (onlyId) toast(C.err); if (e?.code === 'server_not_connected') S.mcpStatus = {...(S.mcpStatus || {}), Notion:'missing'}; }
  C.busy = ''; render();
}
function fromNotion(k, row) {
  const d = (p) => row[`date:${p}:start`] || '';
  const vk = lbl => VST_KEYS.find(x => VST[x][0] === lbl);
  if (k === 'accounts') return {name:row.Account || '', domain:cleanDomain(row.Domain), industry:row.Industry || '', city:row.City || '', state:row.State || '', employees:Number(row.Employees) || 0, ...(vk(row['Our status']) ? {vendorStatus:vk(row['Our status'])} : {}), ...(Object.keys(ASTAGE).find(x => ASTAGE[x][0] === row.Stage) ? {stage:Object.keys(ASTAGE).find(x => ASTAGE[x][0] === row.Stage)} : {}), ...(Object.keys(MOTION).find(x => MOTION[x] === row['Who leads']) ? {motion:Object.keys(MOTION).find(x => MOTION[x] === row['Who leads'])} : {}), vendorOwner:row['Vendor owner'] || '', nextStep:row['Next step'] || '', nextStepDate:d('Next step date'), notes:row.Notes || ''};
  if (k === 'leads') { const st = Object.keys(LST).find(x => LST[x][0] === row.Status); const rt = Object.keys(RATING).find(x => RATING[x][0] === row.Rating); return {name:row.Lead || '', title:row.Title || '', email:(row.Email || '').toLowerCase(), phone:row.Phone || '', company:row.Company || '', ...(matchPartner(row.Partner) ? {partnerId:matchPartner(row.Partner)} : {}), ...(st ? {status:st} : {}), ...(rt ? {rating:rt} : {}), owner:row.Owner === 'Partner' ? 'partner' : 'vendor', source:row.Source || '', nextStep:row['Next step'] || '', nextStepDate:d('Next step date'), notes:row.Notes || ''}; }
  const sk = STAGES.find(s => s[1] === row.Stage)?.[0]; return {name:row.Opportunity || '', account:row.Account || '', ...(matchPartner(row.Partner) ? {partnerId:matchPartner(row.Partner)} : {}), product:row.Product || '', amount:Number(row.Amount) || 0, ...(sk ? {stage:sk} : {}), closeDate:d('Close date'), nextStep:row['Next step'] || ''};
}
async function nPull(k) {
  const C = CRM().notion; C.busy = 'pull:' + k; C.err = ''; C.pull = null; render();
  try {
    const res = await S.mcp.callTool('Notion', 'notion-query-data-sources', {data:{mode:'rows', data_source_url:N_DS(k), limit:100}}, {cache:false});
    const rows = res.payload?.results || [], coll = NCOLL[k], src = S[coll], items = [];
    for (const row of rows) {
      const hid = row['Hub ID'], cur = hid && src[hid] ? {id:hid, ...src[hid]} : null, nv = fromNotion(k, row), pageId = String(row.url || '').split('/').pop().split('?')[0];
      if (cur) { const diff = Object.keys(nv).filter(f => String(nv[f] ?? '') !== String(cur[f] ?? '') && !(f === 'company' && cur.accountId)); if (diff.length) items.push({type:'update', id:hid, name:cur.name || cur.account, diff, nv, pageId}); }
      else if (!hid) { const title = nv.name; if (title) items.push({type:'new', name:title, nv, pageId}); }
    }
    C.pull = {k, items, total:rows.length, more:!!res.payload?.has_more, sel:new Set(items.map((_, i) => i))};
  } catch (e) { C.err = crmMsg(e, 'Notion'); if (e?.code === 'server_not_connected') S.mcpStatus = {...(S.mcpStatus || {}), Notion:'missing'}; }
  C.busy = ''; render();
}
function notionPullPreview(P) {
  if (!P.items.length) return `<div class="banner ok"><span>Read ${plural(P.total, 'row')} from Notion ${LI_LABEL[P.k]}. Nothing is different from the hub.</span></div>`;
  return `<div class="stack" style="gap:8px"><span class="eyebrow">Changes found in Notion ${esc(LI_LABEL[P.k])}</span>
    <div class="tw" style="max-height:300px;overflow:auto"><table class="small"><tbody>${P.items.map((x, i) => `<tr><td><input type="checkbox" data-npsel="${i}" ${P.sel.has(i) ? 'checked' : ''} aria-label="Apply ${esc(x.name)}"></td><td><b>${x.type === 'new' ? 'New' : 'Update'}</b> ${esc(x.name)}<span class="sub">${x.type === 'update' ? 'Changed: ' + esc(x.diff.join(', ')) : 'Added in Notion'}</span></td></tr>`).join('')}</tbody></table></div>
    ${P.more ? '<p class="small muted">Notion returned the first 100 rows. Pull again after applying to see more.</p>' : ''}
    <div class="row"><button class="btn primary" data-act="napply" ${P.sel.size && S.canWrite ? '' : 'disabled'}>Apply ${P.sel.size} to the hub</button><button class="btn ghost" data-act="ndismiss">Dismiss</button></div></div>`;
}
async function nApply() {
  const C = CRM().notion, P = C.pull, coll = NCOLL[P.k], t = now(); let n = 0;
  const items = P.items.filter((_, i) => P.sel.has(i));
  const ok = await write(async db => {
    for (const x of items) {
      if (x.type === 'update') { await db.doc(coll + '/' + x.id).update({...Object.fromEntries(x.diff.map(f => [f, x.nv[f]])), updatedAt:t, crm:{...(S[coll][x.id].crm || {}), notion:x.pageId, notionAt:t}}); }
      else {
        const id = newId(P.k === 'accounts' ? 'ac-' : P.k === 'leads' ? 'ld-' : 'DL');
        if (P.k === 'accounts') await db.doc('accounts/' + id).set({vendorStatus:'prospect', stage:'identified', motion:'', partners:{}, partnerIds:[], plays:[], thread:[], ...x.nv, source:'Notion', createdAt:t, updatedAt:t, crm:{notion:x.pageId, notionAt:t}});
        else if (P.k === 'leads') { const a = acctByName(x.nv.company, (x.nv.email || '').split('@')[1]); const [first, ...rest] = x.nv.name.split(' '); await db.doc('leads/' + id).set({status:x.nv.partnerId ? 'assigned' : 'new', rating:'', partnerId:'', ...x.nv, first, last:rest.join(' '), accountId:a?.id || '', company:a?.name || x.nv.company, createdAt:t, updatedAt:t, history:[{action:'Pulled from Notion', at:t, by:meName()}], crm:{notion:x.pageId, notionAt:t}}); }
        else { const a = acctByName(x.nv.account); await db.doc('deals/' + id).set({stage:'registered', partnerId:'', contactId:'', ...x.nv, accountId:a?.id || '', createdAt:today(), source:'notion', crm:{notion:x.pageId, notionAt:t}}); }
        // write the new Hub ID back so the row stays matched
        try { await S.mcp.callTool('Notion', 'notion-update-page', {page_id:x.pageId, command:'update_properties', properties:{'Hub ID':id}, allow_async:false}); } catch (e) {}
      }
      n++;
    }
  }, `Applied ${n || items.length} change${items.length === 1 ? '' : 's'} from Notion`);
  if (ok) { await crmLog('Notion', `Pulled ${LI_LABEL[P.k].toLowerCase()}: ${plural(items.length, 'change')} applied`); C.pull = null; render(); }
}

/* ----- attention items, partner panel ----- */
function leadAttention(items) {
  const t0 = today();
  const unrouted = vals(S.leads).filter(l => l.status === 'new');
  if (unrouted.length) items.push({sev:'warn', t:`${plural(unrouted.length, 'new lead')} to route`, d:'Assign each to a partner, or keep it on your side.', a:`<a class="btn sm" href="#leads-people" data-act="filter" data-key="lstatusx" data-val="new">Route</a>`});
  vals(S.leads).filter(l => l.status === 'assigned' && l.assignedAt && days(String(l.assignedAt).slice(0, 10), t0) > 3).forEach(l => items.push({sev:'warn', t:`Partner hasn’t accepted ${lRef(l.id)}`, d:`${pName(l.partnerId)} · assigned ${days(String(l.assignedAt).slice(0, 10), t0)} days ago`, a:`<a class="btn sm" href="#${esc(l.id)}">Follow up</a>`}));
  vals(S.accounts).filter(a => a.nextStepDate && a.nextStepDate < t0 && !['won','parked'].includes(a.stage)).forEach(a => items.push({sev:'info', t:`Account next step overdue: ${aRefL(a.id)}`, d:`${esc(a.nextStep || '')} · due ${fdate(a.nextStepDate)}`, a:`<a class="btn sm" href="#${esc(a.id)}">Open</a>`}));
}
function partnerAcctPanel(pid) {
  const accts = vals(S.accounts).filter(a => a.partners?.[pid]), leads = vals(S.leads).filter(l => l.partnerId === pid && LOPEN.has(l.status));
  const by = {}; accts.forEach(a => { const o = overlapOf(a.vendorStatus, a.partners[pid].status); by[o] = (by[o] || 0) + 1; });
  return `<section class="panel"><div class="panel-h"><h2>Shared accounts</h2><button class="linkbtn small" data-act="lfpartner" data-pid="${esc(pid)}">Open mapping</button></div><div class="panel-b stack" style="gap:8px">
    <p class="small"><b class="num">${accts.length}</b> mapped accounts · <b class="num">${leads.length}</b> open leads</p>
    <div class="row">${OVL_KEYS.filter(k => by[k]).map(k => `${ovlPill(k)} <span class="num small">${by[k]}</span>`).join(' ') || '<span class="small muted">No accounts mapped yet.</span>'}</div>
    ${accts.filter(a => ['intro','cosell'].includes(overlapOf(a.vendorStatus, a.partners[pid].status))).slice(0, 4).map(a => `<p class="small">${aRefL(a.id)} <span class="muted">· ${esc(OVL[overlapOf(a.vendorStatus, a.partners[pid].status)][0])}</span></p>`).join('')}</div></section>`;
}

/* ----- events ----- */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id;
  const known = ['lmall','lmcell','lmprio','acctplays','playsave','playdrop','playdel','playmail','copytext','acmtpost','aunmap','amapadd','lassign','lstep','lhandoff','lmapacct','lmkacct','litype','litemplate','liparse','lisample','lirun','apkind','apfetch','apall','apimport','apush','npush','npull','npushone','napply','ndismiss','lfpartner'];
  if (!known.includes(act)) return;
  const F = LF();
  if (act === 'lmall') { S.lmAll = !S.lmAll; render(); }
  else if (act === 'lmcell') { const k = b.dataset.v ? b.dataset.v + '|' + b.dataset.p : ''; F.cell = F.cell === k ? '' : k; render(); }
  else if (act === 'lfpartner') { F.partner = b.dataset.pid; F.cell = ''; location.hash = 'leads'; }
  else if (act === 'lmprio') aiPrio();
  else if (act === 'acctplays') aiPlays(id);
  else if (act === 'playsave') { const p = S.acctAI?.[id]?.plays?.[+b.dataset.k.slice(1)]; if (!p) return; const a = AC(id); if (await write(db => db.doc('accounts/' + id).update({plays:[...(a.plays || []), {...p, id:newId('pl-'), status:'idea', savedAt:now()}], updatedAt:now()}), 'Play saved')) { S.acctAI[id].plays = S.acctAI[id].plays.filter(x => x !== p); render(); } }
  else if (act === 'playdrop') { const ai = S.acctAI?.[id]; if (ai) { ai.plays.splice(+b.dataset.k.slice(1), 1); render(); } }
  else if (act === 'playdel') { const k = b.dataset.k; if (S.armed !== 'pdel-' + k) { S.armed = 'pdel-' + k; render(); setTimeout(() => { if (S.armed === 'pdel-' + k) { S.armed = null; render(); } }, 4000); return; } S.armed = null; await write(db => db.doc('accounts/' + id).update({plays:(AC(id).plays || []).filter(x => x.id !== k), updatedAt:now()}), 'Play removed'); }
  else if (act === 'playmail') aiPlayMail(id, b.dataset.k);
  else if (act === 'copytext') { const el = document.getElementById(b.dataset.src); if (!el) return; try { await navigator.clipboard.writeText(el.value); toast('Copied'); } catch (x) { el.select(); toast('Press Ctrl+C (or ⌘C) to copy'); } }
  else if (act === 'acmtpost') { const ta = $('#acmt'), text = ta?.value.trim(); if (!text) { ta?.focus(); return; } if (await write(db => db.doc('accounts/' + id).update({thread:[...(AC(id).thread || []), {by:meName(), at:now(), text}], updatedAt:now()}), 'Note posted')) { dclr(id + ':acmt'); const x = $('#acmt'); if (x) x.value = ''; render(); } }
  else if (act === 'aunmap') { const pid = b.dataset.pid; if (S.armed !== 'unmap-' + pid) { S.armed = 'unmap-' + pid; render(); setTimeout(() => { if (S.armed === 'unmap-' + pid) { S.armed = null; render(); } }, 4000); return; } S.armed = null; const a = AC(id), partners = {...a.partners}; delete partners[pid]; await write(db => db.doc('accounts/' + id).update({partners, partnerIds:Object.keys(partners), updatedAt:now()}), `${pName(pid)} removed from this account`); }
  else if (act === 'amapadd') { const pid = $('#amapAdd')?.value, st = $('#amapAddSt')?.value || 'prospect'; if (!pid) return; const a = AC(id), partners = {...(a.partners || {}), [pid]:{status:st, role:'', owner:''}}; await write(db => db.doc('accounts/' + id).update({partners, partnerIds:Object.keys(partners), stage:(a.stage || 'identified') === 'identified' ? 'mapped' : a.stage, updatedAt:now()}), `${pName(pid)} mapped to ${a.name}`); }
  else if (act === 'lassign') { const pid = $('#lAssign')?.value, l = LD(id); if (!pid) return; await write(async db => { await db.doc('leads/' + id).update({partnerId:pid, status:'assigned', assignedAt:now(), history:lhist(l, 'Assigned to ' + pName(pid)), updatedAt:now()}); const a = AC(l.accountId); if (a && !a.partners?.[pid]) { const partners = {...(a.partners || {}), [pid]:{status:'prospect', role:'', owner:''}}; await db.doc('accounts/' + l.accountId).update({partners, partnerIds:Object.keys(partners)}); } }, `Assigned to ${pName(pid)}`); }
  else if (act === 'lstep') { const to = b.dataset.to, l = LD(id); await write(db => db.doc('leads/' + id).update({status:to, ...(to === 'accepted' ? {acceptedAt:now()} : {}), ...(to === 'working' && l.status === 'new' ? {owner:'vendor'} : {}), history:lhist(l, LST[to][0]), updatedAt:now()}), LST[to][0]); }
  else if (act === 'lhandoff') aiHandoff(id);
  else if (act === 'lmapacct') { const l = LD(id), a = AC(l.accountId); const partners = {...(a.partners || {}), [l.partnerId]:{status:'prospect', role:'', owner:''}}; await write(db => db.doc('accounts/' + l.accountId).update({partners, partnerIds:Object.keys(partners)}), 'Partner mapped to the account'); }
  else if (act === 'lmkacct') { const l = LD(id), aid = newId('ac-'), dom = (l.email || '').split('@')[1] || ''; const partners = l.partnerId ? {[l.partnerId]:{status:'prospect', role:'', owner:''}} : {}; if (await write(async db => { await db.doc('accounts/' + aid).set({name:l.company || dom, domain:/gmail|yahoo|outlook|hotmail/.test(dom) ? '' : dom, industry:'', city:'', state:'', vendorStatus:'prospect', partners, partnerIds:Object.keys(partners), stage:l.partnerId ? 'mapped' : 'identified', motion:'', nextStep:'', nextStepDate:'', plays:[], thread:[], source:'From a lead', createdAt:now()}); await db.doc('leads/' + id).update({accountId:aid}); }, 'Account created')) location.hash = aid; }
  else if (act === 'litype') { const M = LI(); M.type = b.dataset.val; if (M.raw) liLoad(M.raw, M.fileName); render(); }
  else if (act === 'litemplate') { const M = LI(), csv = LI_SAMPLE[M.type]; if (S.dl) { try { await S.dl.save({filename:`${M.type}-import-template.csv`, data:new Blob([csv], {type:'text/csv'})}); } catch (x) {} } else { try { await navigator.clipboard.writeText(csv.split('\n')[0]); toast('Template header copied'); } catch (x) { M.paste = csv; render(); } } }
  else if (act === 'liparse') { const M = LI(); M.paste = $('#liPaste')?.value || ''; liLoad(M.paste, 'Pasted rows'); render(); }
  else if (act === 'lisample') { const M = LI(); M.paste = LI_SAMPLE[M.type]; M.hasHeader = true; liLoad(M.paste, 'Sample row'); render(); }
  else if (act === 'lirun') liRun();
  else if (act === 'apkind') { const ap = CRM().apollo; ap.kind = b.dataset.val; ap.rows = null; ap.err = ''; render(); }
  else if (act === 'apfetch') apFetch();
  else if (act === 'apall') { const ap = CRM().apollo; const free = ap.rows.filter(r => !(ap.kind === 'contacts' ? vals(S.leads).some(l => (l.email || '').toLowerCase() === (r.email || '').toLowerCase()) : vals(S.deals).some(d => d.crm?.apollo === r.id))); ap.sel = ap.sel.size === free.length ? new Set() : new Set(free.map(r => r.id)); render(); }
  else if (act === 'apimport') apImport();
  else if (act === 'apush') apPush(b.dataset.kind, id);
  else if (act === 'npush') nPush(b.dataset.k);
  else if (act === 'npushone') { S.busy['n:' + id] = true; render(); await nPush(b.dataset.kind === 'account' ? 'accounts' : 'leads', id); delete S.busy['n:' + id]; render(); }
  else if (act === 'npull') nPull(b.dataset.k);
  else if (act === 'napply') nApply();
  else if (act === 'ndismiss') { CRM().notion.pull = null; render(); }
});
document.addEventListener('input', e => {
  const el = e.target, r = route(); S.opDraft = S.opDraft || {};
  if (el.dataset?.lf === 'q' || el.dataset?.lf === 'lq') { LF()[el.dataset.lf] = el.value; clearTimeout(S._lft); S._lft = setTimeout(render, 180); }
  else if (el.dataset?.acf && el.tagName === 'INPUT' && el.type !== 'date') S.opDraft[r + ':' + el.dataset.acf] = el.value;
  else if (el.dataset?.lfld && el.type !== 'date') S.opDraft[r + ':' + el.dataset.lfld] = el.value;
  else if (el.id === 'acmt') S.opDraft[r + ':acmt'] = el.value;
  else if (el.id === 'liPaste') LI().paste = el.value;
});
document.addEventListener('change', async e => {
  const el = e.target, F = LF();
  if (el.dataset?.lf && el.dataset.lf !== 'q' && el.dataset.lf !== 'lq') { F[el.dataset.lf] = el.value; if (el.dataset.lf === 'partner') F.cell = ''; render(); }
  else if (el.dataset?.amap) { const id = route(), a = AC(id), pid = el.dataset.amap; const partners = {...a.partners, [pid]:{...a.partners[pid], [el.dataset.f]:el.value}}; await write(db => db.doc('accounts/' + id).update({partners, updatedAt:now()}), el.dataset.f === 'owner' ? null : 'Saved'); }
  else if (el.dataset?.acf) { const id = route(), f = el.dataset.acf, a = AC(id); if (a && (a[f] || '') !== el.value) { if (await write(db => db.doc('accounts/' + id).update({[f]:el.value, updatedAt:now()}), 'Saved')) dclr(id + ':' + f); } else dclr(id + ':' + f); }
  else if (el.dataset?.lfld) { const id = route(), f = el.dataset.lfld, l = LD(id); if (l && (l[f] || '') !== el.value) { if (await write(db => db.doc('leads/' + id).update({[f]:el.value, updatedAt:now()}), 'Saved')) dclr(id + ':' + f); } else dclr(id + ':' + f); }
  else if (el.dataset?.playst) { const id = el.dataset.id, a = AC(id); await write(db => db.doc('accounts/' + id).update({plays:(a.plays || []).map(p => p.id === el.dataset.playst ? {...p, status:el.value} : p), updatedAt:now()}), 'Play updated'); }
  else if (el.id === 'liFile' && el.files?.[0]) { const f = el.files[0]; if (f.size > 5e6) { toast('That file is over 5 MB. Split it and import in parts.'); return; } f.text().then(t => { liLoad(t, f.name); render(); }); }
  else if (el.id === 'liHeader') { const M = LI(); M.hasHeader = el.checked; if (M.raw) liLoad(M.raw, M.fileName); render(); }
  else if (el.dataset?.limap) { LI().map[el.dataset.limap] = el.value === '' ? '' : +el.value; render(); }
  else if (el.dataset?.liset) { LI()[el.dataset.liset] = el.value; render(); }
  else if (el.dataset?.apsel) { const s = CRM().apollo.sel; el.checked ? s.add(el.dataset.apsel) : s.delete(el.dataset.apsel); render(); }
  else if (el.dataset?.npsel != null) { const s = CRM().notion.pull.sel, i = +el.dataset.npsel; el.checked ? s.add(i) : s.delete(i); render(); }
  else if (el.id === 'apPid') CRM().apollo.pid = el.value;
});
async function initMcp() {
  try {
    const m = await window.claude.use('mcp'); S.mcp = m || null; if (!m) return schedule();
    const lt = await m.listTools().catch(() => null), st = {};
    ['Apollo.io','Notion'].forEach(s => { const sv = lt?.servers?.find(x => x.server === s); st[s] = !sv ? 'missing' : sv.authStatus === 'unknown' ? 'unknown' : sv.authStatus; });
    S.mcpStatus = st; schedule();
  } catch (e) { S.mcp = null; }
}
