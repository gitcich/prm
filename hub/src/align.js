/* ---------- program operations: lifecycle, MDF workflow, campaign and event planning ---------- */
const LC = [
  {key:'recruit', name:'Recruit', items:[['nda','Mutual NDA signed'],['agreement','Partner agreement executed'],['icp','Partner profile and ICP fit documented'],['sponsor','Executive sponsor named on both sides']]},
  {key:'onboard', name:'Onboard', items:[['portal','PRM portal access provisioned'],['kickoff','Kickoff call held'],['jbp','Joint business plan drafted'],['pricing','Price list and margin structure shared']]},
  {key:'enable', name:'Enable', items:[['salescert','Sales certification (2+ reps)'],['techcert','Technical certification (1+ engineer)'],['demo','Demo environment live'],['playbook','Co-sell playbook reviewed']]},
  {key:'activate', name:'Activate', items:[['dealreg','First deal registered'],['firstcamp','First joint campaign launched'],['firstwin','First closed-won deal'],['locator','Listed in partner locator']]},
  {key:'grow', name:'Grow', items:[['qbr','Quarterly business review held'],['tierreview','Tier review completed'],['practice','New practice area or expansion'],['reference','Joint customer reference secured']]}
];
const LC_KEYS = LC.map(s => s.key);
const MDF_TYPES = ['Event','Webinar','Digital ads','Content','Telemarketing','Training'];
const EVENT_FORMATS = ['Webinar','Lunch & learn','Executive roundtable','Trade show booth','Customer workshop','Happy hour'];
const PARTNER_TYPES = ['MSP','VAR','SI','Distributor','Referral'];
const TIERS = ['Registered','Silver','Gold','Platinum'];
const EVENT_TASKS = [[-42,'Lock date, venue or platform, and speakers','partner'],[-38,'Submit MDF request for the event budget','partner'],[-35,'MDF approved and budget confirmed','vendor'],[-30,'Joint invite and registration page approved','vendor'],[-28,'Promotion launched (email + LinkedIn)','partner'],[-21,'Vendor field sales invites their accounts','vendor'],[-14,'Reminder email to registrants','partner'],[-7,'Final headcount, catering or AV, speaker dry run','partner'],[-1,'Day-before reminder and logistics sent','partner'],[0,'Event day: check-in list, scan or capture leads','partner'],[2,'Follow-up email to attendees and no-shows','partner'],[5,'Leads qualified and deals registered','partner'],[10,'MDF claim submitted with proof of performance','partner'],[14,'Results review: cost per lead, pipeline sourced','vendor']];
const isVirtual = f => f === 'Webinar';
const buildTasks = format => EVENT_TASKS.map(([o, l, w], i) => ({id:'t' + i, offset:o, label:isVirtual(format) && o === -7 ? 'Final headcount, platform test, speaker dry run' : l, owner:w, done:false}));
const taskDue = (e, t) => t.due || (e.date ? addDays(e.date, t.offset || 0) : '');
const prog = () => ({mdfPool:250000, fiscalYear:'FY2026', ...(S.settings.program || {})});
const meName = () => S.uname || 'You';
const dv = (k, d) => S.opDraft?.[k] ?? d;
const dclr = k => { if (S.opDraft) delete S.opDraft[k]; };

const lcIdx = p => Math.max(0, LC_KEYS.indexOf(p.stage));
const lcCount = (p, st) => st.items.filter(([k]) => p.checks?.[k]).length;
const journey = p => sum(LC, st => lcCount(p, st)) / 20;
const readyToAdvance = p => { const i = lcIdx(p); return i < LC.length - 1 && lcCount(p, LC[i]) === LC[i].items.length; };
const overdueTasks = e => e.status === 'cancelled' ? [] : (e.tasks || []).filter(t => !t.done && taskDue(e, t) && taskDue(e, t) < today());

/* ----- lifecycle panel on the partner page ----- */
function lifecyclePanel(id) {
  const p = {id, ...P(id)}, cur = lcIdx(p), v = S.lcView?.[id] ?? cur, st = LC[v], next = LC[cur + 1];
  const left = LC[cur].items.length - lcCount(p, LC[cur]);
  const last = (p.stageHistory || []).slice(-1)[0];
  return `<section class="panel lcpanel"><div class="panel-h"><h2>Lifecycle</h2><span class="muted small">${pct(journey(p))} of the partner journey complete</span></div>
    <div class="panel-b stack" style="gap:14px">
      <ol class="lcbar" aria-label="Lifecycle stages">${LC.map((s, i) => `<li class="${i < cur ? 'done' : i === cur ? 'cur' : ''}"><button data-act="lcview" data-pid="${esc(id)}" data-i="${i}" aria-pressed="${v === i}"><b>${esc(s.name)}</b><span class="num">${lcCount(p, s)}/${s.items.length}</span></button></li>`).join('')}</ol>
      <div><div class="spread" style="margin-bottom:6px"><h3 style="font-size:.95rem">${esc(st.name)} checklist${v === cur ? ' <span class="pill camp">current stage</span>' : v < cur ? ' <span class="pill ok">completed stage</span>' : ' <span class="pill">later stage</span>'}</h3></div>
        <div class="lcitems">${st.items.map(([k, l]) => `<label class="check"><input type="checkbox" data-lcchk="${esc(k)}" data-pid="${esc(id)}" ${p.checks?.[k] ? 'checked' : ''} ${S.canWrite ? '' : 'disabled'}><span>${esc(l)}</span></label>`).join('')}</div></div>
      <div class="row lcact">${next ? (left === 0 ? `<button class="btn primary" data-act="lcadvance" data-pid="${esc(id)}">Advance to ${esc(next.name)}</button>` : `<span class="small muted">Check off ${plural(left, 'more item')} in ${esc(LC[cur].name)} to advance to ${esc(next.name)}.</span>`) : '<span class="small muted">Final stage. Keep the Grow checklist current through QBRs.</span>'}
        ${cur > 0 ? `<button class="linkbtn small" data-act="lcback" data-pid="${esc(id)}">Move back to ${esc(LC[cur - 1].name)}</button>` : ''}
        ${last ? `<span class="small muted" style="margin-left:auto">Moved to ${esc(LIFE[last.stage] || last.stage)} ${fdate(String(last.at).slice(0, 10))}</span>` : ''}</div>
    </div></section>`;
}
function lcFunnel() {
  const ps = vals(S.partners), f = S.filter.lc || '';
  const ready = ps.filter(readyToAdvance).length;
  return `<div class="lcfunnel" role="group" aria-label="Filter by lifecycle stage">${LC.map(s => { const n = ps.filter(p => (p.stage || 'recruit') === s.key).length; return `<button data-act="filter" data-key="lc" data-val="${f === s.key ? '' : s.key}" aria-pressed="${f === s.key}"><span class="eyebrow">${esc(s.name)}</span><b class="num">${n}</b></button>`; }).join('')}
    <button data-act="filter" data-key="lc" data-val="${f === 'ready' ? '' : 'ready'}" aria-pressed="${f === 'ready'}" class="ready"><span class="eyebrow">Ready to advance</span><b class="num">${ready}</b></button></div>`;
}

/* ----- MDF pool and workflow ----- */
function mdfPool() {
  const pg = prog(), pool = Number(pg.mdfPool) || 0, all = vals(S._full?.mdf || S.mdf);
  const by = s => sum(all.filter(m => m.status === s), m => m.amount);
  const seg = [['paid','Paid','var(--ok)'],['claimed','Claim submitted','var(--mdf)'],['approved','Approved','var(--camp)'],['requested','Requested','var(--warn)']].map(([k, l, c]) => [l, by(k), c]);
  const used = sum(seg, s => s[1]), left = pool - used;
  return `<section class="panel mdfpool"><div class="panel-h"><h2>MDF pool · ${esc(pg.fiscalYear)}</h2><span class="small muted num">${full(used)} of ${full(pool)} committed · <b style="color:${left < 0 ? 'var(--bad)' : 'var(--ink)'}">${full(left)} ${left < 0 ? 'over' : 'left'}</b> · <button class="linkbtn" data-act="opsettings">Change pool</button></span></div>
    <div class="panel-b"><div class="poolbar" role="img" aria-label="${seg.map(s => s[0] + ' ' + full(s[1])).join(', ')}">${seg.map(([l, n, c]) => n ? `<span style="width:${Math.min(100, n / (pool || 1) * 100)}%;background:${c}" title="${esc(l)} ${full(n)}"></span>` : '').join('')}</div>
      <div class="row small" style="margin-top:8px;gap:14px">${seg.map(([l, n, c]) => `<span><i class="dot" style="background:${c}"></i>${esc(l)} <b class="num">${money(n)}</b></span>`).join('')}</div></div></section>`;
}
function mdfFlow(id) {
  const m = M(id), dis = S.canWrite ? '' : 'disabled';
  const step = {
    requested:['Waiting on your decision', `${esc(pName(m.partnerId))} asked for ${full(m.amount)}. Approve to commit the funds, or reject with a reason.`, `<button class="btn ok" data-act="mdfapprove" data-id="${esc(id)}" ${dis}>Approve</button><button class="btn" data-act="opopen" data-kind="reject" data-id="${esc(id)}" ${dis}>Reject…</button><button class="btn ghost" data-act="opopen" data-kind="mdf" data-id="${esc(id)}" ${dis}>Edit request</button>`],
    approved:['Approved, waiting on the claim', 'After the activity runs, the partner submits proof of performance and actual leads. Record the claim here.', `<button class="btn primary" data-act="opopen" data-kind="claim" data-id="${esc(id)}" ${dis}>Submit claim…</button>`],
    claimed:['Claim submitted', 'Check the proof below, then mark the claim paid or send it back with a note.', `<button class="btn ok" data-act="mdfpaid" data-id="${esc(id)}" ${dis}>Mark paid</button><button class="btn" data-act="opopen" data-kind="return" data-id="${esc(id)}" ${dis}>Return claim…</button>`],
    paid:['Paid', `Paid in full. ${m.actualLeads ? `${m.actualLeads} leads at ${full(m.amount / m.actualLeads)} per lead.` : ''}`, ''],
    rejected:['Rejected', 'This request was declined. It stays on file for the record.', '']
  }[m.status] || ['', '', ''];
  const canDel = m.status === 'requested' || m.status === 'rejected';
  return `<section class="panel"><div class="panel-h"><h2>Workflow</h2>${stPill(MDF_ST, m.status)}</div><div class="panel-b stack" style="gap:10px">
    <ol class="mflow">${['requested','approved','claimed','paid'].map((s, i) => { const at = ['requested','approved','claimed','paid'].indexOf(m.status); return `<li class="${m.status === 'rejected' ? (i === 0 ? 'done' : '') : i < at ? 'done' : i === at ? 'cur' : ''}">${esc(MDF_ST[s][0])}</li>`; }).join('')}</ol>
    <div><b>${step[0]}</b><p class="small muted" style="margin-top:2px">${step[1]}</p></div>
    ${step[2] ? `<div class="row">${step[2]}</div>` : ''}
    ${m.description ? `<p class="small"><span class="eyebrow">Description</span><br>${esc(m.description)}</p>` : ''}
    ${canDel ? `<button class="btn sm danger ${S.armed === 'mdel-' + id ? 'armed' : ''}" style="align-self:flex-start" data-act="mdfdel" data-id="${esc(id)}" ${dis}>${S.armed === 'mdel-' + id ? 'Confirm delete' : 'Delete request'}</button>` : ''}
  </div></section>`;
}

/* ----- campaign panels ----- */
function messagingPanel(id) {
  const c = C(id), m = c.messaging || {}, has = m.positioning || m.jointValue, busy = S.busy['msg:' + id];
  const body = has ? `<div class="panel-b stack msgview" style="gap:12px">
      ${m.tagline ? `<p class="tagline">${esc(m.tagline)}</p>` : ''}
      ${m.positioning ? `<p>${esc(m.positioning)}</p>` : ''}
      <div class="msg3">${[[brand().vendorName + ' brings', m.vendorValue], [pName(c.partnerId) + ' brings', m.partnerValue], ['Together', m.jointValue]].map(([h, t]) => `<div><span class="eyebrow">${esc(h)}</span><p class="small" style="margin-top:3px">${esc(t || '—')}</p></div>`).join('')}</div>
      ${(m.proofPoints || []).length ? `<div><span class="eyebrow">Proof points</span><ul class="small">${m.proofPoints.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      ${(m.ctas || []).length ? `<div class="row">${m.ctas.map(x => `<span class="pill camp">${esc(x)}</span>`).join('')}</div>` : ''}
      ${m.draftedBy === 'ai' ? '<p class="small muted">Drafted with AI. Square-bracket placeholders need real numbers before anything ships.</p>' : ''}
    </div>` : `<div class="empty">No joint messaging yet. Draft it with AI from the brief, or write it by hand.</div>`;
  return `<section class="panel"><div class="panel-h"><h2>Joint messaging</h2><div class="row"><button class="btn sm ai" data-act="msgai" data-id="${esc(id)}" ${busy || !S.canWrite ? 'disabled' : ''}>${busy ? 'Drafting…' : has ? 'Redraft with AI' : 'Draft with AI'}</button><button class="btn sm" data-act="opopen" data-kind="messaging" data-id="${esc(id)}" ${S.canWrite ? '' : 'disabled'}>${has ? 'Edit' : 'Write by hand'}</button></div></div>${body}</section>`;
}
function threadPanel(id) {
  const c = C(id), th = c.thread || [];
  return `<section class="panel"><div class="panel-h"><h2>Discussion</h2><span class="muted small">${plural(th.length, 'note')}</span></div>
    <div class="list">${th.map(t => `<div class="li"><span class="kind camp">${esc((t.by === 'sample' ? 'note' : t.by) || 'note')}</span><span class="t" style="white-space:pre-wrap">${esc(t.text)}</span><span class="d">${fdate(String(t.at).slice(0, 10))}</span></div>`).join('') || '<div class="empty">No notes yet. Use this for decisions and hand-offs with the partner.</div>'}</div>
    <div class="panel-b" style="border-top:1px solid var(--line)"><label class="small muted" for="cmtText">Add a note</label><textarea class="inp" id="cmtText" rows="2" placeholder="Decision, hand-off or question for the partner team">${esc(dv(id + ':cmt', ''))}</textarea><div class="row" style="margin-top:8px;justify-content:flex-end"><button class="btn sm primary" data-act="cmtpost" data-id="${esc(id)}" ${S.canWrite ? '' : 'disabled'}>Post note</button></div></div></section>`;
}
async function aiMessaging(id) {
  const c = {id, ...C(id)}, p = P(c.partnerId) || {}, b = brand();
  await withAI('msg:' + id, async sample => {
    const prompt = `You are a channel marketing strategist writing joint go-to-market messaging for a vendor and its channel partner to use together.\n\nVendor: ${b.vendorName}\nVendor brand voice: ${b.voice}\nPartner: ${p.name || 'the partner'} (${p.type || 'channel partner'}, ${p.tier || ''} tier${p.region ? ', region ' + p.region : ''})${p.notes ? '\nPartner notes: ' + p.notes : ''}\n\nCampaign: ${c.name}\nGoal: ${c.goal || 'not set'}\nTarget audience: ${c.audience || 'not set'}\nOffer/CTA: ${c.offer || 'not set'}\nBuyer pain or trigger: ${c.pain || 'not set'}\n\nWrite messaging that gives the partner real credit for services, local expertise and relationships, not just resale. Do not invent statistics, customer names or awards; where a number would help, write a placeholder in square brackets like [X% faster recovery].\n\nReply with only JSON in this shape:\n{"positioning":"one sentence: For [audience] who [need], [vendor] and [partner] deliver [outcome]","tagline":"6-9 words","vendorValue":"2-3 sentences","partnerValue":"2-3 sentences","jointValue":"2-3 sentences about the combined customer outcome","proofPoints":["3-4 short items"],"ctas":["2-3 short calls to action"]}`;
    const r = await sample.json(prompt, {cache:false});
    if (!r || typeof r !== 'object') throw {code:'invalid_json'};
    const msg = {positioning:String(r.positioning || ''), tagline:String(r.tagline || ''), vendorValue:String(r.vendorValue || ''), partnerValue:String(r.partnerValue || ''), jointValue:String(r.jointValue || ''), proofPoints:(r.proofPoints || []).map(String), ctas:(r.ctas || []).map(String), draftedBy:'ai', draftedAt:now()};
    await write(db => db.doc('campaigns/' + id).update({messaging:msg, updatedAt:now()}), 'Joint messaging drafted. Edit anything before you build content.');
  });
}

/* ----- event panels ----- */
function runSheet(id) {
  const e = E(id), tasks = (e.tasks || []).map((t, i) => ({...t, i, due:taskDue(e, t)})).sort((a, b) => (a.due || '').localeCompare(b.due || ''));
  if (!tasks.length) return `<section class="panel"><div class="panel-h"><h2>Run sheet</h2></div><div class="empty">No timeline yet. <button class="btn sm" data-act="evtasks" data-id="${esc(id)}" ${S.canWrite ? '' : 'disabled'}>Build the 14-step run sheet</button></div></section>`;
  const grp = [['Before the event', t => t.due < e.date], ['Event day', t => t.due === e.date], ['Follow-up', t => t.due > e.date]];
  const done = tasks.filter(t => t.done).length, od = overdueTasks(e).length;
  return `<section class="panel"><div class="panel-h"><h2>Run sheet</h2><span class="muted small">${done} of ${tasks.length} done${od ? ` · <b style="color:var(--bad)">${od} overdue</b>` : ''}</span></div>
    <div class="runsheet">${grp.map(([h, f]) => { const ts = tasks.filter(f); return ts.length ? `<div class="rsg"><h3 class="eyebrow">${h}</h3>${ts.map(t => { const late = !t.done && t.due < today() && e.status !== 'cancelled'; return `<div class="rst ${t.done ? 'isdone' : ''}"><label class="check"><input type="checkbox" data-evtask="${t.i}" data-id="${esc(id)}" ${t.done ? 'checked' : ''} ${S.canWrite ? '' : 'disabled'}><span>${esc(t.label)}</span></label><span class="num small ${late ? 'late' : 'muted'}">${fdate(t.due)}${late ? ' · overdue' : ''}</span><button class="pill ${t.owner === 'vendor' ? 'mdf' : 'camp'} ownerbtn" data-act="evowner" data-id="${esc(id)}" data-i="${t.i}" title="Switch owner" ${S.canWrite ? '' : 'disabled'}>${esc(t.owner === 'vendor' ? brand().vendorName : 'Partner')}</button></div>`; }).join('')}</div>` : ''; }).join('')}</div>
    <div class="panel-b rsadd" style="border-top:1px solid var(--line)"><div class="field" style="flex:1"><label for="evTaskLabel">Add a task</label><input class="inp" id="evTaskLabel" placeholder="e.g. Print badges and table signage" value="${esc(dv(id + ':task', ''))}"></div><div class="field"><label for="evTaskDue">Due</label><input class="inp" type="date" id="evTaskDue" value="${esc(e.date || today())}"></div><div class="field"><label for="evTaskOwner">Owner</label><select class="inp" id="evTaskOwner"><option value="partner">Partner</option><option value="vendor">${esc(brand().vendorName)}</option></select></div><button class="btn" data-act="evtaskadd" data-id="${esc(id)}" ${S.canWrite ? '' : 'disabled'}>Add</button></div></section>`;
}
function eventResults(id) {
  const e = E(id), show = e.regs ? (e.attended || 0) / e.regs : 0, cpl = e.leads ? (e.budget || 0) / e.leads : 0;
  return `<section class="panel"><div class="panel-h"><h2>Results</h2><button class="btn sm" data-act="opopen" data-kind="results" data-id="${esc(id)}" ${S.canWrite ? '' : 'disabled'}>Update results</button></div><div class="panel-b"><dl class="facts">
    <div><dt>Registered</dt><dd>${e.regs || 0} <span class="muted small">of ${e.targetRegs || 0} target</span></dd></div>
    <div><dt>Attended</dt><dd>${e.attended || 0} <span class="muted small">${e.regs ? pct(show) + ' show rate' : ''}</span></dd></div>
    <div><dt>Leads</dt><dd>${e.leads || 0} <span class="muted small">${cpl ? full(cpl) + ' per lead' : ''}</span></dd></div>
    <div><dt>Opportunities</dt><dd>${e.opps || 0} <span class="muted small">${money(e.reportedPipeline)} reported</span></dd></div></dl></div></section>`;
}
function eventFunding(id) {
  const e = E(id), m = M(e.mdfId), cid = e.campaignId || m?.campaignId, c = C(cid), dis = S.canWrite ? '' : 'disabled';
  return `<section class="panel"><div class="panel-h"><h2>Budget and funding</h2></div><div class="panel-b stack" style="gap:10px">
    <p class="small">Budget <b class="num">${full(e.budget)}</b></p>
    <div><span class="eyebrow">MDF</span><p style="margin-top:3px">${m ? `${mRef(e.mdfId)} ${stPill(MDF_ST, m.status)} <span class="num small">${full(m.amount)}</span>` : `<span class="muted small">Not funded yet.</span> <button class="btn sm" data-act="evmdf" data-id="${esc(id)}" ${dis}>Request MDF for this event</button>`}</p></div>
    <div><span class="eyebrow">Promotion campaign</span><p style="margin-top:3px">${c ? cRef(cid) : `<span class="muted small">No campaign yet.</span> <button class="btn sm" data-act="evcamp" data-id="${esc(id)}" ${dis}>Create promotion campaign</button>`}</p></div>
  </div></section>`;
}
function eventPlanPanel(id) {
  const e = E(id), busy = S.busy['evt:' + id];
  return `<section class="panel"><div class="panel-h"><h2>Agenda and promotion</h2><button class="btn sm ai" data-act="evai" data-id="${esc(id)}" ${busy || !S.canWrite ? 'disabled' : ''}>${busy ? 'Planning…' : e.agenda ? 'Redraft with AI' : 'Draft with AI'}</button></div>
    <div class="panel-b stack" style="gap:12px">
      <div class="field"><label for="evAgenda">Run of show</label><textarea class="inp mono" id="evAgenda" data-evf="agenda" rows="${Math.max(4, Math.min(12, (e.agenda || '').split('\n').length + 1))}" placeholder="11:30   Arrival and lunch — Partner" ${S.canWrite ? '' : 'disabled'}>${esc(dv(id + ':agenda', e.agenda || ''))}</textarea></div>
      <div class="field"><label for="evPromo">Promotion plan</label><textarea class="inp mono" id="evPromo" data-evf="promo" rows="${Math.max(4, Math.min(10, (e.promo || '').split('\n').length + 1))}" placeholder="T-28 days   [email] Invite to the partner's customer list" ${S.canWrite ? '' : 'disabled'}>${esc(dv(id + ':promo', e.promo || ''))}</textarea></div>
      <div class="field"><label for="evNotes">Logistics notes</label><textarea class="inp" id="evNotes" data-evf="notes" rows="3" placeholder="Catering headcount, AV, parking, swag, dietary needs, check-in owner…" ${S.canWrite ? '' : 'disabled'}>${esc(dv(id + ':notes', e.notes || ''))}</textarea></div>
      <p class="small muted">Edits save when you click away from a box.</p>
      <div class="row">${S.dl ? `<button class="btn sm" data-act="evdl" data-id="${esc(id)}">Download plan</button>` : ''}<button class="btn sm danger ${S.armed === 'edel-' + id ? 'armed' : ''}" data-act="evdel" data-id="${esc(id)}" style="margin-left:auto" ${S.canWrite ? '' : 'disabled'}>${S.armed === 'edel-' + id ? 'Confirm delete' : 'Delete event'}</button></div>
    </div></section>`;
}
async function aiEventPlan(id) {
  const e = E(id), p = P(e.partnerId) || {}, b = brand();
  await withAI('evt:' + id, async sample => {
    const prompt = `You are a channel field-marketing manager planning a joint event run by a vendor and its partner.\n\nVendor: ${b.vendorName}\nVendor voice: ${b.voice}\nPartner: ${p.name || 'the partner'} (${p.type || ''}${p.region ? ', ' + p.region : ''})\nEvent: ${e.name}\nFormat: ${e.format}\nDate and time: ${e.date} ${e.time || ''}\nVenue or platform: ${e.location || 'TBD'}\nRegistration target: ${e.targetRegs || 'not set'}\nBudget: ${e.budget ? money(e.budget) : 'not set'}${e.notes ? '\nNotes: ' + e.notes : ''}\n\nBuild a realistic run of show for this format (correct length for the format, a speaker slot for each company, a customer or peer element where it fits, a clear next-step close) and a promotion schedule counted back from the event date. Use speaker placeholders like [Partner CTO], never invented names.\n\nReply with only JSON: {"agenda":[{"time":"11:30","item":"what happens","owner":"Partner|Vendor|Both"}],"promo":[{"when":"T-28 days","channel":"email|LinkedIn|phone|field sales","action":"what to send or do"}]}`;
    const r = await sample.json(prompt, {cache:false});
    if (!r || !Array.isArray(r.agenda)) throw {code:'invalid_json'};
    const agenda = r.agenda.map(x => `${String(x.time || '').padEnd(7)} ${x.item || ''}${x.owner ? ' — ' + x.owner : ''}`).join('\n');
    const promo = (r.promo || []).map(x => `${String(x.when || '').padEnd(12)} ${x.channel ? '[' + x.channel + '] ' : ''}${x.action || ''}`).join('\n');
    await write(db => db.doc('events/' + id).update({agenda, promo, updatedAt:now()}), 'Agenda and promotion plan drafted');
  });
}

/* ----- shared form modal ----- */
const opPartnerOpts = () => sortedPartners().map(p => [p.id, p.name]);
const opCampOpts = pid => [['', 'No campaign'], ...vals(S.campaigns).filter(c => !pid || c.partnerId === pid).map(c => [c.id, c.name])];
const opMdfOpts = pid => [['', 'No MDF'], ...vals(S.mdf).filter(m => (!pid || m.partnerId === pid) && m.status !== 'rejected').map(m => [m.id, m.activity + ' · ' + money(m.amount)])];
const OP_FORMS = {
  partner:{title:M => M.id ? 'Edit partner' : 'Add a partner', sub:'Profile, tier and the MDF set aside for them this year.', fields:M => [
    {k:'name', l:'Partner name', req:1, span:2}, {k:'type', l:'Type', t:'select', o:[...new Set([...PARTNER_TYPES, ...(M.v.type ? [M.v.type] : [])])].map(x => [x, x])}, {k:'tier', l:'Tier', t:'select', o:TIERS.map(x => [x, x])},
    {k:'region', l:'Region or state', span:2}, {k:'contact', l:'Primary contact', span:2},
    ...(M.id ? [] : [{k:'stage', l:'Starting stage', t:'select', o:LC.map(s => [s.key, s.name])}]),
    {k:'mdfAllocated', l:'MDF allocated ($)', t:'num'}, {k:'reportedPipeline', l:'Self-reported pipeline ($)', t:'num'}, {k:'joinedAt', l:'Partner since', t:'date'},
    {k:'notes', l:'Notes', t:'area', span:4, ph:'Specialties, verticals, who to talk to'}]},
  mdf:{title:M => M.id ? 'Edit MDF request' : 'New MDF request', sub:'The partner’s ask. It starts as Requested and waits for your decision.', fields:M => [
    {k:'partnerId', l:'Partner', t:'select', o:opPartnerOpts(), req:1, span:2, rr:1}, {k:'kind', l:'Activity type', t:'select', o:[...new Set([...MDF_TYPES, ...(M.v.kind ? [M.v.kind] : [])])].map(x => [x, x])}, {k:'amount', l:'Amount ($)', t:'num', req:1},
    {k:'activity', l:'Activity name', req:1, span:2}, {k:'runDate', l:'Runs on', t:'date', req:1}, {k:'expectedLeads', l:'Expected leads', t:'num'},
    {k:'campaignId', l:'Funds campaign', t:'select', o:opCampOpts(M.v.partnerId), span:2}, {k:'eventId', l:'Pays for event', t:'select', o:[['', 'No event'], ...vals(S.events).filter(e => e.partnerId === M.v.partnerId).map(e => [e.id, e.name])], span:2},
    {k:'description', l:'Description', t:'area', span:4, ph:'What the money pays for and how leads will be captured'}]},
  campaign:{title:M => M.id ? 'Edit campaign brief' : 'New campaign', sub:'The brief drives the AI messaging and content drafts.', fields:M => [
    {k:'name', l:'Campaign name', req:1, span:2}, {k:'partnerId', l:'Partner', t:'select', o:opPartnerOpts(), req:1, span:2},
    ...(M.id ? [{k:'status', l:'Status', t:'select', o:Object.entries(CAMP_ST).map(([k, v]) => [k, v[0]])}] : []), {k:'launchDate', l:'Launch date', t:'date'},
    {k:'goal', l:'Goal', span:M.id ? 2 : 3, ph:'e.g. 40 assessments booked'}, {k:'audience', l:'Target audience', span:2}, {k:'offer', l:'Offer or call to action', span:2},
    {k:'pain', l:'Buyer pain or trigger', t:'area', span:4}]},
  event:{title:M => M.id ? 'Edit event' : 'New event', sub:M => M.id ? 'Changing the date moves every run-sheet due date with it.' : 'A 14-step run sheet is built from the date, counted back six weeks.', fields:M => [
    {k:'name', l:'Event name', req:1, span:2}, {k:'partnerId', l:'Partner', t:'select', o:opPartnerOpts(), req:1, span:2, rr:1},
    {k:'format', l:'Format', t:'select', o:[...new Set([...EVENT_FORMATS, ...(M.v.format ? [M.v.format] : [])])].map(x => [x, x])}, {k:'date', l:'Date', t:'date', req:1}, {k:'time', l:'Time', t:'time'}, ...(M.id ? [{k:'status', l:'Status', t:'select', o:Object.entries(EV_ST).map(([k, v]) => [k, v[0]])}] : [{k:'targetRegs', l:'Registration target', t:'num'}]),
    {k:'location', l:'Venue or platform', span:2}, {k:'budget', l:'Budget ($)', t:'num'}, ...(M.id ? [{k:'targetRegs', l:'Registration target', t:'num'}] : [{k:'blank', t:'gap'}]),
    {k:'campaignId', l:'Campaign', t:'select', o:opCampOpts(M.v.partnerId), span:2}, {k:'mdfId', l:'Funded by MDF', t:'select', o:opMdfOpts(M.v.partnerId), span:2}]},
  results:{title:() => 'Update event results', sub:'Self-reported numbers. Reported pipeline is checked against deals linked to this event.', fields:() => [
    {k:'targetRegs', l:'Registration target', t:'num'}, {k:'regs', l:'Registered', t:'num'}, {k:'attended', l:'Attended', t:'num'}, {k:'leads', l:'Leads', t:'num'},
    {k:'opps', l:'Opportunities', t:'num'}, {k:'reportedPipeline', l:'Reported pipeline ($)', t:'num', span:2}]},
  messaging:{title:() => 'Joint messaging', sub:'One proof point or call to action per line.', fields:() => [
    {k:'tagline', l:'Tagline', span:4}, {k:'positioning', l:'Positioning statement', t:'area', span:4},
    {k:'vendorValue', l:brand().vendorName + ' brings', t:'area', span:2}, {k:'partnerValue', l:'Partner brings', t:'area', span:2}, {k:'jointValue', l:'Together', t:'area', span:4},
    {k:'proofPoints', l:'Proof points', t:'area', span:2}, {k:'ctas', l:'Calls to action', t:'area', span:2}]},
  claim:{title:() => 'Submit MDF claim', sub:'Proof of performance is required before the claim can be paid.', fields:() => [
    {k:'actualLeads', l:'Actual leads', t:'num', req:1}, {k:'proof', l:'Proof of performance', t:'area', req:1, span:4, ph:'Attendee list, campaign report, invoices, screenshots. Describe what was provided.'}]},
  reject:{title:() => 'Reject MDF request', sub:'The reason is saved to the request history.', fields:() => [{k:'note', l:'Reason', t:'area', req:1, span:4}]},
  return:{title:() => 'Return claim', sub:'The request goes back to Approved so the partner can resubmit.', fields:() => [{k:'note', l:'What’s missing', t:'area', req:1, span:4}]},
  program:{title:() => 'Program settings', sub:'Used across the hub: MDF pool, return target, and the brand voice and colors AI drafts follow.', fields:() => [
    {k:'vendorName', l:'Vendor name', span:2}, {k:'fiscalYear', l:'Fiscal year label'}, {k:'mdfPool', l:'MDF pool ($)', t:'num'},
    {k:'roiTarget', l:'Target pipeline per MDF $', t:'num'}, {k:'vendorColor', l:'Vendor color', t:'color'}, {k:'partnerColor', l:'Partner color', t:'color'}, {k:'blank', t:'gap'},
    {k:'voice', l:'Brand voice', t:'area', span:4}]}
};
function opOpen(kind, id, pre = {}) {
  let v = {};
  if (kind === 'partner') v = id ? {...P(id)} : {type:'MSP', tier:'Registered', stage:'recruit', mdfAllocated:15000, joinedAt:today()};
  else if (kind === 'mdf') v = id ? {...M(id), eventId:vals(S.events).find(e => e.mdfId === id)?.id || ''} : {kind:'Event', partnerId:S.focus || '', runDate:addDays(today(), 30), expectedLeads:20};
  else if (kind === 'campaign') v = id ? {...C(id)} : {partnerId:S.focus || '', launchDate:addDays(today(), 21)};
  else if (kind === 'event') v = id ? {...E(id)} : {partnerId:S.focus || '', format:'Lunch & learn', date:addDays(today(), 45), time:'11:30', targetRegs:40, budget:8000};
  else if (kind === 'results') v = {...E(id)};
  else if (kind === 'messaging') { const m = C(id).messaging || {}; v = {...m, proofPoints:(m.proofPoints || []).join('\n'), ctas:(m.ctas || []).join('\n')}; }
  else if (kind === 'claim') v = {actualLeads:M(id).actualLeads ?? '', proof:M(id).proof || ''};
  else if (kind === 'program') { const b = brand(), pg = prog(); v = {vendorName:b.vendorName, voice:b.voice, vendorColor:b.vendorColor, partnerColor:b.partnerColor, mdfPool:pg.mdfPool, fiscalYear:pg.fiscalYear, roiTarget:roiTarget()}; }
  S.opModal = {kind, id:id || '', v:{...v, ...pre}, err:''};
  render(); setTimeout(() => $('.opmodal .inp:not([disabled])')?.focus(), 30);
}
function opModal() {
  const M = S.opModal, F = OP_FORMS[M.kind], fields = F.fields(M), sub = typeof F.sub === 'function' ? F.sub(M) : F.sub;
  const val = k => M.v[k] ?? '';
  const inp = f => {
    const id = 'op_' + f.k, a = `id="${id}" data-of="${f.k}"${f.rr ? ' data-rr="1"' : ''}`;
    if (f.t === 'gap') return '<div aria-hidden="true"></div>';
    const ctl = f.t === 'select' ? `<select class="inp" ${a}>${f.req && !val(f.k) ? '<option value="">Choose…</option>' : ''}${f.o.map(([k, l]) => `<option value="${esc(k)}" ${String(val(f.k)) === String(k) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`
      : f.t === 'area' ? `<textarea class="inp" rows="3" ${a} placeholder="${esc(f.ph || '')}">${esc(val(f.k))}</textarea>`
      : `<input class="inp" type="${f.t === 'num' ? 'number' : f.t === 'date' ? 'date' : f.t === 'time' ? 'time' : f.t === 'color' ? 'color' : 'text'}" ${f.t === 'num' ? 'min="0" step="any" inputmode="decimal"' : ''} ${a} value="${esc(val(f.k))}" placeholder="${esc(f.ph || '')}">`;
    return `<div class="field" style="grid-column:span ${f.span || 1}"><label for="${id}">${esc(f.l)}${f.req ? ' <span aria-hidden="true" style="color:var(--bad)">*</span>' : ''}</label>${ctl}</div>`;
  };
  const del = M.id && (M.kind === 'partner' || M.kind === 'campaign');
  return `<div class="scrim" data-act="opclose-bg"><div class="modal opmodal" role="dialog" aria-modal="true" aria-labelledby="opH" style="max-width:720px">
    <div class="mhead"><div><h2 id="opH">${esc(F.title(M))}</h2><p class="small muted">${esc(sub)}</p></div><button class="btn sm ghost" data-act="opclose" aria-label="Close">✕</button></div>
    <div class="mbody"><div class="fgrid opgrid">${fields.map(inp).join('')}</div>${M.err ? `<p class="small" role="alert" style="color:var(--bad)">${esc(M.err)}</p>` : ''}</div>
    <div class="mfoot">${del ? `<button class="btn danger ${S.armed === 'opdel' ? 'armed' : ''}" data-act="opdel" style="margin-right:auto">${S.armed === 'opdel' ? 'Confirm delete' : 'Delete ' + M.kind}</button>` : ''}<button class="btn" data-act="opclose">Cancel</button><button class="btn primary" data-act="opsave" ${S.canWrite && !M.running ? '' : 'disabled'}>${M.running ? 'Saving…' : M.id || ['claim','reject','return','results','messaging','program'].includes(M.kind) ? 'Save' : 'Create'}</button></div></div></div>`;
}
const numOr = (x, d = 0) => x === '' || x == null || isNaN(+x) ? d : +x;
const hist = (m, action, note) => [...(m.history || []), {action, at:today(), by:meName(), ...(note ? {note} : {})}];
async function opSave() {
  const M = S.opModal, F = OP_FORMS[M.kind], v = M.v;
  const miss = F.fields(M).filter(f => f.req && String(v[f.k] ?? '').trim() === '').map(f => f.l);
  if (miss.length) { M.err = 'Fill in ' + miss.join(', ') + '.'; render(); return; }
  M.running = true; M.err = ''; render();
  const t = now(), id = M.id; let ok = false, go = '';
  const nums = ks => Object.fromEntries(ks.map(k => [k, numOr(v[k])]));
  if (M.kind === 'partner') {
    const doc = {name:v.name.trim(), type:v.type, tier:v.tier, region:v.region || '', contact:v.contact || '', joinedAt:v.joinedAt || today(), notes:v.notes || '', ...nums(['mdfAllocated','reportedPipeline']), updatedAt:t};
    if (id) ok = await write(db => db.doc('partners/' + id).update(doc), 'Partner saved');
    else { const nid = 'p-' + (v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'partner') + '-' + Date.now().toString(36).slice(-3); go = nid;
      ok = await write(db => db.doc('partners/' + nid).set({...doc, stage:v.stage || 'recruit', checks:{}, stageHistory:[{stage:v.stage || 'recruit', at:t}], portalKey:'', portalName:'', deskContactId:'', deskName:'', createdAt:t}), 'Partner added'); }
  }
  else if (M.kind === 'mdf') {
    const doc = {partnerId:v.partnerId, kind:v.kind, activity:v.activity.trim(), runDate:v.runDate, description:v.description || '', campaignId:v.campaignId || '', ...nums(['amount','expectedLeads']), updatedAt:t};
    const nid = id || newId('m-'); if (!id) go = nid;
    ok = await write(async db => {
      if (id) await db.doc('mdf/' + id).update(doc);
      else await db.doc('mdf/' + nid).set({...doc, status:'requested', requestedAt:today(), actualLeads:null, proof:'', history:[{action:'Requested', at:today(), by:meName()}], createdAt:t});
      const prev = vals(S.events).find(e => e.mdfId === nid);
      if (prev && prev.id !== v.eventId) await db.doc('events/' + prev.id).update({mdfId:'', updatedAt:t});
      if (v.eventId && E(v.eventId)?.mdfId !== nid) await db.doc('events/' + v.eventId).update({mdfId:nid, updatedAt:t});
    }, id ? 'MDF request saved' : 'MDF request created. It’s waiting for your decision.');
  }
  else if (M.kind === 'campaign') {
    const doc = {name:v.name.trim(), partnerId:v.partnerId, goal:v.goal || '', audience:v.audience || '', offer:v.offer || '', pain:v.pain || '', launchDate:v.launchDate || '', updatedAt:t, ...(id ? {status:v.status} : {})};
    const nid = id || newId('c-'); if (!id) go = nid;
    ok = await write(async db => {
      if (id) await db.doc('campaigns/' + id).update(doc);
      else await db.doc('campaigns/' + nid).set({...doc, status:'planning', messaging:{}, thread:[], createdAt:t});
      if (v.eventId) await db.doc('events/' + v.eventId).update({campaignId:nid, updatedAt:t});
      if (v.mdfId && !M_(v.mdfId)?.campaignId) await db.doc('mdf/' + v.mdfId).update({campaignId:nid, updatedAt:t});
    }, id ? 'Campaign saved' : 'Campaign created');
  }
  else if (M.kind === 'event') {
    const doc = {name:v.name.trim(), partnerId:v.partnerId, format:v.format, date:v.date, time:v.time || '', location:v.location || '', campaignId:v.campaignId || '', mdfId:v.mdfId || '', ...nums(['budget','targetRegs']), updatedAt:t, ...(id ? {status:v.status} : {})};
    const nid = id || newId('e-'); if (!id) go = nid;
    ok = await write(db => id ? db.doc('events/' + id).update(doc) : db.doc('events/' + nid).set({...doc, status:'planning', regs:0, attended:0, leads:0, opps:0, reportedPipeline:0, agenda:'', promo:'', notes:'', tasks:buildTasks(v.format), createdAt:t}), id ? 'Event saved' : 'Event created with a 14-step run sheet');
  }
  else if (M.kind === 'results') ok = await write(db => db.doc('events/' + id).update({...nums(['targetRegs','regs','attended','leads','opps','reportedPipeline']), updatedAt:t}), 'Results saved');
  else if (M.kind === 'messaging') {
    const lines = s => String(s || '').split('\n').map(x => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
    ok = await write(db => db.doc('campaigns/' + id).update({messaging:{positioning:v.positioning || '', tagline:v.tagline || '', vendorValue:v.vendorValue || '', partnerValue:v.partnerValue || '', jointValue:v.jointValue || '', proofPoints:lines(v.proofPoints), ctas:lines(v.ctas), draftedBy:'you', draftedAt:t}, updatedAt:t}), 'Joint messaging saved');
  }
  else if (M.kind === 'claim') { const m = M_(id); ok = await write(db => db.doc('mdf/' + id).update({status:'claimed', actualLeads:numOr(v.actualLeads), proof:v.proof.trim(), history:hist(m, 'Claim submitted'), updatedAt:t}), 'Claim submitted. Mark it paid once the proof checks out.'); }
  else if (M.kind === 'reject') { const m = M_(id); ok = await write(db => db.doc('mdf/' + id).update({status:'rejected', history:hist(m, 'Rejected', v.note.trim()), updatedAt:t}), 'Request rejected'); }
  else if (M.kind === 'return') { const m = M_(id); ok = await write(db => db.doc('mdf/' + id).update({status:'approved', history:hist(m, 'Claim returned', v.note.trim()), updatedAt:t}), 'Claim returned to the partner'); }
  else if (M.kind === 'program') {
    ok = await write(async db => {
      await db.doc('settings/brand').set({...(S.settings.brand || {}), vendorName:v.vendorName || 'Vendor', voice:v.voice || '', vendorColor:v.vendorColor, partnerColor:v.partnerColor});
      await db.doc('settings/program').set({...(S.settings.program || {}), mdfPool:numOr(v.mdfPool), fiscalYear:v.fiscalYear || '', roiTarget:numOr(v.roiTarget, 10) || 10});
    }, 'Program settings saved');
  }
  if (ok) { S.opModal = null; S.armed = null; if (go) location.hash = go; else render(); }
  else { M.running = false; render(); }
}
const M_ = id => S.mdf[id];
async function opDelete() {
  const Mo = S.opModal;
  if (S.armed !== 'opdel') { S.armed = 'opdel'; render(); setTimeout(() => { if (S.armed === 'opdel') { S.armed = null; render(); } }, 4000); return; }
  S.armed = null;
  const id = Mo.id, coll = Mo.kind === 'partner' ? 'partners' : 'campaigns';
  const ok = await write(async db => {
    await db.doc(coll + '/' + id).delete();
    if (coll === 'campaigns') {
      for (const m of vals(S.mdf).filter(x => x.campaignId === id)) await db.doc('mdf/' + m.id).update({campaignId:''});
      for (const e of vals(S.events).filter(x => x.campaignId === id)) await db.doc('events/' + e.id).update({campaignId:''});
    }
  }, Mo.kind === 'partner' ? 'Partner removed. Their deals, MDF and contacts stay on file.' : 'Campaign deleted. Linked MDF and events stay.');
  if (ok) { S.opModal = null; location.hash = coll === 'partners' ? 'partners' : 'campaigns'; }
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id, pid = b.dataset.pid;
  const known = ['opopen','opclose','opclose-bg','opsave','opdel','opsettings','lcview','lcadvance','lcback','mdfapprove','mdfpaid','mdfdel','msgai','cmtpost','evtasks','evowner','evtaskadd','evmdf','evcamp','evai','evdl','evdel','opnew'];
  if (!known.includes(act)) return;
  if (act === 'opopen') opOpen(b.dataset.kind, id || '');
  else if (act === 'opnew') opOpen(b.dataset.kind, '', {...(b.dataset.pid ? {partnerId:b.dataset.pid} : {}), ...(b.dataset.camp ? {campaignId:b.dataset.camp} : {})});
  else if (act === 'opsettings') opOpen('program');
  else if (act === 'opclose' || (act === 'opclose-bg' && e.target === b)) { if (S.opModal?.running) return; S.opModal = null; S.armed = null; render(); }
  else if (act === 'opsave') opSave();
  else if (act === 'opdel') opDelete();
  else if (act === 'lcview') { S.lcView = S.lcView || {}; S.lcView[pid] = +b.dataset.i; render(); }
  else if (act === 'lcadvance' || act === 'lcback') {
    const p = S.partners[pid], i = lcIdx(p) + (act === 'lcadvance' ? 1 : -1); if (i < 0 || i >= LC.length) return;
    const st = LC[i].key;
    if (await write(db => db.doc('partners/' + pid).update({stage:st, stageHistory:[...(p.stageHistory || []), {stage:st, at:now()}], updatedAt:now()}), `${p.name} moved to ${LC[i].name}`)) { if (S.lcView) delete S.lcView[pid]; }
  }
  else if (act === 'mdfapprove' || act === 'mdfpaid') {
    const m = S.mdf[id], st = act === 'mdfapprove' ? 'approved' : 'paid';
    await write(db => db.doc('mdf/' + id).update({status:st, history:hist(m, st === 'approved' ? 'Approved' : 'Paid'), updatedAt:now()}), st === 'approved' ? `Approved ${full(m.amount)} for ${pName(m.partnerId)}` : 'Marked paid');
  }
  else if (act === 'mdfdel') {
    if (S.armed !== 'mdel-' + id) { S.armed = 'mdel-' + id; render(); setTimeout(() => { if (S.armed === 'mdel-' + id) { S.armed = null; render(); } }, 4000); return; }
    S.armed = null;
    if (await write(async db => { await db.doc('mdf/' + id).delete(); for (const ev of vals(S.events).filter(x => x.mdfId === id)) await db.doc('events/' + ev.id).update({mdfId:''}); }, 'MDF request deleted')) location.hash = 'mdf';
  }
  else if (act === 'msgai') aiMessaging(id);
  else if (act === 'cmtpost') {
    const ta = $('#cmtText'), text = ta?.value.trim(); if (!text) { ta?.focus(); return; }
    if (await write(db => db.doc('campaigns/' + id).update({thread:[...(S.campaigns[id].thread || []), {by:meName(), at:now(), text}], updatedAt:now()}), 'Note posted')) { dclr(id + ':cmt'); const t = $('#cmtText'); if (t) t.value = ''; render(); }
  }
  else if (act === 'evtasks') await write(db => db.doc('events/' + id).update({tasks:buildTasks(S.events[id].format), updatedAt:now()}), 'Run sheet built');
  else if (act === 'evowner') { const ts = (S.events[id].tasks || []).slice(), i = +b.dataset.i; ts[i] = {...ts[i], owner:ts[i].owner === 'vendor' ? 'partner' : 'vendor'}; await write(db => db.doc('events/' + id).update({tasks:ts, updatedAt:now()})); }
  else if (act === 'evtaskadd') {
    const l = $('#evTaskLabel')?.value.trim(), due = $('#evTaskDue')?.value, owner = $('#evTaskOwner')?.value || 'partner', ev = S.events[id];
    if (!l || !due) { toast('Give the task a name and a due date.'); $('#evTaskLabel')?.focus(); return; }
    if (await write(db => db.doc('events/' + id).update({tasks:[...(ev.tasks || []), {id:newId('t'), label:l, due, offset:ev.date ? days(ev.date, due) : 0, owner, done:false, custom:true}], updatedAt:now()}), 'Task added')) { dclr(id + ':task'); const x = $('#evTaskLabel'); if (x) x.value = ''; render(); }
  }
  else if (act === 'evmdf') { const ev = S.events[id]; opOpen('mdf', '', {partnerId:ev.partnerId, kind:isVirtual(ev.format) ? 'Webinar' : 'Event', activity:ev.name, amount:ev.budget || '', runDate:ev.date, expectedLeads:Math.round((ev.targetRegs || 0) * .6), campaignId:ev.campaignId || '', eventId:id}); }
  else if (act === 'evcamp') { const ev = S.events[id]; opOpen('campaign', '', {partnerId:ev.partnerId, name:'Promote: ' + ev.name, goal:(ev.targetRegs || 40) + ' registrations', audience:'', offer:'Register for the ' + (ev.format || 'event').toLowerCase(), launchDate:addDays(ev.date, -28), eventId:id, mdfId:ev.mdfId || ''}); }
  else if (act === 'evai') aiEventPlan(id);
  else if (act === 'evdl') {
    const ev = S.events[id], tasks = (ev.tasks || []).map(t => ({...t, due:taskDue(ev, t)})).sort((a, b) => a.due.localeCompare(b.due));
    const md = `# ${ev.name}\n\n${ev.format || ''} · ${fdate(ev.date)} ${ev.time || ''} · ${ev.location || ''}\nPartner: ${pName(ev.partnerId)} · Budget ${full(ev.budget)} · Target ${ev.targetRegs || 0} registrations\n\n## Agenda\n\n${ev.agenda || '_Not drafted yet._'}\n\n## Promotion plan\n\n${ev.promo || '_Not drafted yet._'}\n\n## Logistics\n\n${ev.notes || '_None._'}\n\n## Run sheet\n\n${tasks.map(t => `- [${t.done ? 'x' : ' '}] ${t.due} · ${t.label} (${t.owner === 'vendor' ? brand().vendorName : 'Partner'})`).join('\n')}\n`;
    try { await S.dl.save({filename:(ev.name || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-plan.md', data:new Blob([md], {type:'text/markdown'})}); } catch (x) { toast('Download didn’t start. Try again.'); }
  }
  else if (act === 'evdel') {
    if (S.armed !== 'edel-' + id) { S.armed = 'edel-' + id; render(); setTimeout(() => { if (S.armed === 'edel-' + id) { S.armed = null; render(); } }, 4000); return; }
    S.armed = null; if (await write(db => db.doc('events/' + id).delete(), 'Event deleted. Linked MDF and campaigns stay.')) location.hash = 'events';
  }
});
document.addEventListener('input', e => {
  const el = e.target, r = route(); S.opDraft = S.opDraft || {};
  if (el.dataset?.of && S.opModal) S.opModal.v[el.dataset.of] = el.value;
  else if (el.dataset?.evf) S.opDraft[r + ':' + el.dataset.evf] = el.value;
  else if (el.id === 'cmtText') S.opDraft[r + ':cmt'] = el.value;
  else if (el.id === 'evTaskLabel') S.opDraft[r + ':task'] = el.value;
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset?.of && S.opModal) {
    S.opModal.v[el.dataset.of] = el.value;
    if (el.dataset.rr) { if (S.opModal.kind === 'mdf') { S.opModal.v.campaignId = ''; S.opModal.v.eventId = ''; } if (S.opModal.kind === 'event') { S.opModal.v.campaignId = ''; S.opModal.v.mdfId = ''; } render(); }
  }
  else if (el.dataset?.campst) { const id = el.dataset.campst; await write(db => db.doc('campaigns/' + id).update({status:el.value, updatedAt:now()}), 'Status: ' + CAMP_ST[el.value][0]); }
  else if (el.dataset?.lcchk) { const pid = el.dataset.pid, p = S.partners[pid]; await write(db => db.doc('partners/' + pid).update({checks:{...(p.checks || {}), [el.dataset.lcchk]:el.checked}, updatedAt:now()})); }
  else if (el.dataset?.evtask != null && el.dataset.id) { const id = el.dataset.id, ts = (S.events[id].tasks || []).slice(), i = +el.dataset.evtask; ts[i] = {...ts[i], done:el.checked}; await write(db => db.doc('events/' + id).update({tasks:ts, updatedAt:now()})); }
  else if (el.dataset?.evf) { const id = route(), f = el.dataset.evf; if (S.events[id] && (S.events[id][f] || '') !== el.value) { if (await write(db => db.doc('events/' + id).update({[f]:el.value, updatedAt:now()}), 'Saved')) dclr(id + ':' + f); } else dclr(id + ':' + f); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.opModal && !S.opModal.running) { S.opModal = null; S.armed = null; render(); } });
