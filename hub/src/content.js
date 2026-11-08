/* ---------- Content studio: brainstorm, create, design, stage and approve ---------- */
const A = id => S.assets[id];
const ASSET_TYPES = ['Social graphic','LinkedIn post','Email','Blog post','One-pager','Webinar invite','Event invite','Case study'];
const GRAPHIC_TYPES = new Set(['Social graphic','One-pager','Webinar invite','Event invite','LinkedIn post']);
const STAGES_C = [
  ['idea','Ideas',''], ['draft','Draft',''], ['review','In review','warn'], ['changes','Changes requested','bad'],
  ['approved','Approved','ok'], ['scheduled','Scheduled','camp'], ['published','Published','pipe']
];
const STAGE_C = Object.fromEntries(STAGES_C.map((s, i) => [s[0], {label:s[1], cls:s[2], i}]));
const SIZES = {li:['LinkedIn / social 1200×627',1200,627], sq:['Square post 1080×1080',1080,1080], story:['Story 1080×1920',1080,1920], page:['One-pager 816×1056',816,1056]};
const LAYOUTS = {split:'Split panel', center:'Centered', band:'Bold band'};
const CONTENT_TABS = [['content','Board'],['brainstorm','Brainstorm']];
const brand = () => ({vendorName:'Northwind Cloud', vendorColor:'#2442C9', partnerColor:'#D98A1F', voice:'Plainspoken, confident, outcome-first. No hype or jargon. Give the partner visible credit.', ...(S.settings.brand || {})});
const roleName = r => r === 'vendor' ? brand().vendorName : 'Partner';
const who = by => by && S.uid && by === S.uid ? 'You' : by === 'ai' ? 'Claude' : by === 'sample' ? 'Example reviewer' : 'A teammate';
const now = () => new Date().toISOString();
const stagePillC = k => { const s = STAGE_C[k] || {label:k, cls:''}; return `<span class="pill ${s.cls}">${esc(s.label)}</span>`; };
const aRef = id => A(id) ? ref(id, 'camp', A(id).title || 'Untitled') : '<span class="muted">Removed</span>';
const campsOf = a => (a.campaignIds || []).filter(C);
const sortedPartners = () => vals(S.partners).sort((x, y) => x.name.localeCompare(y.name, 'en', {sensitivity:'base'}));
const sortedCamps = pid => vals(S.campaigns).sort((x, y) => ((y.partnerId === pid) - (x.partnerId === pid)) || x.name.localeCompare(y.name));
const histAdd = (a, action) => [...(a.history || []), {at:now(), by:S.uid || '', action}].slice(-40);
const aiCopy = code => ({not_granted:'AI assist was declined for this page. You can still write and design by hand.', rate_limited:'Too many AI requests at once. Wait a moment and try again.', sampling_disabled:'AI assist is turned off for this account.', cancelled:'Stopped.', invalid_json:'Claude’s answer came back in the wrong shape. Try again.', refused:'Claude declined that request. Try a different direction.'})[code] || 'Claude couldn’t finish that. Try again.';

/* ----- graphic design: template renderer (always available) ----- */
const xmlEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function wrapText(text, maxChars, maxLines) {
  const words = String(text || '').split(/\s+/).filter(Boolean), lines = [];
  let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { const l = lines.slice(0, maxLines); l[maxLines - 1] = l[maxLines - 1].replace(/\s*\S*$/, '') + '…'; return l; }
  return lines;
}
function templateSVG(a) {
  const b = brand(), p = P(a.partnerId), [, W, H] = SIZES[a.size] || SIZES.li;
  const V = b.vendorColor, Pc = b.partnerColor, ink = '#111827', F = 'font-family="Helvetica Neue, Helvetica, Arial, sans-serif"';
  const head = a.headline || a.title || 'Your headline here', sub = a.subhead || '', cta = a.cta || 'Learn more';
  const lock = `${b.vendorName} × ${p ? p.name : 'Partner'}`;
  const s = Math.min(W, H) / 627, L = a.layout || 'split';
  let body = '';
  if (L === 'split') {
    const pw = W * .42, tx = pw + 60 * s, tw = W - tx - 60 * s, hs = 54 * s, cpl = Math.max(10, Math.floor(tw / (hs * .52)));
    const hl = wrapText(head, cpl, 4), sl = wrapText(sub, Math.floor(tw / (22 * s * .5)), 3);
    body = `<rect width="${W}" height="${H}" fill="#FFFFFF"/><rect width="${pw}" height="${H}" fill="${V}"/>
      <circle cx="${pw * .5}" cy="${H * .48}" r="${Math.min(pw, H) * .3}" fill="none" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="${10 * s}"/>
      <circle cx="${pw * .5}" cy="${H * .48}" r="${Math.min(pw, H) * .18}" fill="${Pc}"/>
      <path d="M${pw * .5} ${H * .48 - Math.min(pw, H) * .3} A${Math.min(pw, H) * .3} ${Math.min(pw, H) * .3} 0 0 1 ${pw * .5 + Math.min(pw, H) * .3} ${H * .48}" fill="none" stroke="#FFFFFF" stroke-width="${10 * s}" stroke-linecap="round"/>
      <rect x="${pw}" y="0" width="${8 * s}" height="${H}" fill="${Pc}"/>
      <text x="${tx}" y="${H * .2}" ${F} font-size="${17 * s}" font-weight="700" letter-spacing="${1.5 * s}" fill="${Pc}">${xmlEsc(lock.toUpperCase())}</text>
      ${hl.map((l, i) => `<text x="${tx}" y="${H * .2 + 70 * s + i * hs * 1.08}" ${F} font-size="${hs}" font-weight="800" fill="${ink}">${xmlEsc(l)}</text>`).join('')}
      ${sl.map((l, i) => `<text x="${tx}" y="${H * .2 + 70 * s + hl.length * hs * 1.08 + 18 * s + i * 30 * s}" ${F} font-size="${22 * s}" fill="#4B5563">${xmlEsc(l)}</text>`).join('')}
      <rect x="${tx}" y="${H - 120 * s}" rx="${26 * s}" width="${Math.min(tw, (cta.length * 12 + 56) * s)}" height="${52 * s}" fill="${V}"/>
      <text x="${tx + 28 * s}" y="${H - 87 * s}" ${F} font-size="${20 * s}" font-weight="700" fill="#FFFFFF">${xmlEsc(cta)}</text>`;
  } else if (L === 'center') {
    const hs = 62 * s, cpl = Math.max(10, Math.floor(W * .78 / (hs * .52))), hl = wrapText(head, cpl, 4), sl = wrapText(sub, Math.floor(W * .7 / (24 * s * .5)), 3);
    const top = H / 2 - (hl.length * hs * 1.08 + sl.length * 32 * s) / 2;
    body = `<rect width="${W}" height="${H}" fill="${V}"/>
      <circle cx="${W * .92}" cy="${H * .08}" r="${H * .32}" fill="${Pc}" fill-opacity=".9"/><circle cx="${W * .06}" cy="${H * .98}" r="${H * .2}" fill="#FFFFFF" fill-opacity=".1"/>
      <text x="${W / 2}" y="${top - 30 * s}" text-anchor="middle" ${F} font-size="${17 * s}" font-weight="700" letter-spacing="${1.5 * s}" fill="#FFFFFF" fill-opacity=".85">${xmlEsc(lock.toUpperCase())}</text>
      ${hl.map((l, i) => `<text x="${W / 2}" y="${top + hs + i * hs * 1.08}" text-anchor="middle" ${F} font-size="${hs}" font-weight="800" fill="#FFFFFF">${xmlEsc(l)}</text>`).join('')}
      ${sl.map((l, i) => `<text x="${W / 2}" y="${top + hs + hl.length * hs * 1.08 + 16 * s + i * 32 * s}" text-anchor="middle" ${F} font-size="${24 * s}" fill="#FFFFFF" fill-opacity=".9">${xmlEsc(l)}</text>`).join('')}
      <rect x="${W / 2 - (cta.length * 12 + 56) * s / 2}" y="${H - 110 * s}" rx="${26 * s}" width="${(cta.length * 12 + 56) * s}" height="${52 * s}" fill="#FFFFFF"/>
      <text x="${W / 2}" y="${H - 77 * s}" text-anchor="middle" ${F} font-size="${20 * s}" font-weight="700" fill="${V}">${xmlEsc(cta)}</text>`;
  } else {
    const bh = H * .58, hs = 58 * s, cpl = Math.max(10, Math.floor(W * .84 / (hs * .52))), hl = wrapText(head, cpl, 3), sl = wrapText(sub, Math.floor(W * .84 / (24 * s * .5)), 2);
    body = `<rect width="${W}" height="${H}" fill="#F8F7F4"/><rect width="${W}" height="${bh}" fill="${ink}"/>
      <rect x="0" y="${bh}" width="${W}" height="${14 * s}" fill="${Pc}"/><rect x="0" y="${bh + 14 * s}" width="${W * .35}" height="${14 * s}" fill="${V}"/>
      <text x="${60 * s}" y="${70 * s}" ${F} font-size="${17 * s}" font-weight="700" letter-spacing="${1.5 * s}" fill="${Pc}">${xmlEsc(lock.toUpperCase())}</text>
      ${hl.map((l, i) => `<text x="${60 * s}" y="${bh - (hl.length - i) * hs * 1.08 + hs * .5}" ${F} font-size="${hs}" font-weight="800" fill="#FFFFFF">${xmlEsc(l)}</text>`).join('')}
      ${sl.map((l, i) => `<text x="${60 * s}" y="${bh + 80 * s + i * 32 * s}" ${F} font-size="${24 * s}" fill="${ink}">${xmlEsc(l)}</text>`).join('')}
      <text x="${60 * s}" y="${H - 50 * s}" ${F} font-size="${22 * s}" font-weight="700" fill="${V}">${xmlEsc(cta)} →</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`;
}
function cleanSVG(t, W, H) {
  const m = String(t || '').match(/<svg[\s\S]*<\/svg>/i); if (!m) return '';
  const doc = new DOMParser().parseFromString(m[0], 'image/svg+xml');
  const svg = doc.documentElement; if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return '';
  svg.querySelectorAll('script,foreignObject,iframe,image,use,a,style,animate,set,animateTransform,animateMotion').forEach(n => n.remove());
  svg.querySelectorAll('*').forEach(el => [...el.attributes].forEach(at => { const n = at.name.toLowerCase(), v = at.value; if (n.startsWith('on') || n === 'href' || n === 'xlink:href' || /url\((?!\s*#)/i.test(v) || /javascript:/i.test(v)) el.removeAttribute(at.name); }));
  [...svg.attributes].forEach(at => { if (at.name.toLowerCase().startsWith('on')) svg.removeAttribute(at.name); });
  if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); svg.setAttribute('width', W); svg.setAttribute('height', H);
  const out = new XMLSerializer().serializeToString(svg);
  return out.length > 60000 ? '' : out;
}
const designOf = a => (a.design === 'ai' && a.svg) ? a.svg : templateSVG(a);
const svgSrc = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

/* ----- AI helpers ----- */
function aiContext(pid, cids) {
  const b = brand(), p = P(pid);
  const cs = (cids || []).map(C).filter(Boolean);
  return `Vendor: ${b.vendorName}. Brand voice: ${b.voice}
Partner: ${p ? `${p.name} (${p.type}, ${p.tier} tier, ${p.region})` : 'not chosen yet'}.
${cs.length ? cs.map(c => `Campaign "${c.name}": audience ${c.audience || 'n/a'}; offer ${c.offer || 'n/a'}; goal ${c.goal || 'n/a'}${c.messaging ? `; positioning ${c.messaging.positioning || ''}; tagline ${c.messaging.tagline || ''}; proof points ${(c.messaging.proofPoints || []).join(' | ')}` : ''}.`).join('\n') : 'No campaign chosen.'}`;
}
async function withAI(key, fn) {
  if (!S.ai) { toast('AI assist isn’t available in this view. You can still create content by hand.'); return; }
  S.busy[key] = true; render();
  try { await fn(S.ai); }
  catch (e) { if (e?.code === 'not_granted' || e?.code === 'sampling_disabled') S.aiOff = true; toast(aiCopy(e?.code)); }
  finally { delete S.busy[key]; render(); }
}

/* ----- writes ----- */
async function saveAsset(id, patch, ok) { return write(db => db.doc('assets/' + id).update({...patch, updatedAt:now()}), ok); }
async function createAsset(data, go = true) {
  const id = 'a-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const a = {title:'Untitled', type:'Social graphic', stage:'draft', partnerId:'', campaignIds:[], brief:'', headline:'', subhead:'', body:'', cta:'', channel:'',
    size:'li', layout:'split', design:'template', svg:'', designs:[], approvals:{vendor:null, partner:null}, comments:[], schedule:null,
    createdAt:now(), updatedAt:now(), createdBy:S.uid || '', ...data};
  a.history = [{at:now(), by:S.uid || '', action:a.stage === 'idea' ? 'Saved as idea' : 'Created'}];
  const ok = await write(db => db.doc('assets/' + id).set(a), a.stage === 'idea' ? 'Idea saved' : 'Draft created');
  if (ok && go) location.hash = id;
  return ok ? id : null;
}

/* ----- views ----- */
function contentHead(cur, sub) {
  const label = CONTENT_TABS.find(t => t[0] === cur)[1];
  const n = {content:Object.keys(S.assets).length, brainstorm:vals(S.assets).filter(a => a.stage === 'idea').length};
  return `${crumbs(['Home','home'], ...(cur === 'content' ? [['Content']] : [['Content','content'], [label]]))}
  <div class="phead"><div><h1>Content studio${cur === 'content' ? '' : ' · ' + esc(label)}</h1><p class="sub">${sub}</p></div><div class="row"><button class="btn primary" data-act="newasset">New content</button></div></div>
  <nav class="subtabs" aria-label="Content views">${CONTENT_TABS.map(([k, l]) => `<a href="#${k}" ${k === cur ? 'aria-current="page"' : ''}>${l}<span class="n">${n[k]}</span></a>`).join('')}</nav>`;
}
const cf = () => S.cfilter || (S.cfilter = {partner:'', campaign:'', type:'', wait:''});
function assetMatch(a) {
  const f = cf();
  if (f.partner && a.partnerId !== f.partner) return false;
  if (f.campaign && !(a.campaignIds || []).includes(f.campaign)) return false;
  if (f.type && a.type !== f.type) return false;
  if (f.wait && !(a.stage === 'review' && !(a.approvals || {})[f.wait])) return false;
  return true;
}
function thumb(a, cls = 'thumb') { return GRAPHIC_TYPES.has(a.type) || a.design === 'ai' ? `<img class="${cls}" src="${svgSrc(designOf(a))}" alt="" loading="lazy">` : `<div class="${cls} textthumb"><b>${esc(a.headline || a.title)}</b><span>${esc((a.body || a.brief || '').slice(0, 90))}</span></div>`; }
function apprBadges(a) {
  const ap = a.approvals || {};
  return `<span class="appr-b ${ap.vendor ? 'on' : ''}" title="${esc(roleName('vendor'))} ${ap.vendor ? 'approved' : 'not yet approved'}">${ap.vendor ? '✓' : '○'} V</span><span class="appr-b ${ap.partner ? 'on' : ''}" title="Partner ${ap.partner ? 'approved' : 'not yet approved'}">${ap.partner ? '✓' : '○'} P</span>`;
}
function vContent() {
  const all = vals(S.assets), list = all.filter(assetMatch), f = cf();
  const waitV = all.filter(a => a.stage === 'review' && !(a.approvals || {}).vendor).length, waitP = all.filter(a => a.stage === 'review' && !(a.approvals || {}).partner).length;
  const sel = (id, key, label, opts) => `<div class="field"><label for="${id}">${label}</label><select class="inp" id="${id}" data-cf="${key}">${opts}</select></div>`;
  return `${contentHead('content', 'Brainstorm, write and design co-branded content with AI help, assign it to partners and campaigns, and move it through review and approval.')}
  <div class="kpis">
    <div class="kpi camp"><span class="eyebrow">In progress</span><span class="v num">${all.filter(a => ['draft','changes'].includes(a.stage)).length}</span><span class="s">${all.filter(a => a.stage === 'idea').length} ideas waiting</span></div>
    <div class="kpi"><span class="eyebrow">In review</span><span class="v num" style="color:var(--warn)">${all.filter(a => a.stage === 'review').length}</span><span class="s"><button class="linkbtn" data-act="cwait" data-val="vendor">${waitV} need ${esc(brand().vendorName)}</button> · <button class="linkbtn" data-act="cwait" data-val="partner">${waitP} need partner</button></span></div>
    <div class="kpi pipe"><span class="eyebrow">Approved and scheduled</span><span class="v num">${all.filter(a => ['approved','scheduled'].includes(a.stage)).length}</span><span class="s">${all.filter(a => a.stage === 'scheduled').length} scheduled</span></div>
    <div class="kpi"><span class="eyebrow">Published</span><span class="v num">${all.filter(a => a.stage === 'published').length}</span><span class="s">across ${new Set(all.filter(a => a.stage === 'published').map(a => a.partnerId)).size} partners</span></div>
  </div>
  <section class="panel cfilters"><div class="panel-b fbar">
    ${sel('cfPartner', 'partner', 'Partner', `<option value="">All partners</option>${sortedPartners().map(p => `<option value="${esc(p.id)}" ${f.partner === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}`)}
    ${sel('cfCamp', 'campaign', 'Campaign', `<option value="">All campaigns</option>${vals(S.campaigns).sort((x, y) => x.name.localeCompare(y.name)).map(c => `<option value="${esc(c.id)}" ${f.campaign === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}`)}
    ${sel('cfType', 'type', 'Format', `<option value="">All formats</option>${ASSET_TYPES.map(t => `<option ${f.type === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}`)}
    ${sel('cfWait', 'wait', 'Waiting on', `<option value="">Anyone</option><option value="vendor" ${f.wait === 'vendor' ? 'selected' : ''}>${esc(brand().vendorName)} approval</option><option value="partner" ${f.wait === 'partner' ? 'selected' : ''}>Partner approval</option>`)}
    <button class="btn" data-act="cfclear" style="align-self:flex-end" ${Object.values(f).some(Boolean) ? '' : 'disabled'}>Clear filters</button>
  </div></section>
  <div class="boardwrap"><div class="cboard">${STAGES_C.map(([k, label]) => {
    const cs = list.filter(a => (a.stage || 'draft') === k).sort((x, y) => (y.updatedAt || '').localeCompare(x.updatedAt || ''));
    return `<section class="col" data-cstage="${k}" aria-label="${label}"><div class="colhead"><div class="t"><h3>${label}</h3><span class="num small">${cs.length}</span></div></div>
      <div class="cards">${cs.map(a => `<a class="ccard" href="#${esc(a.id)}">${thumb(a)}<b>${esc(a.title || 'Untitled')}</b>
        <span class="small muted">${esc(a.type)} · ${a.partnerId ? esc(pName(a.partnerId)) : '<i>No partner</i>'}</span>
        ${campsOf(a).length ? `<span class="cchips">${campsOf(a).map(c => `<span class="cchip">${esc(C(c).name)}</span>`).join('')}</span>` : ''}
        <span class="meta">${['review','approved','scheduled','published'].includes(a.stage) ? apprBadges(a) : '<span></span>'}${a.schedule?.date ? `<span class="small num">${fdate(a.schedule.date)}</span>` : ''}${ex(a)}</span></a>`).join('') || '<p class="small muted" style="padding:6px">Nothing here</p>'}</div></section>`;
  }).join('')}</div></div>`;
}

function vBrainstorm() {
  const bs = S.bs || (S.bs = {partnerId:'', campaignIds:[], format:'', angle:'', count:5, ideas:[]});
  const camps = sortedCamps(bs.partnerId);
  const saved = vals(S.assets).filter(a => a.stage === 'idea').sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || ''));
  const busy = S.busy.brainstorm;
  return `${contentHead('brainstorm', 'Ask Claude for content ideas built from the partner, its campaigns and your brand voice. Keep the good ones as ideas or turn them straight into drafts.')}
  <div class="grid-main">
    <div class="stack">
      <section class="panel"><div class="panel-h"><h2>Brainstorm with AI</h2>${S.ai && !S.aiOff ? '' : '<span class="pill warn">AI unavailable here</span>'}</div>
        <form class="panel-b stack" id="bsForm" style="gap:12px">
          <div class="grid2" style="gap:12px">
            <div class="field"><label for="bsPartner">Partner account</label><select class="inp" id="bsPartner" data-bs="partnerId"><option value="">Choose a partner…</option>${sortedPartners().map(p => `<option value="${esc(p.id)}" ${bs.partnerId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
            <div class="field"><label for="bsFormat">Format</label><select class="inp" id="bsFormat" data-bs="format"><option value="">Any format</option>${ASSET_TYPES.map(t => `<option ${bs.format === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
          </div>
          <fieldset class="campset"><legend>Campaigns <span class="muted small">(choose any)</span></legend>${camps.length ? camps.map(c => `<label class="check"><input type="checkbox" data-bscamp="${esc(c.id)}" ${bs.campaignIds.includes(c.id) ? 'checked' : ''}> ${esc(c.name)} <span class="muted small">· ${esc(pName(c.partnerId))}</span></label>`).join('') : '<span class="muted small">No campaigns yet.</span>'}</fieldset>
          <div class="grid2" style="gap:12px">
            <div class="field"><label for="bsAngle">Angle or theme <span class="muted">(optional)</span></label><input class="inp" id="bsAngle" data-bs="angle" value="${esc(bs.angle)}" placeholder="e.g. event follow-up, insurer renewals"></div>
            <div class="field"><label for="bsCount">How many ideas</label><select class="inp" id="bsCount" data-bs="count">${[3, 5, 8].map(n => `<option ${+bs.count === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          </div>
          <div class="row"><button class="btn ai" type="submit" ${busy || !S.ai || S.aiOff ? 'disabled' : ''}>${busy ? '<span class="thinking">Thinking…</span>' : '✦ Brainstorm ideas'}</button><span class="small muted">Uses your Claude account. You’ll be asked to allow it the first time.</span></div>
        </form>
        ${bs.ideas.length ? `<div class="ideas">${bs.ideas.map((it, i) => `<article class="idea"><div class="spread"><span class="pill">${esc(it.format)}</span><span class="small muted">${esc(it.channel || '')}</span></div><h3>${esc(it.title)}</h3><p>${esc(it.hook)}</p>${it.why ? `<p class="small muted">${esc(it.why)}</p>` : ''}
          <div class="row"><button class="btn sm primary" data-act="ideadraft" data-i="${i}">Create draft</button><button class="btn sm" data-act="ideasave" data-i="${i}">Save idea</button><button class="btn sm ghost" data-act="ideadrop" data-i="${i}" aria-label="Dismiss idea">Dismiss</button></div></article>`).join('')}</div>` : ''}
      </section>
    </div>
    <div class="stack">
      <section class="panel"><div class="panel-h"><h2>Saved ideas</h2><span class="muted small">${saved.length}</span></div>
        <div class="list">${saved.map(a => `<div class="li"><span class="kind camp">idea</span><span class="t">${aRef(a.id)}</span><span class="d">${esc(a.type)} · ${a.partnerId ? esc(pName(a.partnerId)) : 'No partner'}${campsOf(a).length ? ' · ' + campsOf(a).map(c => esc(C(c).name)).join(', ') : ''}</span><span class="a"><button class="btn sm" data-act="startdraft" data-id="${esc(a.id)}">Start draft</button></span></div>`).join('') || '<div class="empty">No saved ideas yet.</div>'}</div></section>
      <section class="panel"><div class="panel-h"><h2>Add an idea by hand</h2></div>
        <form class="panel-b stack" id="ideaForm" style="gap:10px"><div class="field"><label for="ifTitle">Idea</label><input class="inp" id="ifTitle" placeholder="e.g. Recovery checklist for practice managers" maxlength="120"></div>
          <div class="field"><label for="ifType">Format</label><select class="inp" id="ifType">${ASSET_TYPES.map(t => `<option>${esc(t)}</option>`).join('')}</select></div>
          <button class="btn" type="submit">Save idea</button></form></section>
    </div>
  </div>`;
}

function vAsset(id) {
  const a0 = {id, ...A(id)}, dr = S.adraft[id] || {}, a = {...a0, ...dr};
  const dirty = Object.keys(dr).length > 0, busy = k => S.busy[id + ':' + k];
  const [, W, H] = SIZES[a.size] || SIZES.li;
  const ap = a0.approvals || {}, st = a0.stage || 'draft';
  const camps = sortedCamps(a.partnerId);
  const svg = designOf(a);
  const canAI = S.ai && !S.aiOff;
  const steps = ['idea','draft','review','approved','scheduled','published'];
  const stepIdx = st === 'changes' ? 2 : steps.indexOf(st);
  const inp = (key, label, attrs = '') => `<div class="field"><label for="af-${key}">${label}</label><input class="inp" id="af-${key}" data-af="${key}" value="${esc(a[key] || '')}" ${attrs}></div>`;
  const designs = (a0.designs || []).slice().reverse();
  return `${crumbs(['Home','home'],['Content','content'],[a.title || 'Untitled'])}
  <div class="phead"><div><div class="row"><span class="kind camp">content</span>${stagePillC(st)}${dirty ? '<span class="pill warn">Unsaved changes</span>' : ''}${ex(a0)}</div>
    <h1 style="margin-top:6px">${esc(a.title || 'Untitled')}</h1><p class="sub">${esc(a.type)}${a.partnerId ? ' · ' + pRef(a.partnerId) : ' · <span class="muted">No partner assigned</span>'}${campsOf(a).length ? ' · ' + campsOf(a).map(c => cRef(c)).join(', ') : ''}</p></div>
    <div class="row"><button class="btn" data-act="adiscard" data-id="${esc(id)}" ${dirty ? '' : 'disabled'}>Discard changes</button><button class="btn primary" data-act="asave" data-id="${esc(id)}" ${dirty && S.canWrite ? '' : 'disabled'}>Save changes</button></div></div>
  <div class="grid-main">
    <div class="stack">
      <section class="panel"><div class="panel-h"><h2>Assignment</h2></div><div class="panel-b stack" style="gap:12px">
        <div class="grid2" style="gap:12px">
          ${inp('title', 'Title', 'maxlength="120"')}
          <div class="field"><label for="af-type">Format</label><select class="inp" id="af-type" data-af="type">${ASSET_TYPES.map(t => `<option ${a.type === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
          <div class="field"><label for="af-partnerId">Partner account</label><select class="inp" id="af-partnerId" data-af="partnerId"><option value="">Not assigned</option>${sortedPartners().map(p => `<option value="${esc(p.id)}" ${a.partnerId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
          ${inp('channel', 'Channel', 'placeholder="e.g. LinkedIn, partner newsletter"')}
        </div>
        <fieldset class="campset"><legend>Campaigns <span class="muted small">(${(a.campaignIds || []).length} selected — content can serve several)</span></legend>${camps.map(c => `<label class="check"><input type="checkbox" data-acamp="${esc(c.id)}" ${(a.campaignIds || []).includes(c.id) ? 'checked' : ''}> ${esc(c.name)} <span class="muted small">· ${esc(pName(c.partnerId))}</span></label>`).join('') || '<span class="muted small">No campaigns yet.</span>'}</fieldset>
        <div class="field"><label for="af-brief">Brief</label><textarea class="inp" id="af-brief" data-af="brief" rows="3" placeholder="Who it’s for, what it should make them do, anything it must include">${esc(a.brief || '')}</textarea></div>
      </div></section>

      <section class="panel"><div class="panel-h"><h2>Copy</h2><div class="row">${canAI ? `<button class="btn ai sm" data-act="aiwrite" data-id="${esc(id)}" ${busy('write') ? 'disabled' : ''}>${busy('write') ? '<span class="thinking">Writing…</span>' : '✦ Write with AI'}</button>` : ''}</div></div>
        <div class="panel-b stack" style="gap:12px">
          ${inp('headline', a.type === 'Email' ? 'Subject line' : 'Headline', 'maxlength="140"')}
          ${inp('subhead', a.type === 'Email' ? 'Preview text' : 'Subhead', 'maxlength="200"')}
          <div class="field"><label for="af-body">Body</label><textarea class="inp" id="af-body" data-af="body" rows="8">${esc(a.body || '')}</textarea></div>
          ${inp('cta', 'Call to action', 'maxlength="60"')}
          ${canAI ? `<form class="row aiform" data-aiform="rewrite" data-id="${esc(id)}"><input class="inp" id="af-rw" placeholder="Rewrite direction, e.g. shorter, more urgent, for CFOs" style="flex:1;min-width:200px"><button class="btn ai sm" type="submit" ${busy('rewrite') ? 'disabled' : ''}>${busy('rewrite') ? '<span class="thinking">Rewriting…</span>' : '✦ Rewrite'}</button></form>` : ''}
        </div></section>

      <section class="panel"><div class="panel-h"><h2>Graphic design</h2><span class="pill ${a.design === 'ai' && a.svg ? 'camp' : ''}">${a.design === 'ai' && a.svg ? 'AI design' : 'Brand template'}</span></div>
        <div class="panel-b stack" style="gap:12px">
          <div class="designbox"><img class="preview" src="${svgSrc(svg)}" alt="Design preview: ${esc(a.headline || a.title)}" style="aspect-ratio:${W}/${H}">${busy('design') ? '<div class="designbusy"><span class="thinking">Claude is designing…</span></div>' : ''}</div>
          <div class="grid2" style="gap:12px">
            <div class="field"><label for="af-size">Size</label><select class="inp" id="af-size" data-af="size">${Object.entries(SIZES).map(([k, v]) => `<option value="${k}" ${a.size === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></div>
            <div class="field"><label for="af-layout">Template layout</label><select class="inp" id="af-layout" data-af="layout">${Object.entries(LAYOUTS).map(([k, v]) => `<option value="${k}" ${a.layout === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          </div>
          <div class="row">${a.design === 'ai' && a.svg ? `<button class="btn sm" data-act="usetemplate" data-id="${esc(id)}">Switch to brand template</button>` : ''}
            ${canAI ? `<button class="btn ai sm" data-act="aidesign" data-id="${esc(id)}" ${busy('design') ? 'disabled' : ''}>✦ ${a.design === 'ai' && a.svg ? 'New AI design' : 'Design with AI'}</button>` : ''}
            ${S.dl ? `<button class="btn sm" data-act="dlsvg" data-id="${esc(id)}">Download SVG</button><button class="btn sm" data-act="dlpng" data-id="${esc(id)}">Download PNG</button>` : ''}</div>
          ${canAI && a.design === 'ai' && a.svg ? `<form class="row aiform" data-aiform="refine" data-id="${esc(id)}"><input class="inp" id="af-dir" placeholder="Refine, e.g. bigger headline, add a shield icon, darker background" style="flex:1;min-width:200px"><button class="btn ai sm" type="submit" ${busy('design') ? 'disabled' : ''}>✦ Refine</button></form>` : ''}
          ${designs.length ? `<div><span class="eyebrow">Earlier designs</span><div class="versions">${designs.map((d, i) => `<button class="ver" data-act="restoredesign" data-id="${esc(id)}" data-i="${designs.length - 1 - i}" title="Restore design from ${esc(fdate((d.at || '').slice(0, 10)))}"><img src="${svgSrc(d.svg)}" alt="Earlier design ${i + 1}"></button>`).join('')}</div></div>` : ''}
          <p class="small muted">The brand template always uses the headline, subhead and call to action above. AI designs are drawn by Claude in your brand and partner colours; review them like any other draft.</p>
        </div></section>
    </div>

    <div class="stack">
      <section class="panel wf"><div class="panel-h"><h2>Workflow</h2>${stagePillC(st)}</div><div class="panel-b stack" style="gap:14px">
        <ol class="stepper">${steps.map((k, i) => `<li class="${i < stepIdx ? 'done' : i === stepIdx ? 'cur' : ''}${st === 'changes' && k === 'review' ? ' bad' : ''}"><span>${i < stepIdx ? '✓' : i + 1}</span>${st === 'changes' && k === 'review' ? 'Changes requested' : STAGE_C[k].label}</li>`).join('')}</ol>
        ${wfActions(a0)}
      </div></section>
      <section class="panel"><div class="panel-h"><h2>Approvals</h2><span class="muted small">Both sign-offs move it to Approved</span></div><div class="panel-b approvers">
        ${['vendor','partner'].map(r => `<div class="appr ${ap[r] ? 'done' : ''}"><b>${r === 'vendor' ? esc(brand().vendorName) : esc(a0.partnerId ? pName(a0.partnerId) : 'Partner')}</b>
          <span class="small">${ap[r] ? `Approved by ${who(ap[r].by)} · ${fdate(ap[r].at.slice(0, 10))}` : st === 'review' ? 'Waiting for approval' : 'Not requested yet'}</span>
          ${st === 'review' && !ap[r] ? `<button class="btn sm ok" data-act="approve" data-role="${r}" data-id="${esc(id)}" ${S.canWrite ? '' : 'disabled'}>Approve as ${r === 'vendor' ? 'vendor' : 'partner'}</button>` : ''}</div>`).join('')}
      </div></section>
      <section class="panel"><div class="panel-h"><h2>Comments</h2><span class="muted small">${(a0.comments || []).length}</span></div>
        <div class="panel-b stack" style="gap:10px">
          <div class="thread">${(a0.comments || []).map(c => `<div class="cmt ${c.kind === 'changes' ? 'changes' : ''}"><div class="spread"><b>${esc(who(c.by))} <span class="muted small">· ${c.role === 'partner' ? 'Partner' : esc(brand().vendorName)}</span></b><span class="small muted">${fdate(c.at.slice(0, 10))}</span></div><p>${c.kind === 'changes' ? '<b>Changes requested:</b> ' : ''}${esc(c.text)}</p></div>`).join('') || '<p class="small muted">No comments yet.</p>'}</div>
          <form class="stack" id="cmtForm" data-id="${esc(id)}" style="gap:8px"><div class="field"><label for="cmtText">Add a comment</label><textarea class="inp" id="cmtText" rows="2" placeholder="Feedback, questions, sign-off notes"></textarea></div>
            <div class="row"><div class="seg" role="group" aria-label="Comment as"><button type="button" data-act="cmtrole" data-val="vendor" aria-pressed="${(S.cmtRole || 'vendor') === 'vendor'}">As ${esc(brand().vendorName)}</button><button type="button" data-act="cmtrole" data-val="partner" aria-pressed="${S.cmtRole === 'partner'}">As partner</button></div>
            <button class="btn sm" type="submit">Comment</button>${st === 'review' ? `<button class="btn sm danger" type="button" data-act="reqchanges" data-id="${esc(id)}">Request changes</button>` : ''}</div></form>
        </div></section>
      <section class="panel"><div class="panel-h"><h2>History</h2></div><div class="panel-b"><ul class="hist">${(a0.history || []).slice().reverse().map(h => `<li><span class="num small muted">${fdate((h.at || '').slice(0, 10))}</span> ${esc(h.action)} <span class="muted small">· ${esc(who(h.by))}</span></li>`).join('')}</ul></div></section>
      <button class="btn danger ${S.armed === 'del-' + id ? 'armed' : ''}" data-act="delasset" data-id="${esc(id)}" style="align-self:flex-start">${S.armed === 'del-' + id ? 'Confirm delete' : 'Delete this content'}</button>
    </div>
  </div>`;
}
function wfActions(a) {
  const id = esc(a.id), st = a.stage || 'draft', dis = S.canWrite ? '' : 'disabled';
  if (st === 'idea') return `<p class="small muted">An idea waiting to be written.</p><button class="btn primary" data-act="startdraft" data-id="${id}" ${dis}>Start draft</button>`;
  if (st === 'draft' || st === 'changes') return `<p class="small muted">${st === 'changes' ? 'Reviewers asked for changes. Edit, save, then resubmit.' : 'Write the copy, pick a design, then send it for review.'}</p><button class="btn primary" data-act="submitreview" data-id="${id}" ${dis}>Submit for review</button>`;
  if (st === 'review') return `<p class="small muted">Waiting for ${esc(brand().vendorName)} and partner sign-off. Editing now resets any approvals given.</p>`;
  if (st === 'approved') return `<p class="small muted">Approved by both sides. Stage it for publishing.</p>
    <form class="stack" id="schedForm" data-id="${id}" style="gap:8px"><div class="grid2" style="gap:8px"><div class="field"><label for="schDate">Publish date</label><input class="inp" type="date" id="schDate" value="${esc(a.schedule?.date || '')}"></div><div class="field"><label for="schCh">Channel</label><input class="inp" id="schCh" value="${esc(a.schedule?.channel || a.channel || '')}" placeholder="e.g. Partner LinkedIn"></div></div><button class="btn primary" type="submit" ${dis}>Schedule</button></form>`;
  if (st === 'scheduled') return `<p class="small">Scheduled for <b>${fdate(a.schedule?.date)}</b>${a.schedule?.channel ? ' on ' + esc(a.schedule.channel) : ''}.</p><div class="row"><button class="btn primary" data-act="publish" data-id="${id}" ${dis}>Mark published</button><button class="btn" data-act="unschedule" data-id="${id}" ${dis}>Unschedule</button></div>`;
  return `<p class="small">Published${a.schedule?.date ? ' ' + fdate(a.schedule.date) : ''}${a.schedule?.channel ? ' on ' + esc(a.schedule.channel) : ''}.</p><button class="btn" data-act="reopen" data-id="${id}" ${dis}>Reopen as draft</button>`;
}
function contentPanel(list, emptyText) {
  return `<div class="list">${list.length ? list.map(a => `<div class="li"><span class="kind camp">${esc((a.type || '').split(' ')[0].toLowerCase())}</span><span class="t">${aRef(a.id)}</span><span class="d">${esc(a.type)}${a.schedule?.date ? ' · ' + fdate(a.schedule.date) : ''}</span><span class="a">${stagePillC(a.stage)}</span></div>`).join('') : `<div class="empty">${emptyText}</div>`}</div>`;
}

/* ----- actions ----- */
const CONTENT_FIELDS = ['title','type','partnerId','channel','brief','headline','subhead','body','cta','size','layout','campaignIds'];
async function saveDraft(id) {
  const a = A(id), dr = S.adraft[id]; if (!a || !dr) return;
  const contentChanged = ['headline','subhead','body','cta','size','layout','title','type'].some(k => k in dr);
  const patch = {...dr};
  let msg = 'Saved';
  if (contentChanged && ['review','approved','scheduled'].includes(a.stage) && (a.approvals?.vendor || a.approvals?.partner || a.stage !== 'review')) {
    patch.approvals = {vendor:null, partner:null}; patch.stage = 'review'; patch.schedule = null;
    patch.history = histAdd(a, 'Edited after review; approvals reset'); msg = 'Saved. Approvals were reset, so it’s back in review.';
  } else patch.history = histAdd(a, 'Edited ' + Object.keys(dr).map(k => k === 'campaignIds' ? 'campaigns' : k === 'partnerId' ? 'partner' : k).join(', '));
  if (await saveAsset(id, patch, msg)) delete S.adraft[id];
}
const setDraft = (id, k, v) => { const d = S.adraft[id] || (S.adraft[id] = {}); if (JSON.stringify(A(id)?.[k] ?? '') === JSON.stringify(v)) delete d[k]; else d[k] = v; if (!Object.keys(d).length) delete S.adraft[id]; };

async function aiWrite(id, direction) {
  await withAI(id + ':' + (direction ? 'rewrite' : 'write'), async sample => {
    const a = {...A(id), ...(S.adraft[id] || {})};
    const guide = {Email:'subject line under 9 words as headline, preview text as subhead, 120–180 word body with short paragraphs', 'LinkedIn post':'scroll-stopping first line as headline, 80–150 word body, 3 relevant hashtags at the end of the body', 'Social graphic':'headline of at most 8 words, subhead of at most 16 words, body is a 40–70 word caption', 'One-pager':'headline at most 10 words, subhead one sentence, body of 4–6 short sections with bullet points', 'Blog post':'headline at most 12 words, subhead one sentence, body 350–500 words with subheadings', 'Webinar invite':'headline at most 10 words, subhead with date placeholder, 90–140 word body', 'Event invite':'headline at most 10 words, subhead with date/location placeholders, 90–140 word body', 'Case study':'headline with the result, subhead naming the customer type, 250–350 word body: challenge, solution, result'}[a.type] || 'concise';
    const prompt = `You write co-branded B2B channel marketing for a vendor and its partner.
${aiContext(a.partnerId, a.campaignIds)}
Format: ${a.type}${a.channel ? ' for ' + a.channel : ''}. Guidance: ${guide}.
Title: ${a.title}. Brief: ${a.brief || 'none'}.
${direction ? `Current copy:\nHeadline: ${a.headline}\nSubhead: ${a.subhead}\nBody: ${a.body}\nCTA: ${a.cta}\n\nRewrite it with this direction: ${direction}` : 'Write the first draft.'}
Rules: follow the brand voice; credit the partner by name; never invent statistics, prices or customer names — use [X] placeholders where a number is needed; plain text only (no markdown symbols except "- " bullets).
Return only JSON: {"headline": string, "subhead": string, "body": string, "cta": string}`;
    const r = await sample.json(prompt, {cache:false});
    ['headline','subhead','body','cta'].forEach(k => { if (typeof r?.[k] === 'string') setDraft(id, k, r[k].trim()); });
    toast(direction ? 'Rewritten. Review, then save.' : 'Draft written. Review, then save.');
  });
}
async function aiDesign(id, direction) {
  await withAI(id + ':design', async sample => {
    const a = {...A(id), ...(S.adraft[id] || {})}, b = brand(), p = P(a.partnerId), [, W, H] = SIZES[a.size] || SIZES.li;
    const prompt = `Design a polished co-branded marketing graphic as a single standalone SVG.
Canvas: viewBox="0 0 ${W} ${H}", width="${W}" height="${H}".
Brand colours: vendor ${b.vendorColor}, partner accent ${b.partnerColor}, ink #111827, white #FFFFFF, plus tints of these. Font: font-family="Helvetica Neue, Helvetica, Arial, sans-serif".
Exact text to include (spelled exactly, nothing else except optional tiny labels):
- Co-brand lockup: "${b.vendorName} × ${p ? p.name : 'Partner'}"
- Headline: "${a.headline || a.title}"
- Subhead: "${a.subhead || ''}"
- Call to action button: "${a.cta || 'Learn more'}"
Format: ${a.type}. Topic and audience: ${a.brief || a.title}. ${aiContext(a.partnerId, a.campaignIds)}
Style: confident, modern, flat B2B design; strong typographic hierarchy (headline is the largest element and must stay fully inside the canvas with at least ${Math.round(W * .05)}px margins; wrap long lines with separate <text> elements); one simple abstract or iconographic illustration built from basic shapes; generous whitespace; high contrast.
${direction && a.svg ? `This is a revision of the previous design. Direction: ${direction}\nPrevious SVG:\n${a.svg.slice(0, 20000)}` : ''}
Technical rules: no <image>, <foreignObject>, <script>, <style>, external fonts, links or url() references other than gradients by id; keep it under 12 KB.
Return only the SVG markup, starting with <svg and ending with </svg>.`;
    const {text} = await sample(prompt, {cache:false});
    const svg = cleanSVG(text, W, H);
    if (!svg) { toast('Claude’s design couldn’t be used. Try again.'); return; }
    const a0 = A(id), designs = [...(a0.designs || []), ...(a0.svg ? [{svg:a0.svg, at:a0.updatedAt || now()}] : [])].slice(-4);
    await saveAsset(id, {svg, design:'ai', designs, history:histAdd(a0, direction ? 'AI design refined: ' + direction : 'AI design created')}, 'New design ready');
  });
}
async function brainstorm() {
  const bs = S.bs;
  if (!bs.partnerId) { toast('Choose a partner account first.'); $('#bsPartner')?.focus(); return; }
  await withAI('brainstorm', async sample => {
    const existing = vals(S.assets).filter(a => a.partnerId === bs.partnerId).map(a => a.title).join('; ');
    const prompt = `You brainstorm co-branded B2B channel marketing content for a vendor and its partner.
${aiContext(bs.partnerId, bs.campaignIds)}
${bs.angle ? 'Angle to explore: ' + bs.angle : ''}
${bs.format ? 'Every idea must be a ' + bs.format + '.' : 'Mix formats from: ' + ASSET_TYPES.join(', ') + '.'}
Avoid repeating these existing pieces: ${existing || 'none'}.
Give ${bs.count} distinct, specific ideas a partner marketer could produce this month. Never invent statistics or customer names.
Return only JSON: an array of {"title": string (max 9 words), "format": one of ${JSON.stringify(ASSET_TYPES)}, "channel": string, "hook": string (one sentence), "why": string (one short sentence on why it fits this partner and campaign)}`;
    const r = await sample.json(prompt, {cache:false});
    const arr = Array.isArray(r) ? r : Array.isArray(r?.ideas) ? r.ideas : [];
    bs.ideas = arr.filter(x => x && x.title).map(x => ({title:String(x.title), format:ASSET_TYPES.includes(x.format) ? x.format : 'LinkedIn post', channel:String(x.channel || ''), hook:String(x.hook || ''), why:String(x.why || '')}));
    if (!bs.ideas.length) toast('No ideas came back. Try a different angle.');
  });
}
async function downloadDesign(id, kind) {
  const a = {...A(id), ...(S.adraft[id] || {})}, svg = designOf(a), [, W, H] = SIZES[a.size] || SIZES.li;
  const base = (a.title || 'design').replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'design';
  try {
    if (kind === 'svg') { await S.dl.save({filename:base + '.svg', data:new Blob([svg], {type:'image/svg+xml'})}); return; }
    const img = new Image(); img.src = svgSrc(svg); await img.decode();
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(img, 0, 0, W, H);
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    await S.dl.save({filename:base + '.png', data:blob});
  } catch (e) { if (e?.code !== 'declined') toast(e?.code === 'not_granted' ? 'Downloads aren’t allowed for this page.' : 'Couldn’t prepare the file. Try again.'); }
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id, a = id ? A(id) : null;
  const pass = {newasset:1, cfclear:1, cwait:1, ideadraft:1, ideasave:1, ideadrop:1, startdraft:1, asave:1, adiscard:1, aiwrite:1, aidesign:1, usetemplate:1, restoredesign:1, dlsvg:1, dlpng:1, submitreview:1, approve:1, reqchanges:1, publish:1, unschedule:1, reopen:1, cmtrole:1, delasset:1};
  if (!pass[act]) return;
  if (act === 'newasset') {
    const r = route(), seed = KIND_OF(r) === 'campaign' ? {partnerId:C(r).partnerId, campaignIds:[r]} : KIND_OF(r) === 'partner' ? {partnerId:r} : {};
    createAsset({title:'Untitled content', ...seed});
  }
  else if (act === 'cfclear') { S.cfilter = null; render(); }
  else if (act === 'cwait') { cf().wait = b.dataset.val; render(); }
  else if (act === 'ideadraft' || act === 'ideasave') {
    const it = S.bs.ideas[+b.dataset.i]; if (!it) return;
    const nid = await createAsset({title:it.title, type:it.format, channel:it.channel, brief:[it.hook, it.why, S.bs.angle ? 'Angle: ' + S.bs.angle : ''].filter(Boolean).join('\n'), partnerId:S.bs.partnerId, campaignIds:S.bs.campaignIds.slice(), stage:act === 'ideasave' ? 'idea' : 'draft', createdBy:'ai'}, act === 'ideadraft');
    if (nid) { S.bs.ideas.splice(+b.dataset.i, 1); render(); }
  }
  else if (act === 'ideadrop') { S.bs.ideas.splice(+b.dataset.i, 1); render(); }
  else if (act === 'startdraft') { await saveAsset(id, {stage:'draft', history:histAdd(a, 'Draft started')}, 'Draft started'); location.hash = id; }
  else if (act === 'asave') saveDraft(id);
  else if (act === 'adiscard') { delete S.adraft[id]; render(); }
  else if (act === 'aiwrite') aiWrite(id, '');
  else if (act === 'aidesign') aiDesign(id, '');
  else if (act === 'usetemplate') saveAsset(id, {design:'template', designs:[...(a.designs || []), ...(a.svg ? [{svg:a.svg, at:now()}] : [])].slice(-4), svg:'', history:histAdd(a, 'Switched to brand template')}, 'Using the brand template');
  else if (act === 'restoredesign') { const d = (a.designs || [])[+b.dataset.i]; if (d) { const rest = (a.designs || []).filter((_, i) => i !== +b.dataset.i); if (a.svg) rest.push({svg:a.svg, at:now()}); saveAsset(id, {svg:d.svg, design:'ai', designs:rest.slice(-4), history:histAdd(a, 'Earlier design restored')}, 'Design restored'); } }
  else if (act === 'dlsvg' || act === 'dlpng') downloadDesign(id, act === 'dlsvg' ? 'svg' : 'png');
  else if (act === 'submitreview') {
    if (S.adraft[id]) { toast('Save or discard your changes first.'); return; }
    if (!a.partnerId) { toast('Assign a partner account before review.'); $('#af-partnerId')?.focus(); return; }
    if (!(a.headline || a.body)) { toast('Add a headline or body before review.'); $('#af-headline')?.focus(); return; }
    saveAsset(id, {stage:'review', approvals:{vendor:null, partner:null}, history:histAdd(a, 'Submitted for review')}, 'Sent for review');
  }
  else if (act === 'approve') {
    const r = b.dataset.role, ap = {...(a.approvals || {}), [r]:{by:S.uid || '', at:now()}};
    const both = ap.vendor && ap.partner;
    saveAsset(id, {approvals:ap, stage:both ? 'approved' : 'review', history:histAdd(a, `Approved as ${r === 'vendor' ? brand().vendorName : 'partner'}` + (both ? '; fully approved' : ''))}, both ? 'Approved by both sides' : 'Approval recorded');
  }
  else if (act === 'reqchanges') {
    const t = $('#cmtText')?.value.trim(); if (!t) { toast('Say what needs to change in the comment box first.'); $('#cmtText')?.focus(); return; }
    saveAsset(id, {stage:'changes', approvals:{vendor:null, partner:null}, comments:[...(a.comments || []), {by:S.uid || '', role:S.cmtRole || 'vendor', text:t, at:now(), kind:'changes'}], history:histAdd(a, 'Changes requested')}, 'Changes requested');
  }
  else if (act === 'publish') saveAsset(id, {stage:'published', schedule:{...(a.schedule || {}), date:a.schedule?.date && a.schedule.date <= today() ? a.schedule.date : today()}, history:histAdd(a, 'Published')}, 'Marked published');
  else if (act === 'unschedule') saveAsset(id, {stage:'approved', history:histAdd(a, 'Unscheduled')}, 'Back to approved');
  else if (act === 'reopen') saveAsset(id, {stage:'draft', approvals:{vendor:null, partner:null}, history:histAdd(a, 'Reopened as draft')}, 'Reopened');
  else if (act === 'cmtrole') { S.cmtRole = b.dataset.val; render(); }
  else if (act === 'delasset') {
    if (S.armed !== 'del-' + id) { S.armed = 'del-' + id; render(); setTimeout(() => { if (S.armed === 'del-' + id) { S.armed = null; render(); } }, 4000); return; }
    S.armed = null; if (await write(db => db.doc('assets/' + id).delete(), 'Deleted')) location.hash = 'content';
  }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.cf) { cf()[el.dataset.cf] = el.value; render(); }
  else if (el.dataset.bs) { S.bs[el.dataset.bs] = el.value; if (el.dataset.bs === 'partnerId') render(); }
  else if (el.dataset.bscamp) { const s = new Set(S.bs.campaignIds); el.checked ? s.add(el.dataset.bscamp) : s.delete(el.dataset.bscamp); S.bs.campaignIds = [...s]; }
  else if (el.dataset.af && el.tagName === 'SELECT') { setDraft(route(), el.dataset.af, el.value); render(); }
  else if (el.dataset.acamp) { const id = route(), cur = new Set(((S.adraft[id] || {}).campaignIds) || A(id).campaignIds || []); el.checked ? cur.add(el.dataset.acamp) : cur.delete(el.dataset.acamp); setDraft(id, 'campaignIds', [...cur]); render(); }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.af && el.tagName !== 'SELECT') {
    const id = route(), had = !!S.adraft[id]; setDraft(id, el.dataset.af, el.value);
    if (['headline','subhead','cta','title'].includes(el.dataset.af)) { clearTimeout(S._pv); S._pv = setTimeout(render, 350); }
    else if (had !== !!S.adraft[id]) render();
  }
  if (el.dataset.bs === 'angle') S.bs.angle = el.value;
});
document.addEventListener('submit', async e => {
  const f = e.target;
  if (f.id === 'bsForm') { e.preventDefault(); brainstorm(); }
  else if (f.id === 'ideaForm') { e.preventDefault(); const t = $('#ifTitle').value.trim(); if (!t) { toast('Write the idea first.'); return; } await createAsset({title:t, type:$('#ifType').value, stage:'idea'}, false); }
  else if (f.dataset.aiform) { e.preventDefault(); const id = f.dataset.id, v = f.querySelector('input').value.trim(); if (!v) { toast('Describe what to change.'); return; } f.dataset.aiform === 'rewrite' ? aiWrite(id, v) : aiDesign(id, v); }
  else if (f.id === 'cmtForm') { e.preventDefault(); const id = f.dataset.id, a = A(id), t = $('#cmtText').value.trim(); if (!t) return; await saveAsset(id, {comments:[...(a.comments || []), {by:S.uid || '', role:S.cmtRole || 'vendor', text:t, at:now(), kind:'comment'}]}, 'Comment added'); }
  else if (f.id === 'schedForm') { e.preventDefault(); const id = f.dataset.id, a = A(id), d = $('#schDate').value, ch = $('#schCh').value.trim(); if (!d) { toast('Pick a publish date.'); return; } await saveAsset(id, {stage:'scheduled', schedule:{date:d, channel:ch}, history:histAdd(a, `Scheduled for ${fdate(d)}${ch ? ' on ' + ch : ''}`)}, 'Scheduled'); }
}, true);
