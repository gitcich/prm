/* ---------- deal registration and lead acceptance ---------- */
const DR_ST = {submitted:['Submitted','warn'], info:['Info requested','camp'], approved:['Approved','ok'], rejected:['Rejected','bad'], expired:['Protection expired',''], won:['Closed won','ok'], lost:['Closed lost','']};
const DR_TABS = [['dealreg','Review queue'],['dealreg-active','Approved'],['dealreg-all','All registrations'],['dealreg-leads','Lead acceptance']];
const RG = id => S.dealregs?.[id];
const regDays = () => Number(S.settings.program?.regDays) || 90;
const slaDays = () => Number(S.settings.program?.leadSlaDays) || 3;
const rRef = id => RG(id) ? ref(id, 'pipe', RG(id).account?.name || 'Registration') : '<span class="muted">No registration</span>';
function drStatus(r) {
  if (r.status === 'approved') {
    const d = r.dealId && S.deals[r.dealId];
    if (d && d.stage === 'won') return 'won'; if (d && d.stage === 'lost') return 'lost';
    if (r.expiresAt && r.expiresAt < today()) return 'expired';
  }
  return r.status;
}
const drPill = r => stPill(DR_ST, drStatus(r));
const leadDue = l => l.assignedAt ? addDays(String(l.assignedAt).slice(0, 10), slaDays()) : '';
const drRefNo = id => 'DR-' + String(id).replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase();

function drConflicts(r, selfId) {
  const out = [], b = brand(), nm = r.account?.name || '', dom = cleanDomain(r.account?.domain);
  const a = acctByName(nm, dom);
  if (a) {
    if (a.vendorStatus === 'customer') out.push({sev:'warn', text:`${a.name} is already a ${b.vendorName} customer. Check this is new scope, not an existing renewal.`, id:a.id});
    pairsOf(a).filter(x => x.pid !== r.partnerId && vRank(x.status) >= 2).forEach(x => out.push({sev:'bad', text:`${pName(x.pid)} has this account as ${VST[x.status][0].toLowerCase()}.`, id:a.id}));
    dealsForAcct(a).filter(d => OPEN.has(d.stage)).forEach(d => { const did = d.id; if (d.partnerId !== r.partnerId) out.push({sev:'bad', text:`${pName(d.partnerId)} has an open deal here: ${d.name || d.product} (${STAGE[d.stage]?.label}, ${money(d.amount)}).`, id:did}); else if (!r.dealId || did !== r.dealId) out.push({sev:'info', text:`${pName(d.partnerId)} already has an open deal here: ${d.name || d.product}. This may be a duplicate.`, id:did}); });
  }
  vals(S.dealregs).filter(x => x.id !== selfId && normCo(x.account?.name) === normCo(nm) || (dom && x.id !== selfId && cleanDomain(x.account?.domain) === dom)).forEach(x => {
    const st = drStatus(x); if (x.id === selfId) return;
    if (st === 'approved' && x.partnerId !== r.partnerId) out.push({sev:'bad', text:`Protected for ${pName(x.partnerId)} until ${fdate(x.expiresAt)} (${drRefNo(x.id)}).`, id:x.id});
    else if ((st === 'submitted' || st === 'info') && x.partnerId !== r.partnerId) out.push({sev:'warn', text:`${pName(x.partnerId)} also registered this account on ${fdate(String(x.createdAt).slice(0, 10))} (${drRefNo(x.id)}), still in review.`, id:x.id});
    else if ((st === 'submitted' || st === 'info' || st === 'approved') && x.partnerId === r.partnerId) out.push({sev:'info', text:`${pName(x.partnerId)} already has ${drRefNo(x.id)} on this account (${DR_ST[st][0].toLowerCase()}).`, id:x.id});
  });
  const em = (r.contact?.email || '').toLowerCase();
  if (em) vals(S.leads).filter(l => (l.email || '').toLowerCase() === em && l.partnerId && l.partnerId !== r.partnerId && LOPEN.has(l.status)).forEach(l => out.push({sev:'warn', text:`${l.name} is an open lead assigned to ${pName(l.partnerId)}.`, id:l.id}));
  return out;
}
const sevOrder = {bad:0, warn:1, info:2};
const conflictBadge = cs => { const w = cs.filter(c => c.sev === 'bad').length, m = cs.filter(c => c.sev === 'warn').length; return w ? `<span class="pill bad">${plural(w, 'conflict')}</span>` : m ? `<span class="pill warn">${plural(m, 'flag')}</span>` : '<span class="pill ok">Clear</span>'; };

function drHead(cur, sub) {
  const label = DR_TABS.find(t => t[0] === cur)[1], all = vals(S.dealregs);
  const counts = {dealreg:all.filter(r => ['submitted','info'].includes(r.status)).length, 'dealreg-active':all.filter(r => drStatus(r) === 'approved').length, 'dealreg-all':all.length, 'dealreg-leads':vals(S.leads).filter(l => l.status === 'assigned').length};
  return `${crumbs(['Home','home'], ...(cur === 'dealreg' ? [['Deal registration']] : [['Deal registration','dealreg'], [label]]))}
  <div class="phead"><div><h1>Deal registration${cur === 'dealreg' ? '' : ' · ' + esc(label)}</h1><p class="sub">${sub}</p></div><div class="row"><a class="btn" href="#portal">Open the partner portal</a><button class="btn primary" data-act="drnewhub">Register for a partner</button></div></div>
  <nav class="subtabs" aria-label="Deal registration views">${DR_TABS.map(([k, l]) => `<a href="#${k}" ${k === cur ? 'aria-current="page"' : ''}>${l}<span class="n">${counts[k]}</span></a>`).join('')}</nav>`;
}
function drTable(key, rows, empty, extra = []) {
  return table(key, [
    {h:'Account', asc:1, sort:r => (r.account?.name || '').toLowerCase(), v:r => `${rRef(r.id)}${ex(r)}<span class="sub">${drRefNo(r.id)} · ${esc(r.product || '')}</span>`},
    {h:'Partner', asc:1, sort:r => pName(r.partnerId), v:r => `${pRef(r.partnerId)}<span class="sub">${esc(r.submitter?.name || '')}</span>`},
    {h:'Amount', r:1, sort:r => r.amount || 0, v:r => money(r.amount)},
    {h:'Submitted', sort:r => r.createdAt || '', v:r => `<span class="num small">${fdate(String(r.createdAt || '').slice(0, 10))}</span><span class="sub">${days(String(r.createdAt || today()).slice(0, 10), today())}d ago</span>`},
    {h:'Status', sort:r => Object.keys(DR_ST).indexOf(drStatus(r)), v:r => drPill(r)},
    {h:'Check', sort:r => -(r.conflicts || drConflicts(r, r.id)).filter(c => c.sev === 'bad').length, v:r => conflictBadge(drConflicts(r, r.id))},
    ...extra
  ], rows, empty);
}
function vDealregQueue() {
  const rows = vals(S.dealregs).filter(r => ['submitted','info'].includes(r.status));
  S.sort['drq'] = S.sort['drq'] || {col:3, dir:1};
  const all = vals(S.dealregs), dec = all.filter(r => r.decision?.at && r.createdAt);
  const avg = dec.length ? sum(dec, r => Math.max(0, days(String(r.createdAt).slice(0, 10), String(r.decision.at).slice(0, 10)))) / dec.length : 0;
  return `${drHead('dealreg', `Partner-submitted registrations waiting on a decision. Approved deals get ${regDays()} days of protection and land in Pipeline.`)}
  <div class="kpis" style="margin-top:16px">
    <div class="kpi"><span class="eyebrow">Waiting on you</span><span class="v num" style="color:${rows.filter(r => r.status === 'submitted').length ? 'var(--warn)' : 'inherit'}">${rows.filter(r => r.status === 'submitted').length}</span><span class="s">${rows.filter(r => r.status === 'info').length} waiting on the partner</span></div>
    <div class="kpi"><span class="eyebrow">Conflicts in queue</span><span class="v num">${rows.filter(r => drConflicts(r, r.id).some(c => c.sev === 'bad')).length}</span><span class="s">need a channel-conflict call</span></div>
    <div class="kpi pipe"><span class="eyebrow">Registered pipeline</span><span class="v num">${money(sum(all.filter(r => drStatus(r) === 'approved'), r => r.amount))}</span><span class="s">under active protection</span></div>
    <div class="kpi"><span class="eyebrow">Avg time to decide</span><span class="v num">${dec.length ? avg.toFixed(1) + 'd' : '—'}</span><span class="s">${dec.length} decided · ${pct(dec.length ? dec.filter(r => r.status === 'approved' || ['won','lost','expired'].includes(drStatus(r))).length / dec.length : 0)} approved</span></div>
  </div>
  <section class="panel">${drTable('drq', rows, 'Nothing waiting. New registrations from the partner portal appear here.')}</section>`;
}
function vDealregActive() {
  const rows = vals(S.dealregs).filter(r => drStatus(r) === 'approved');
  S.sort['dra'] = S.sort['dra'] || {col:6, dir:1};
  return `${drHead('dealreg-active', 'Approved registrations still under protection, soonest expiry first. Extend one if the deal is still moving.')}
  <section class="panel" style="margin-top:16px">${drTable('dra', rows, 'No registrations under protection.', [{h:'Protected until', sort:r => r.expiresAt || '', v:r => { const n = days(today(), r.expiresAt); return `<span class="num small ${n <= 14 ? 'late' : ''}">${fdate(r.expiresAt)}</span><span class="sub">${n} days left</span>`; }}, {h:'Deal', v:r => r.dealId && S.deals[r.dealId] ? `${dRef(r.dealId)}<span class="sub">${STAGE[S.deals[r.dealId].stage]?.label}</span>` : '—'}])}</section>`;
}
function vDealregAll() {
  return `${drHead('dealreg-all', 'Every registration, including rejected, expired and closed ones.')}
  <section class="panel" style="margin-top:16px">${drTable('drall', vals(S.dealregs), 'No registrations yet.')}</section>`;
}
function vLeadAccept() {
  const t0 = today(), waiting = vals(S.leads).filter(l => l.status === 'assigned');
  const recent = vals(S.leads).filter(l => l.assignedAt && days(String(l.assignedAt).slice(0, 10), t0) <= 90);
  const byP = {};
  recent.forEach(l => { if (!l.partnerId) return; const o = byP[l.partnerId] || (byP[l.partnerId] = {pid:l.partnerId, sent:0, acc:0, dec:0, wait:0, hrs:[]}); o.sent++; if (l.status === 'assigned') o.wait++; else if (l.status === 'declined') o.dec++; else if (l.acceptedAt || ['accepted','working','qualified','converted'].includes(l.status)) { o.acc++; if (l.acceptedAt) o.hrs.push((new Date(l.acceptedAt) - new Date(l.assignedAt)) / 36e5); } });
  const allAcc = sum(Object.values(byP), o => o.acc), allDec = sum(Object.values(byP), o => o.dec), hrs = Object.values(byP).flatMap(o => o.hrs).sort((a, b) => a - b);
  const late = waiting.filter(l => leadDue(l) && leadDue(l) < t0);
  return `${drHead('dealreg-leads', `Leads you’ve sent to partners. Partners accept or decline in the portal; the response window is ${plural(slaDays(), 'day')}.`)}
  <div class="kpis" style="margin-top:16px">
    <div class="kpi"><span class="eyebrow">Waiting on partners</span><span class="v num">${waiting.length}</span><span class="s">${late.length ? `<span style="color:var(--bad)">${late.length} past the ${slaDays()}-day window</span>` : 'all inside the window'}</span></div>
    <div class="kpi ok"><span class="eyebrow">Acceptance rate</span><span class="v num">${allAcc + allDec ? pct(allAcc / (allAcc + allDec)) : '—'}</span><span class="s">last 90 days · ${allAcc} accepted, ${allDec} declined</span></div>
    <div class="kpi"><span class="eyebrow">Median time to accept</span><span class="v num">${hrs.length ? (hrs[Math.floor(hrs.length / 2)] < 48 ? Math.round(hrs[Math.floor(hrs.length / 2)]) + 'h' : (hrs[Math.floor(hrs.length / 2)] / 24).toFixed(1) + 'd') : '—'}</span><span class="s">from assignment to answer</span></div>
    <a class="kpi" href="#leads-people"><span class="eyebrow">New, not yet routed</span><span class="v num">${vals(S.leads).filter(l => l.status === 'new').length}</span><span class="s">assign them from the lead page</span></a>
  </div>
  <section class="panel"><div class="panel-h"><h2>Waiting for an answer</h2><span class="muted small">Oldest first</span></div>${table('lacc', [
    {h:'Lead', asc:1, sort:r => r.name.toLowerCase(), v:r => `${lRef(r.id)}<span class="sub">${esc(r.title || '')} · ${esc(AC(r.accountId)?.name || r.company || '')}</span>`},
    {h:'Partner', asc:1, sort:r => pName(r.partnerId), v:r => pRef(r.partnerId)},
    {h:'Rating', v:r => r.rating ? stPill(RATING, r.rating) : '—'},
    {h:'Sent', sort:r => r.assignedAt || '', v:r => `<span class="num small">${fdate(String(r.assignedAt || '').slice(0, 10))}</span>`},
    {h:'Answer due', sort:r => leadDue(r), v:r => `<span class="num small ${leadDue(r) < t0 ? 'late' : ''}">${fdate(leadDue(r))}</span><span class="sub">${leadDue(r) < t0 ? plural(days(leadDue(r), t0), 'day') + ' late' : leadDue(r) === t0 ? 'today' : 'in ' + plural(days(t0, leadDue(r)), 'day')}</span>`},
    {h:'', v:r => `<div class="row" style="flex-wrap:nowrap"><button class="btn sm ok" data-act="lstep" data-id="${esc(r.id)}" data-to="accepted" title="Record that the partner accepted">Accepted</button><button class="btn sm" data-act="opopen" data-kind="ldecline" data-id="${esc(r.id)}">Declined…</button><button class="btn sm ghost" data-act="lnudge" data-id="${esc(r.id)}">Copy nudge</button></div>`}
  ], waiting.sort((a, b) => (a.assignedAt || '').localeCompare(b.assignedAt || '')), 'No leads are waiting on a partner.')}</section>
  <section class="panel" style="margin-top:16px"><div class="panel-h"><h2>By partner, last 90 days</h2></div>${table('laccp', [
    {h:'Partner', asc:1, sort:r => pName(r.pid), v:r => pRef(r.pid)},
    {h:'Sent', r:1, sort:r => r.sent, v:r => r.sent}, {h:'Accepted', r:1, sort:r => r.acc, v:r => r.acc}, {h:'Declined', r:1, sort:r => r.dec, v:r => r.dec}, {h:'Waiting', r:1, sort:r => r.wait, v:r => r.wait},
    {h:'Acceptance', r:1, sort:r => r.acc + r.dec ? r.acc / (r.acc + r.dec) : -1, v:r => r.acc + r.dec ? `<b style="color:${r.acc / (r.acc + r.dec) >= .7 ? 'var(--ok)' : 'var(--warn)'}">${pct(r.acc / (r.acc + r.dec))}</b>` : '—'},
    {h:'Avg time to accept', r:1, sort:r => r.hrs.length ? sum(r.hrs, x => x) / r.hrs.length : 1e9, v:r => r.hrs.length ? (sum(r.hrs, x => x) / r.hrs.length < 48 ? Math.round(sum(r.hrs, x => x) / r.hrs.length) + 'h' : (sum(r.hrs, x => x) / r.hrs.length / 24).toFixed(1) + 'd') : '—'}
  ], Object.values(byP), 'No leads sent in the last 90 days.')}</section>`;
}

/* ----- one registration ----- */
function vDealreg(id) {
  const r = {id, ...RG(id)}, st = drStatus(r), cs = drConflicts(r, id).sort((a, b) => sevOrder[a.sev] - sevOrder[b.sev]), dis = S.canWrite ? '' : 'disabled';
  const a = acctByName(r.account?.name, r.account?.domain);
  let act = '';
  if (r.status === 'submitted' || r.status === 'info') act = `<div class="row"><button class="btn ok" data-act="drapprove" data-id="${esc(id)}" ${dis}>Approve and protect for ${regDays()} days</button><button class="btn" data-act="opopen" data-kind="drinfo" data-id="${esc(id)}" ${dis}>Ask for more info…</button><button class="btn danger" data-act="opopen" data-kind="drreject" data-id="${esc(id)}" ${dis}>Reject…</button></div>${cs.some(c => c.sev === 'bad') ? '<p class="small" style="color:var(--bad)">There’s a conflict. Approving gives this partner protection over the account; talk to the other side first.</p>' : ''}`;
  else if (st === 'approved' || st === 'expired') act = `<div class="row"><button class="btn" data-act="drextend" data-id="${esc(id)}" ${dis}>Extend protection ${regDays()} days</button>${st === 'approved' ? `<button class="btn ghost" data-act="opopen" data-kind="drrevoke" data-id="${esc(id)}" ${dis}>Revoke…</button>` : ''}</div>`;
  else if (r.status === 'rejected') act = `<button class="btn" data-act="drreopen" data-id="${esc(id)}" ${dis}>Reopen for review</button>`;
  const flow = ['submitted','approved', st === 'won' || st === 'lost' ? st : 'won'];
  return `${crumbs(['Home','home'],['Deal registration','dealreg'],[r.account?.name || 'Registration'])}
  <div class="phead"><div><div class="row"><span class="kind pipe">registration</span>${drPill(r)}<span class="pill">${drRefNo(id)}</span>${ex(r)}</div><h1 style="margin-top:6px">${esc(r.account?.name || '')}</h1><p class="sub">${pRef(r.partnerId)} · ${esc(r.product || '')} · ${money(r.amount)} · close ${fdate(r.closeDate)}</p></div>${a ? `<a class="btn sm" href="#${esc(a.id)}">Open account</a>` : ''}</div>
  <div class="grid-main">
    <div class="stack">
      <section class="panel"><div class="panel-h"><h2>Conflict check</h2>${conflictBadge(cs)}</div>
        <div class="list">${cs.map(c => `<div class="li"><span class="sev ${c.sev}" aria-hidden="true"></span><span class="t">${esc(c.text)}</span>${c.id ? `<span class="a"><a class="btn sm" href="#${esc(c.id)}">Open</a></span>` : ''}</div>`).join('') || `<div class="empty">No conflicts. No other partner has this account, an open deal on it, or a live registration.</div>`}</div>
        <p class="panel-b small muted" style="border-top:1px solid var(--line)">Checked against accounts, partner deals, other registrations and leads, by company name, website domain and contact email.</p></section>
      <section class="panel"><div class="panel-h"><h2>Decision</h2>${drPill(r)}</div><div class="panel-b stack" style="gap:12px">
        ${r.decision?.note ? `<p class="small"><b>${esc(r.decision.label || 'Note')}:</b> ${esc(r.decision.note)}</p>` : ''}
        ${st === 'approved' ? `<p class="small">Protected for ${esc(pName(r.partnerId))} until <b>${fdate(r.expiresAt)}</b> (${days(today(), r.expiresAt)} days left).</p>` : st === 'expired' ? `<p class="small" style="color:var(--warn)">Protection ended ${fdate(r.expiresAt)}. The deal is still open.</p>` : ''}
        ${r.dealId && S.deals[r.dealId] ? `<p class="small">Pipeline deal: ${dRef(r.dealId)} · ${STAGE[S.deals[r.dealId].stage]?.label}</p>` : ''}
        ${act}</div></section>
      <section class="panel"><div class="panel-h"><h2>History</h2></div><div class="list">${(r.history || []).slice().reverse().map(h => `<div class="li"><span class="num small muted">${fdate(String(h.at).slice(0, 10))}</span><span class="t">${esc(h.action)}</span><span class="d">${esc([h.note, h.by && h.by !== 'sample' ? h.by : ''].filter(Boolean).join(' · '))}</span></div>`).join('')}</div></section>
    </div>
    <div class="stack">
      <section class="panel"><div class="panel-h"><h2>Opportunity</h2></div><div class="panel-b"><dl class="facts" style="grid-template-columns:1fr 1fr">
        <div><dt>Product</dt><dd>${esc(r.product || '—')}</dd></div><div><dt>Amount</dt><dd class="num">${full(r.amount)}</dd></div>
        <div><dt>Expected close</dt><dd>${fdate(r.closeDate)}</dd></div><div><dt>Partner’s stage</dt><dd>${esc(r.oppStage || '—')}</dd></div>
        <div style="grid-column:1/-1"><dt>Customer need</dt><dd>${esc(r.need || '—')}</dd></div>
        ${r.competitors ? `<div style="grid-column:1/-1"><dt>Competition</dt><dd>${esc(r.competitors)}</dd></div>` : ''}
        ${r.vendorInvolved ? `<div style="grid-column:1/-1"><dt>${esc(brand().vendorName)} involvement</dt><dd>${esc(r.vendorInvolved)}</dd></div>` : ''}</dl></div></section>
      <section class="panel"><div class="panel-h"><h2>Customer</h2></div><div class="panel-b"><dl class="facts" style="grid-template-columns:1fr">
        <div><dt>Company</dt><dd>${esc(r.account?.name || '')}${r.account?.domain ? ' · ' + esc(r.account.domain) : ''}</dd></div>
        <div><dt>Location and industry</dt><dd>${esc([[r.account?.city, r.account?.state].filter(Boolean).join(', '), r.account?.industry].filter(Boolean).join(' · ') || '—')}</dd></div>
        <div><dt>Contact</dt><dd>${esc(r.contact?.name || '—')}${r.contact?.title ? ', ' + esc(r.contact.title) : ''}${r.contact?.email ? `<br><a href="mailto:${esc(r.contact.email)}">${esc(r.contact.email)}</a>` : ''}${r.contact?.phone ? ' · ' + esc(r.contact.phone) : ''}</dd></div></dl></div></section>
      <section class="panel"><div class="panel-h"><h2>Submitted by</h2></div><div class="panel-b"><p>${esc(r.submitter?.name || '—')}${r.submitter?.email ? ` · <a href="mailto:${esc(r.submitter.email)}">${esc(r.submitter.email)}</a>` : ''}</p><p class="small muted">${esc(pName(r.partnerId))} · ${fdate(String(r.createdAt || '').slice(0, 10))} · ${r.source === 'hub' ? 'entered in the hub' : 'partner portal'}${r.leadId ? ` · from lead ${lRef(r.leadId)}` : ''}</p></div></section>
    </div>
  </div>`;
}

/* ----- partner portal ----- */
const PT = () => S.pt || (S.pt = {tab:'leads', pid:(() => { try { return localStorage.getItem('pcc.portalPartner') || ''; } catch (e) { return ''; } })(), who:(() => { try { return JSON.parse(localStorage.getItem('pcc.portalWho') || '{}'); } catch (e) { return {}; } })(), f:{}, done:null, decline:{}});
const DR_FIELDS = [
  ['acct','Customer company',1], ['domain','Company website',0], ['city','City',0], ['state','State',0], ['industry','Industry',0],
  ['cname','Customer contact name',1], ['ctitle','Contact title',0], ['cemail','Contact email',1], ['cphone','Contact phone',0],
  ['product','Product or solution',1], ['amount','Estimated amount ($)',1], ['closeDate','Expected close date',1], ['oppStage','Where the deal is',0], ['need','What the customer needs',1], ['competitors','Competitors involved',0], ['vendorInvolved','Anyone at ' , 0]
];
function vPortal() {
  const T = PT(), pid = S.partners[T.pid] ? T.pid : '', p = P(pid), b = brand();
  const offered = pid ? vals(S.leads).filter(l => l.partnerId === pid && l.status === 'assigned').sort((x, y) => (x.assignedAt || '').localeCompare(y.assignedAt || '')) : [];
  const mine = pid ? vals(S.leads).filter(l => l.partnerId === pid && ['accepted','working','qualified'].includes(l.status)) : [];
  const regs = pid ? vals(S.dealregs).filter(r => r.partnerId === pid).sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || '')) : [];
  const tabs = [['leads', `Leads for you`, offered.length], ['register', 'Register a deal', null], ['mine', 'My registrations', regs.length]];
  return `<div class="portal">
    <div class="pthead"><div><span class="eyebrow">${esc(b.vendorName)} partner portal</span><h1>${p ? esc(p.name) : 'Welcome, partner'}</h1><p class="sub">Register the deals you’re working so they’re protected, and accept the leads ${esc(b.vendorName)} sends you.</p></div>
      <div class="row ptwho"><div class="field"><label for="ptPartner">Your company</label><select class="inp" id="ptPartner"><option value="">Choose your company…</option>${sortedPartners().map(x => `<option value="${esc(x.id)}" ${pid === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="ptName">Your name</label><input class="inp" id="ptName" data-ptwho="name" value="${esc(T.who.name || '')}" autocomplete="name"></div>
        <div class="field"><label for="ptEmail">Your email</label><input class="inp" id="ptEmail" data-ptwho="email" type="email" value="${esc(T.who.email || '')}" autocomplete="email"></div></div></div>
    ${!pid ? '<section class="panel"><div class="empty"><h2>Choose your company to start</h2><p style="margin-top:6px">You’ll see the leads waiting for you and the deals you’ve registered.</p></div></section>' : `
    <nav class="subtabs" aria-label="Portal sections">${tabs.map(([k, l, n]) => `<button class="ptab" data-act="pttab" data-val="${k}" aria-current="${T.tab === k ? 'page' : 'false'}">${l}${n != null ? `<span class="n${k === 'leads' && n ? ' hot' : ''}">${n}</span>` : ''}</button>`).join('')}</nav>
    ${T.tab === 'leads' ? `
      <section class="panel" style="margin-top:16px"><div class="panel-h"><h2>Waiting for your answer</h2><span class="muted small">Please answer within ${plural(slaDays(), 'day')}</span></div>
        ${offered.length ? `<div class="ptleads">${offered.map(l => { const a = AC(l.accountId), due = leadDue(l), late = due && due < today(); return `<article class="ptlead"><div class="spread"><div><h3>${esc(l.name)}</h3><p class="small muted">${esc(l.title || '')}${l.title ? ' · ' : ''}${esc(a?.name || l.company || '')}${a?.city ? ' · ' + esc([a.city, a.state].filter(Boolean).join(', ')) : ''}</p></div>${l.rating ? stPill(RATING, l.rating) : ''}</div>
          ${l.notes ? `<p class="small">${esc(l.notes)}</p>` : ''}<p class="small ${late ? 'late' : 'muted'}">Sent ${fdate(String(l.assignedAt || '').slice(0, 10))} · answer ${late ? 'was due' : 'due'} ${fdate(due)}${l.source ? ' · source: ' + esc(l.source) : ''}</p>
          ${T.decline[l.id] != null ? `<div class="field"><label for="ptd-${esc(l.id)}">Why are you passing on it?</label><textarea class="inp" id="ptd-${esc(l.id)}" data-ptdec="${esc(l.id)}" rows="2" placeholder="Outside our territory, no capacity, existing conflict…">${esc(T.decline[l.id])}</textarea></div><div class="row"><button class="btn danger" data-act="ptdecline" data-id="${esc(l.id)}">Decline lead</button><button class="btn ghost" data-act="ptdeccancel" data-id="${esc(l.id)}">Cancel</button></div>` : `<div class="row"><button class="btn ok" data-act="ptaccept" data-id="${esc(l.id)}">Accept lead</button><button class="btn" data-act="ptdecopen" data-id="${esc(l.id)}">Decline…</button></div>`}</article>`; }).join('')}</div>` : '<div class="empty">Nothing waiting. New leads from ' + esc(b.vendorName) + ' will show up here.</div>'}</section>
      <section class="panel" style="margin-top:16px"><div class="panel-h"><h2>Leads you’re working</h2></div>
        <div class="list">${mine.map(l => `<div class="li"><span class="kind camp">lead</span><span class="t">${esc(l.name)}</span><span class="d">${esc(l.title || '')} · ${esc(AC(l.accountId)?.name || l.company || '')} · ${esc(LST[l.status][0])}</span><span class="a"><button class="btn sm" data-act="ptfromlead" data-id="${esc(l.id)}">Register a deal</button></span></div>`).join('') || '<div class="empty">No accepted leads yet.</div>'}</div></section>` : ''}
    ${T.tab === 'register' ? portalForm(pid) : ''}
    ${T.tab === 'mine' ? `<section class="panel" style="margin-top:16px"><div class="panel-h"><h2>Your registrations</h2></div>
      <div class="list">${regs.map(r => { const st = drStatus(r); return `<div class="li"><span class="kind pipe">${drRefNo(r.id)}</span><span class="t">${esc(r.account?.name || '')} · ${esc(r.product || '')} · ${money(r.amount)}</span><span class="d">Submitted ${fdate(String(r.createdAt || '').slice(0, 10))}${st === 'approved' ? ` · protected until ${fdate(r.expiresAt)}` : ''}${r.decision?.note && ['info','rejected'].includes(r.status) ? `<br><b>${esc(b.vendorName)}:</b> ${esc(r.decision.note)}` : ''}</span><span class="a">${stPill(DR_ST, st)}${r.status === 'info' ? ` <button class="btn sm primary" data-act="ptedit" data-id="${esc(r.id)}">Update and resubmit</button>` : ''}</span></div>`; }).join('') || '<div class="empty">You haven’t registered any deals yet.</div>'}</div></section>` : ''}`}
    <p class="small muted ptfoot">Questions? Contact your ${esc(b.vendorName)} partner account manager.${S.canWrite ? ' · <a href="#dealreg">Back to the Command Center</a>' : ''}</p>
  </div>`;
}
function portalForm(pid) {
  const T = PT(), f = T.f, b = brand(), cs = f.acct ? drConflicts({partnerId:pid, account:{name:f.acct, domain:f.domain}, contact:{email:f.cemail}}, T.editId || '') : [];
  const inp = (k, l, req, type = 'text', span = 1, ph = '') => `<div class="field" style="grid-column:span ${span}"><label for="ptf-${k}">${esc(l)}${req ? ' <span style="color:var(--bad)">*</span>' : ''}</label>${type === 'area' ? `<textarea class="inp" id="ptf-${k}" data-ptf="${k}" rows="3" placeholder="${esc(ph)}">${esc(f[k] || '')}</textarea>` : type === 'stage' ? `<select class="inp" id="ptf-${k}" data-ptf="${k}">${['Discovery','Qualified','Proposal sent','Negotiating','Verbal commit'].map(s => `<option ${f[k] === s ? 'selected' : ''}>${s}</option>`).join('')}</select>` : `<input class="inp" id="ptf-${k}" data-ptf="${k}" type="${type}" value="${esc(f[k] || '')}" placeholder="${esc(ph)}" ${type === 'number' ? 'min="0" step="any" inputmode="decimal"' : ''}>`}</div>`;
  if (T.done) return `<section class="panel" style="margin-top:16px"><div class="empty"><h2>Registration ${esc(T.done)} received</h2><p style="margin-top:6px">${esc(b.vendorName)} will review it, usually within two business days. You’ll see the decision under My registrations.</p><p style="margin-top:12px"><button class="btn primary" data-act="ptagain">Register another deal</button> <button class="btn" data-act="pttab" data-val="mine">See my registrations</button></p></div></section>`;
  return `<section class="panel" style="margin-top:16px"><div class="panel-h"><h2>${T.editId ? 'Update registration ' + drRefNo(T.editId) : 'Register a deal'}</h2><span class="muted small">Approved deals are protected for ${regDays()} days</span></div>
    <form class="panel-b stack" id="ptForm" style="gap:16px" novalidate>
      <fieldset class="ptfs"><legend>Customer</legend><div class="fgrid">${inp('acct', 'Company name', 1, 'text', 2)}${inp('domain', 'Company website', 0, 'text', 2, 'example.com')}${inp('city', 'City')}${inp('state', 'State', 0, 'text', 1, 'TX')}${inp('industry', 'Industry', 0, 'text', 2)}</div></fieldset>
      <fieldset class="ptfs"><legend>Customer contact</legend><div class="fgrid">${inp('cname', 'Name', 1, 'text', 2)}${inp('ctitle', 'Title', 0, 'text', 2)}${inp('cemail', 'Email', 1, 'email', 2)}${inp('cphone', 'Phone', 0, 'tel', 2)}</div></fieldset>
      <fieldset class="ptfs"><legend>Opportunity</legend><div class="fgrid">${inp('product', 'Product or solution', 1, 'text', 2)}${inp('amount', 'Estimated amount ($)', 1, 'number')}${inp('closeDate', 'Expected close', 1, 'date')}${inp('oppStage', 'Where the deal is', 0, 'stage', 2)}${inp('competitors', 'Competitors involved', 0, 'text', 2)}${inp('need', 'What the customer needs and why now', 1, 'area', 4, 'The problem, the trigger, and what you’ve done so far')}${inp('vendorInvolved', `Anyone at ${b.vendorName} already involved?`, 0, 'text', 4, 'Name of the account executive, if any')}</div></fieldset>
      ${cs.some(c => c.sev !== 'info') ? `<div class="banner warn"><span><b>Heads-up:</b> ${esc(b.vendorName)} already has activity on this account. You can still submit; your partner manager will sort it out with you.</span></div>` : ''}
      ${T.err ? `<p class="small" role="alert" style="color:var(--bad)">${esc(T.err)}</p>` : ''}
      <div class="row"><button class="btn primary" type="submit" ${T.sending ? 'disabled' : ''}>${T.sending ? 'Submitting…' : T.editId ? 'Resubmit registration' : 'Submit registration'}</button>${T.editId ? '<button class="btn ghost" type="button" data-act="ptagain">Cancel</button>' : ''}<span class="small muted">You’ll get a reference number straight away.</span></div>
    </form></section>`;
}
async function ptSubmit() {
  const T = PT(), f = T.f, pid = T.pid;
  const need = [['acct','company name'],['cname','contact name'],['cemail','contact email'],['product','product'],['amount','amount'],['closeDate','expected close'],['need','customer need']].filter(([k]) => !String(f[k] || '').trim()).map(x => x[1]);
  if (!T.who.name || !T.who.email) need.unshift('your name and email (top of the page)');
  if (need.length) { T.err = 'Please add ' + need.join(', ') + '.'; render(); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.cemail)) { T.err = 'The contact email doesn’t look right.'; render(); return; }
  T.sending = true; T.err = ''; render();
  const doc = {partnerId:pid, submitter:{name:T.who.name, email:T.who.email}, account:{name:f.acct.trim(), domain:cleanDomain(f.domain), city:f.city || '', state:(f.state || '').toUpperCase().slice(0, 2), industry:f.industry || ''}, contact:{name:f.cname.trim(), title:f.ctitle || '', email:f.cemail.trim().toLowerCase(), phone:f.cphone || ''}, product:f.product.trim(), amount:numOr(f.amount), closeDate:f.closeDate, oppStage:f.oppStage || 'Discovery', need:f.need.trim(), competitors:f.competitors || '', vendorInvolved:f.vendorInvolved || '', leadId:f.leadId || '', updatedAt:now()};
  doc.conflicts = drConflicts(doc, T.editId || '');
  const id = T.editId || newId('dr-');
  const ok = await write(db => T.editId ? db.doc('dealregs/' + id).update({...doc, status:'submitted', history:[...(RG(id).history || []), {action:'Resubmitted with more information', at:now(), by:T.who.name}]}) : db.doc('dealregs/' + id).set({...doc, status:'submitted', source:'portal', createdAt:now(), history:[{action:'Submitted', at:now(), by:T.who.name}]}), null);
  T.sending = false;
  if (ok) { T.done = drRefNo(id); T.f = {}; T.editId = ''; } else T.err = 'It didn’t save. Check your connection and try again.';
  render();
}

/* ----- forms ----- */
Object.assign(OP_FORMS, {
  drreject:{title:() => 'Reject registration', sub:'The partner sees this reason in the portal.', fields:() => [{k:'note', l:'Reason', t:'area', req:1, span:4, ph:'e.g. Already protected for another partner until March'}],
    save:async (M, v) => { const r = RG(M.id); return {ok:await write(db => db.doc('dealregs/' + M.id).update({status:'rejected', decision:{label:'Rejected', note:v.note.trim(), by:meName(), at:now()}, history:[...(r.history || []), {action:'Rejected', note:v.note.trim(), at:now(), by:meName()}], updatedAt:now()}), 'Registration rejected')}; }},
  drinfo:{title:() => 'Ask for more information', sub:'The partner sees your question in the portal and can update and resubmit.', fields:() => [{k:'note', l:'What do you need?', t:'area', req:1, span:4, ph:'e.g. Who is the economic buyer, and is there a budget approved?'}],
    save:async (M, v) => { const r = RG(M.id); return {ok:await write(db => db.doc('dealregs/' + M.id).update({status:'info', decision:{label:'Question', note:v.note.trim(), by:meName(), at:now()}, history:[...(r.history || []), {action:'More information requested', note:v.note.trim(), at:now(), by:meName()}], updatedAt:now()}), 'Sent back to the partner')}; }},
  drrevoke:{title:() => 'Revoke protection', sub:'Ends the protection now. The pipeline deal stays.', fields:() => [{k:'note', l:'Reason', t:'area', req:1, span:4}],
    save:async (M, v) => { const r = RG(M.id); return {ok:await write(db => db.doc('dealregs/' + M.id).update({expiresAt:addDays(today(), -1), decision:{label:'Protection revoked', note:v.note.trim(), by:meName(), at:now()}, history:[...(r.history || []), {action:'Protection revoked', note:v.note.trim(), at:now(), by:meName()}], updatedAt:now()}), 'Protection revoked')}; }},
  drhub:{title:() => 'Register a deal for a partner', sub:'For registrations a partner sends you by email or phone. It goes into the review queue.', fields:() => [
    {k:'partnerId', l:'Partner', t:'select', o:opPartnerOpts(), req:1, span:2}, {k:'submitter', l:'Partner rep', span:2},
    {k:'acct', l:'Customer company', req:1, span:2}, {k:'domain', l:'Company website', span:2},
    {k:'cname', l:'Customer contact', req:1, span:2}, {k:'cemail', l:'Contact email', req:1, span:2},
    {k:'product', l:'Product or solution', req:1, span:2}, {k:'amount', l:'Amount ($)', t:'num', req:1}, {k:'closeDate', l:'Expected close', t:'date', req:1},
    {k:'need', l:'Customer need', t:'area', req:1, span:4}],
    init:() => ({partnerId:S.focus || '', closeDate:addDays(today(), 90)}),
    save:async (M, v) => { const id = newId('dr-'), doc = {partnerId:v.partnerId, submitter:{name:v.submitter || '', email:''}, account:{name:v.acct.trim(), domain:cleanDomain(v.domain), city:'', state:'', industry:''}, contact:{name:v.cname.trim(), title:'', email:v.cemail.trim().toLowerCase(), phone:''}, product:v.product.trim(), amount:numOr(v.amount), closeDate:v.closeDate, oppStage:'', need:v.need.trim(), competitors:'', vendorInvolved:'', leadId:''}; doc.conflicts = drConflicts(doc, ''); return {ok:await write(db => db.doc('dealregs/' + id).set({...doc, status:'submitted', source:'hub', createdAt:now(), updatedAt:now(), history:[{action:'Entered for the partner', at:now(), by:meName()}]}), 'Registration added to the queue'), go:id}; }}
});
async function drApprove(id) {
  const r = RG(id), t = now(), exp = addDays(today(), regDays()), did = r.dealId || newId('DL');
  const ok = await write(async db => {
    let a = acctByName(r.account.name, r.account.domain);
    if (!a) { const aid = newId('ac-'); a = {id:aid, name:r.account.name, partners:{}}; await db.doc('accounts/' + aid).set({name:r.account.name, domain:r.account.domain || '', industry:r.account.industry || '', city:r.account.city || '', state:r.account.state || '', vendorStatus:'opportunity', partners:{[r.partnerId]:{status:'opportunity', role:'resell', owner:r.submitter?.name || ''}}, partnerIds:[r.partnerId], stage:'cosell', motion:'partner', nextStep:'', nextStepDate:'', plays:[], thread:[], source:'Deal registration', createdAt:t}); }
    else { const partners = {...(a.partners || {}), [r.partnerId]:{...(a.partners?.[r.partnerId] || {role:'resell', owner:r.submitter?.name || ''}), status:a.partners?.[r.partnerId]?.status === 'customer' ? 'customer' : 'opportunity'}}; await db.doc('accounts/' + a.id).update({partners, partnerIds:Object.keys(partners), ...(a.vendorStatus !== 'customer' ? {vendorStatus:'opportunity'} : {}), ...(['identified','mapped','engaging'].includes(a.stage || 'identified') ? {stage:'cosell'} : {}), updatedAt:t}); }
    if (!r.dealId) await db.doc('deals/' + did).set({name:`${r.account.name} — ${r.product}`, account:a.name, accountId:a.id, partnerId:r.partnerId, contactId:'', product:r.product, stage:'registered', amount:r.amount, createdAt:today(), closeDate:r.closeDate, nextStep:'', source:'dealreg', regId:id});
    if (r.leadId && LD(r.leadId)) await db.doc('leads/' + r.leadId).update({status:'converted', dealId:did, history:lhist(LD(r.leadId), 'Converted through deal registration ' + drRefNo(id)), updatedAt:t});
    await db.doc('dealregs/' + id).update({status:'approved', approvedAt:t, expiresAt:exp, dealId:did, accountId:a.id, decision:{label:'Approved', note:'', by:meName(), at:t}, history:[...(r.history || []), {action:`Approved; protected until ${exp}`, at:t, by:meName()}], updatedAt:t});
  }, `Approved. ${pName(r.partnerId)} is protected until ${fdate(exp)}.`);
  return ok;
}
function drAttention(items) {
  const t0 = today();
  const waiting = vals(S.dealregs).filter(r => r.status === 'submitted');
  waiting.forEach(r => items.push({sev:days(String(r.createdAt).slice(0, 10), t0) > 2 ? 'bad' : 'warn', t:`Deal registration to review: ${rRef(r.id)}`, d:`${pName(r.partnerId)} · ${money(r.amount)} · submitted ${days(String(r.createdAt).slice(0, 10), t0)}d ago${drConflicts(r, r.id).some(c => c.sev === 'bad') ? ' · has a conflict' : ''}`, a:`<a class="btn sm" href="#${esc(r.id)}">Review</a>`}));
  vals(S.dealregs).filter(r => drStatus(r) === 'approved' && r.expiresAt && days(t0, r.expiresAt) <= 14).forEach(r => items.push({sev:'info', t:`Protection ending: ${rRef(r.id)}`, d:`${pName(r.partnerId)} · expires ${fdate(r.expiresAt)}`, a:`<a class="btn sm" href="#${esc(r.id)}">Extend</a>`}));
  const late = vals(S.leads).filter(l => l.status === 'assigned' && leadDue(l) && leadDue(l) < t0);
  if (late.length) items.push({sev:'warn', t:`${plural(late.length, 'lead')} past the partner’s answer window`, d:[...new Set(late.map(l => pName(l.partnerId)))].slice(0, 3).join(', '), a:`<a class="btn sm" href="#dealreg-leads">Chase</a>`});
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id;
  const known = ['drapprove','drextend','drreopen','drnewhub','lnudge','pttab','ptaccept','ptdecopen','ptdeccancel','ptdecline','ptfromlead','ptedit','ptagain'];
  if (!known.includes(act)) return;
  const T = PT();
  if (act === 'drapprove') await drApprove(id);
  else if (act === 'drextend') { const r = RG(id), base = r.expiresAt && r.expiresAt > today() ? r.expiresAt : today(), exp = addDays(base, regDays()); await write(db => db.doc('dealregs/' + id).update({expiresAt:exp, history:[...(r.history || []), {action:'Protection extended to ' + exp, at:now(), by:meName()}], updatedAt:now()}), `Protected until ${fdate(exp)}`); }
  else if (act === 'drreopen') { const r = RG(id); await write(db => db.doc('dealregs/' + id).update({status:'submitted', history:[...(r.history || []), {action:'Reopened for review', at:now(), by:meName()}], updatedAt:now()}), 'Back in the queue'); }
  else if (act === 'drnewhub') opOpen('drhub');
  else if (act === 'lnudge') { const l = LD(id), txt = `Hi ${pName(l.partnerId)} team — a quick nudge on the lead we sent ${fdate(String(l.assignedAt).slice(0, 10))}: ${l.name}${l.title ? ', ' + l.title : ''} at ${AC(l.accountId)?.name || l.company}. Can you accept or pass on it in the partner portal today? Thanks!`; try { await navigator.clipboard.writeText(txt); toast('Nudge copied. Paste it into an email or message.'); } catch (x) { toast(txt); } }
  else if (act === 'pttab') { T.tab = b.dataset.val; T.done = null; render(); }
  else if (act === 'ptaccept') { const l = LD(id); await write(db => db.doc('leads/' + id).update({status:'accepted', acceptedAt:now(), owner:'partner', history:lhist(l, 'Accepted by ' + pName(l.partnerId), T.who.name ? 'via portal by ' + T.who.name : 'via portal'), updatedAt:now()}), 'Lead accepted. It’s yours.'); }
  else if (act === 'ptdecopen') { T.decline[id] = ''; render(); setTimeout(() => $('#ptd-' + id)?.focus(), 30); }
  else if (act === 'ptdeccancel') { delete T.decline[id]; render(); }
  else if (act === 'ptdecline') { const why = (T.decline[id] || '').trim(); if (!why) { toast('Add a short reason so we can route it elsewhere.'); $('#ptd-' + id)?.focus(); return; } const l = LD(id); if (await write(db => db.doc('leads/' + id).update({status:'declined', history:lhist(l, 'Declined by ' + pName(l.partnerId), why + (T.who.name ? ' (' + T.who.name + ')' : '')), updatedAt:now()}), 'Thanks. We’ll route it elsewhere.')) { delete T.decline[id]; render(); } }
  else if (act === 'ptfromlead') { const l = LD(id), a = AC(l.accountId); T.f = {acct:a?.name || l.company || '', domain:a?.domain || '', city:a?.city || '', state:a?.state || '', industry:a?.industry || '', cname:l.name, ctitle:l.title || '', cemail:l.email || '', cphone:l.phone || '', leadId:id, closeDate:addDays(today(), 90)}; T.tab = 'register'; T.done = null; T.editId = ''; render(); }
  else if (act === 'ptedit') { const r = RG(id); T.f = {acct:r.account?.name, domain:r.account?.domain, city:r.account?.city, state:r.account?.state, industry:r.account?.industry, cname:r.contact?.name, ctitle:r.contact?.title, cemail:r.contact?.email, cphone:r.contact?.phone, product:r.product, amount:r.amount, closeDate:r.closeDate, oppStage:r.oppStage, need:r.need, competitors:r.competitors, vendorInvolved:r.vendorInvolved, leadId:r.leadId}; T.editId = id; T.tab = 'register'; T.done = null; render(); }
  else if (act === 'ptagain') { T.done = null; T.f = {}; T.editId = ''; T.err = ''; render(); }
});
document.addEventListener('submit', e => { if (e.target.id === 'ptForm') { e.preventDefault(); ptSubmit(); } });
document.addEventListener('input', e => {
  const el = e.target, T = S.pt; if (!T) return;
  if (el.dataset?.ptf) { T.f[el.dataset.ptf] = el.value; if (el.dataset.ptf === 'acct' || el.dataset.ptf === 'domain') { clearTimeout(S._ptt); S._ptt = setTimeout(render, 500); } }
  else if (el.dataset?.ptwho) { T.who[el.dataset.ptwho] = el.value; try { localStorage.setItem('pcc.portalWho', JSON.stringify(T.who)); } catch (x) {} }
  else if (el.dataset?.ptdec) T.decline[el.dataset.ptdec] = el.value;
});
document.addEventListener('change', e => { const el = e.target; if (el.id === 'ptPartner') { const T = PT(); T.pid = el.value; T.done = null; T.f = {}; T.editId = ''; try { localStorage.setItem('pcc.portalPartner', el.value); } catch (x) {} render(); } else if (el.dataset?.ptf) { PT().f[el.dataset.ptf] = el.value; } });
