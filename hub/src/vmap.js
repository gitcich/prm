/* Map: the Pipeline Portal's contact map with filters, on the hub's linked records */
const STATUS_LIST = ['Active', 'Onboarding', 'At risk', 'Dormant'];
const STATE_NAME = Object.fromEntries(US_STATES.map(s => [s.a, s.n]));
const stateOf = c => (c.city || '').split(', ')[1] || '';
const typeOfC = c => P(c.partnerId)?.type || 'Other';
const openDealsOf = c => contactDeals(c).filter(d => OPEN.has(d.stage));
const lastTouchOfC = c => [c.lastTouch || '', ...vals(S.engagements).filter(g => g.contactId === c.id && !g.planned && g.date <= today()).map(g => g.date)].sort().pop() || '';
const statusCls = s => s === 'Active' ? 'ok' : s === 'At risk' ? 'bad' : s === 'Onboarding' ? 'pipe' : '';
function mapMatch(c, skip) {
  const F = S.mapF;
  if (skip !== 'partner' && !inSel(c.partnerId)) return false;
  if (skip !== 'type' && S.typeOff.has(typeOfC(c))) return false;
  if (skip !== 'state' && F.state && stateOf(c) !== F.state) return false;
  if (skip !== 'status' && F.status && c.status !== F.status) return false;
  if (skip !== 'deals' && F.deals) { const o = openDealsOf(c).length; if (F.deals === 'open' && !o) return false; if (F.deals === 'none' && o) return false; }
  if (F.q) {
    const hay = [c.name, c.title, pName(c.partnerId), P(c.partnerId)?.portalName, c.city, STATE_NAME[stateOf(c)], ...contactDeals(c).map(d => d.name)].join(' ').toLowerCase();
    if (!hay.includes(F.q.toLowerCase())) return false;
  }
  return true;
}
const mapFiltersOn = () => !!(S.mapF.q || S.mapF.state || S.mapF.status || S.mapF.deals || S.typeOff.size || S.partnerSel.size);
function clearMapFilters() { S.mapF = {q:'', state:'', status:'', deals:''}; S.typeOff.clear(); S.partnerSel.clear(); S.mapVB = null; }
function pinLayout(cs) {
  const byCity = {}, pins = [];
  cs.forEach(c => (byCity[c.city] = byCity[c.city] || []).push(c));
  Object.entries(byCity).forEach(([city, list]) => {
    const xy = CITY_XY[city]; if (!xy) return;
    list.forEach((c, i) => { const ang = i * 2.4, rad = i === 0 ? 0 : 7 + 3 * i; pins.push({c, x:xy[0] + Math.cos(ang) * rad, y:xy[1] + Math.sin(ang) * rad}); });
  });
  return pins;
}
function boxVB(x0, y0, x1, y1, pad) {
  const w0 = Math.max(x1 - x0 + 2 * pad, 975 / 12), h0 = Math.max(y1 - y0 + 2 * pad, 610 / 12);
  const W = Math.min(975, Math.max(w0, h0 * 975 / 610)), H = W * 610 / 975;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return [cx - W / 2, cy - H / 2, W, H];
}
function defaultVB(pins) {
  if (S.filter.mapFit === 'us' || !pins.length) return [0, 0, 975, 610];
  const xs = pins.map(p => p.x), ys = pins.map(p => p.y);
  const vb = boxVB(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), 55);
  return vb[2] < 320 ? boxVB(vb[0] + vb[2] / 2 - 160, vb[1] + vb[3] / 2, vb[0] + vb[2] / 2 + 160, vb[1] + vb[3] / 2, 0) : vb;
}
function applyVB(vb) {
  const svg = $('#usmap'); if (!svg) return;
  const [x, y, w, h] = vb; S.mapVB = vb;
  svg.setAttribute('viewBox', `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  const s = w / 975;
  svg.querySelectorAll('.pin').forEach(p => { p.setAttribute('r', (Number(p.dataset.r0) * Math.max(s, .3)).toFixed(2)); p.style.strokeWidth = (1.5 * Math.max(s, .3)).toFixed(2); });
  svg.querySelectorAll('.st').forEach(p => p.style.strokeWidth = (.8 * s).toFixed(2));
}
function zoomBy(f, ax, ay) {
  const vb = S.mapVB || [0, 0, 975, 610];
  const w = Math.min(975, Math.max(975 / 12, vb[2] / f)), h = w * 610 / 975;
  const px = ax == null ? .5 : ax, py = ay == null ? .5 : ay;
  const cx = vb[0] + vb[2] * px, cy = vb[1] + vb[3] * py;
  applyVB([cx - w * px, cy - h * py, w, h]);
}

function vMap() {
  const F = S.mapF;
  const all = vals(S.contacts);
  const cs = all.filter(c => mapMatch(c));
  const ps = vals(S.partners);
  const types = [...new Set(ps.map(p => p.type))].sort((a, b) => Object.keys(PTYPE).indexOf(a) - Object.keys(PTYPE).indexOf(b));
  const pins = pinLayout(cs);
  const openOf = c => sum(openDealsOf(c), d => d.amount);
  const vb = S.mapVB || defaultVB(pins);
  const sc = vb[2] / 975;
  const r0 = c => S.sizeByPipe ? 4 + Math.sqrt(openOf(c) / 1000) * .55 : 6;
  const stateHas = new Set(cs.map(stateOf));
  const states = [...new Set(all.map(stateOf))].filter(Boolean).sort((a, b) => (STATE_NAME[a] || a).localeCompare(STATE_NAME[b] || b));
  const opt = (v, label, n, cur) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''} ${n === 0 && v !== cur ? 'disabled' : ''}>${esc(label)} (${n})</option>`;
  const one = S.partnerSel.size === 1 ? [...S.partnerSel][0] : '';
  const sel = S.mapSel && S.contacts[S.mapSel] ? {id:S.mapSel, ...S.contacts[S.mapSel]} : null;
  const lastName = c => c.name.split(' ').slice(-1)[0];
  const list = cs.slice().sort((a, b) => lastName(a).localeCompare(lastName(b)) || a.name.localeCompare(b.name));
  return `${partnersHead('map', 'Partner contacts by city, coloured by partner type. Filter, then click a pin or a name to open the contact.')}
  <section class="panel mapfilters" aria-label="Map filters"><div class="panel-b"><div class="fbar">
    <div class="field f-q"><label for="mapQ">Search</label><input class="inp" id="mapQ" type="search" placeholder="Name, title, deal, city…" value="${esc(F.q)}" autocomplete="off"></div>
    <div class="field combo" id="pCombo"><label for="mapPartner">Partner</label>
      <div class="combo-box"><input class="inp" id="mapPartner" type="text" role="combobox" aria-expanded="false" aria-controls="pList" aria-autocomplete="list" autocomplete="off" spellcheck="false"
        value="${one ? esc(pName(one)) : ''}" placeholder="${S.partnerSel.size > 1 ? S.partnerSel.size + ' partners selected' : 'All partners · type to search'}">
        ${S.partnerSel.size ? '<button type="button" class="combo-clear" data-act="pclear" aria-label="Show all partners">×</button>' : '<span class="combo-caret" aria-hidden="true">▾</span>'}
        <ul class="combo-list" id="pList" role="listbox" aria-label="Partners" hidden></ul></div></div>
    <div class="field"><label for="mapState">State</label><select class="inp" id="mapState" data-mapf="state"><option value="">All states</option>${states.map(s => opt(s, STATE_NAME[s] || s, all.filter(c => stateOf(c) === s && mapMatch(c, 'state')).length, F.state)).join('')}</select></div>
    <div class="field"><label for="mapStatus">Contact status</label><select class="inp" id="mapStatus" data-mapf="status"><option value="">Any status</option>${STATUS_LIST.map(s => opt(s, s, all.filter(c => c.status === s && mapMatch(c, 'status')).length, F.status)).join('')}</select></div>
    <div class="field"><label for="mapDeals">Pipeline</label><select class="inp" id="mapDeals" data-mapf="deals"><option value="">All contacts</option><option value="open" ${F.deals === 'open' ? 'selected' : ''}>Has open deals</option><option value="none" ${F.deals === 'none' ? 'selected' : ''}>No open deals</option></select></div>
  </div>
  <div class="fbar" style="margin-top:12px">
    <div class="field"><span class="flabel" id="ptypeLbl">Partner type</span>
      <div class="chips" role="group" aria-labelledby="ptypeLbl">${types.map(t => `<button class="chip type" style="--tc:${typeColor(t)}" data-act="ptype" data-val="${esc(t)}" aria-pressed="${!S.typeOff.has(t)}" title="${esc((PTYPE[t] || [t])[0])}"><span class="tdot"></span>${esc(t)}<span class="n">${all.filter(c => typeOfC(c) === t && mapMatch(c, 'type')).length}</span></button>`).join('')}</div></div>
    <div class="row" style="margin-left:auto"><label class="check"><input type="checkbox" id="sizePipe" data-act="sizepipe" ${S.sizeByPipe ? 'checked' : ''}> Size pins by open pipeline</label>
      <div class="seg" role="group" aria-label="Map extent"><button data-act="mapfit" data-val="fit" aria-pressed="${S.filter.mapFit !== 'us'}">Fit to contacts</button><button data-act="mapfit" data-val="us" aria-pressed="${S.filter.mapFit === 'us'}">Whole US</button></div>
      <button class="btn" data-act="mapclear" ${mapFiltersOn() ? '' : 'disabled'}>Clear filters</button></div>
  </div></div></section>
  <div class="mapgrid">
    <section class="mapcard" aria-label="Contact map">
      <svg id="usmap" class="usmap" viewBox="${vb.map(v => v.toFixed(1)).join(' ')}" role="img" aria-label="Map of partner contacts, coloured by partner type. Click a state to filter to it.">
        ${US_STATES.map(s => `<path class="st${stateHas.has(s.a) ? ' has' : ''}${F.state === s.a ? ' active' : ''}${F.state && F.state !== s.a ? ' dim' : ''}" data-st="${s.a}" d="${s.d}" style="stroke-width:${(.8 * sc).toFixed(2)}"><title>${esc(s.n)}${stateHas.has(s.a) ? ' · click to filter' : ''}</title></path>`).join('')}
        ${pins.sort((a, b) => r0(b.c) - r0(a.c)).map(p => { const nd = !openDealsOf(p.c).length; return `<a href="#${esc(p.c.id)}" class="pinlink" data-cid="${esc(p.c.id)}" aria-label="${esc(p.c.name)}, ${esc(pName(p.c.partnerId))}, ${esc(p.c.city)}"><circle class="pin${nd ? ' nodeal' : ''}${sel && sel.id === p.c.id ? ' sel' : ''}" data-cid="${esc(p.c.id)}" data-r0="${r0(p.c).toFixed(2)}" style="--tc:${typeColor(typeOfC(p.c))};stroke-width:${(1.5 * Math.max(sc, .3)).toFixed(2)}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(r0(p.c) * Math.max(sc, .3)).toFixed(2)}"></circle></a>`; }).join('')}
      </svg>
      <div class="zoomctl" role="group" aria-label="Zoom"><button type="button" data-act="zin" aria-label="Zoom in">+</button><button type="button" data-act="zout" aria-label="Zoom out">−</button><button type="button" data-act="zreset" aria-label="Reset view">⤢</button></div>
      <div class="maplg" aria-label="Legend">${types.map(t => `<div><i style="background:${typeColor(t)}"></i>${esc((PTYPE[t] || [t])[0])} <span class="num">${cs.filter(c => typeOfC(c) === t).length}</span></div>`).join('')}<div class="muted"><i style="background:var(--none);opacity:.45"></i>Faded: no open deals</div></div>
      ${pins.length ? '' : `<div class="mapempty"><p>No contacts match these filters. <button class="btn sm" data-act="mapclear">Clear filters</button></p></div>`}
    </section>
    <section class="panel mpanel">${sel ? mapRecord(sel) : `
      <div class="panel-h"><h2>Contacts</h2><span class="muted small num">${cs.length} of ${all.length}</span></div>
      <div class="list mlist">${list.map(c => { const o = openDealsOf(c); return `<button type="button" class="mrow" data-act="mapsel" data-cid="${esc(c.id)}"><span class="dot" style="background:${typeColor(typeOfC(c))}"></span><span class="who"><b>${esc(c.name)}</b><small>${esc(c.title)} · ${esc(pName(c.partnerId))}</small></span><span class="loc"><b class="num">${o.length ? money(sum(o, d => d.amount)) : '—'}</b>${esc(c.city)}</span></button>`; }).join('') || `<div class="empty">No contacts match these filters.<br><button class="btn sm" data-act="mapclear" style="margin-top:8px">Clear filters</button></div>`}</div>`}
    </section>
  </div>`;
}
function mapRecord(c) {
  const p = P(c.partnerId) || {}, ds = contactDeals(c).map(d => d).sort((a, b) => STAGE[a.stage].i - STAGE[b.stage].i || b.amount - a.amount);
  const open = ds.filter(d => OPEN.has(d.stage)), won = ds.filter(d => d.stage === 'won');
  const lt = lastTouchOfC(c), ago = lt ? daysSince(lt) : null;
  const peers = vals(S.contacts).filter(x => x.partnerId === c.partnerId && x.id !== c.id);
  const acts = vals(S.engagements).filter(g => g.contactId === c.id).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);
  const copyBtn = v => `<button type="button" class="copy" data-act="copy" data-copy="${esc(v)}">Copy</button>`;
  return `<div class="mrec">
    <button type="button" class="back" data-act="mapback">← All contacts</button>
    <div><div class="rid">CONTACT ${esc(c.id)}${ex(c)}</div><h2 class="rname">${esc(c.name)}</h2><div class="muted">${esc(c.title)}, ${pRef(c.partnerId)}</div></div>
    <div class="row" style="gap:6px"><span class="pill" style="background:var(--surface-2);color:var(--ink)"><span class="tdot" style="width:8px;height:8px;border-radius:50%;background:${typeColor(p.type)}"></span>${esc((PTYPE[p.type] || [p.type || ''])[0])}</span><span class="pill">${esc(p.tier || '')} partner</span><span class="pill ${statusCls(c.status)}">${esc(c.status)}</span></div>
    <div class="mmetrics"><div><b class="num">${money(sum(open, d => d.amount))}</b><span>Open pipeline</span></div><div><b class="num">${money(sum(won, d => d.amount))}</b><span>Closed won</span></div><div><b class="num">${ago == null ? '—' : ago + 'd'}</b><span>Since last touch</span></div></div>
    <div class="msec"><h3><span>Deals${ds.length ? ' · ' + ds.length : ''}</span><a class="ext" href="${TOOL.portal.url}#pipeline" target="_blank" rel="noopener">+ New deal ${extIcon}</a></h3>
      ${ds.length ? `<div class="dlist">${ds.map(d => `<a class="drow" href="#${esc(d.id)}"><b>${esc(d.account || d.name)}</b><span class="num">${full(d.amount)}</span><small>${STAGE[d.stage].label} · close ${fdate(d.closeDate)}</small><small style="text-align:right">${esc(d.product)}</small></a>`).join('')}</div>` : '<p class="small muted">No deals linked to this contact yet.</p>'}</div>
    <div class="msec"><h3>Contact</h3><dl class="kv">
      <dt>Email</dt><dd>${c.email ? `<span class="num small">${esc(c.email)}</span>${copyBtn(c.email)}` : '<span class="muted">Not on file</span>'}</dd>
      <dt>Phone</dt><dd>${c.phone ? `<span class="num small">${esc(c.phone)}</span>${copyBtn(c.phone)}` : '<span class="muted">Not on file</span>'}</dd>
      <dt>Location</dt><dd>${esc(c.city.split(', ')[0])}, ${esc(STATE_NAME[stateOf(c)] || stateOf(c))}</dd></dl></div>
    <div class="msec"><h3>Account</h3><dl class="kv">
      <dt>Partner</dt><dd>${pRef(c.partnerId)}</dd>
      <dt>Website</dt><dd><span class="num small">${esc(p.domain || '—')}</span></dd>
      <dt>Program tier</dt><dd>${esc(p.tier || '—')}</dd>
      <dt>Other contacts</dt><dd style="display:block">${peers.map(x => `<button type="button" class="linkbtn" data-act="mapsel" data-cid="${esc(x.id)}">${esc(x.name)}</button>`).join(', ') || 'None'}</dd></dl></div>
    <div class="msec"><h3>Recent activity</h3>${acts.length ? `<ul class="tl">${acts.map(a => `<li><time class="num">${fdate(a.date).replace(/, \d{4}$/, '')}</time><span>${esc(a.summary)}${a.planned ? ' <span class="muted small">· planned</span>' : ''}</span></li>`).join('')}</ul>` : '<p class="small muted">No activity logged yet.</p>'}</div>
    ${c.note ? `<div class="msec"><h3>Notes</h3><p class="note-box">${esc(c.note)}</p></div>` : ''}
    <div class="row" style="gap:8px"><button type="button" class="btn primary" data-act="mapshow" data-cid="${esc(c.id)}">Show on map</button><button type="button" class="btn" data-act="mappipe" data-pid="${esc(c.partnerId)}">View ${esc(pName(c.partnerId))} pipeline</button><button type="button" class="btn" data-act="maplog" data-cid="${esc(c.id)}">Log touchpoint</button><a class="btn" href="#${esc(c.id)}">Full contact page</a></div>
  </div>`;
}
const contactIdOf = c => c.id;

/* map interactions: pan, wheel zoom, state click, pin and row hover, hover card */
(() => {
  let drag = null, moved = false;
  const svgEl = () => $('#usmap');
  const rel = e => { const r = svgEl().getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  document.addEventListener('pointerdown', e => {
    const svg = e.target.closest?.('#usmap'); if (!svg || e.button !== 0) return;
    drag = {x:e.clientX, y:e.clientY, vb:(S.mapVB || svg.getAttribute('viewBox').split(' ').map(Number)).slice(), w:svg.getBoundingClientRect().width}; moved = false;
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) < 4) return; moved = true; hideMtip();
    const k = drag.vb[2] / drag.w; applyVB([drag.vb[0] - dx * k, drag.vb[1] - dy * k, drag.vb[2], drag.vb[3]]);
    svgEl()?.classList.add('grabbing');
  });
  document.addEventListener('pointerup', () => { if (drag) { svgEl()?.classList.remove('grabbing'); setTimeout(() => { moved = false; }, 0); } drag = null; });
  document.addEventListener('wheel', e => {
    if (!e.target.closest?.('#usmap')) return; e.preventDefault();
    const [ax, ay] = rel(e); zoomBy(e.deltaY < 0 ? 1.25 : 1 / 1.25, ax, ay); hideMtip();
  }, {passive:false});
  document.addEventListener('click', e => {
    const svg = e.target.closest?.('#usmap'); if (!svg) return;
    if (moved) { e.preventDefault(); e.stopPropagation(); return; }
    const pl = e.target.closest('.pinlink');
    if (pl) { e.preventDefault(); selectContact(pl.dataset.cid); return; }
    const st = e.target.closest('path.st');
    if (st) {
      const a = st.dataset.st;
      if (!vals(S.contacts).some(c => stateOf(c) === a)) { toast(`No partner contacts in ${STATE_NAME[a] || a}`); return; }
      if (S.mapF.state === a) { S.mapF.state = ''; S.mapVB = null; }
      else { S.mapF.state = a; const b = st.getBBox(); S.mapVB = boxVB(b.x, b.y, b.x + b.width, b.y + b.height, 30); }
      render();
    }
  }, true);
  // hover card + linked highlight
  const tip = () => $('#mtip');
  function hideMtip() { const t = tip(); if (t) t.hidden = true; }
  const hl = (cid, on) => { document.querySelectorAll(`#usmap .pin[data-cid="${CSS.escape(cid)}"]`).forEach(p => p.classList.toggle('hl', on)); document.querySelectorAll(`.mrow[data-cid="${CSS.escape(cid)}"]`).forEach(r => r.classList.toggle('hl', on)); };
  let cur = null;
  document.addEventListener('mouseover', e => {
    const pin = e.target.closest?.('#usmap .pinlink'), row = e.target.closest?.('.mrow');
    const cid = pin?.dataset.cid || row?.dataset.cid || null;
    if (cid === cur) return; if (cur) hl(cur, false); cur = cid; if (cid) hl(cid, true);
    if (pin && !drag) showMtip(pin, cid); else hideMtip();
  });
  document.addEventListener('focusin', e => { const pin = e.target.closest?.('#usmap .pinlink'); if (pin) showMtip(pin, pin.dataset.cid); else hideMtip(); });
  function showMtip(anchor, cid) {
    const c = S.contacts[cid], t = tip(); if (!c || !t) return; const cc = {id:cid, ...c};
    const o = openDealsOf(cc), lt = lastTouchOfC(cc), p = P(c.partnerId) || {};
    t.innerHTML = `<b class="nm">${esc(c.name)}</b><span class="ti">${esc(c.title)}</span>
      <span class="co"><i style="background:${typeColor(p.type)}"></i>${esc(pName(c.partnerId))}</span>
      <span class="mt"><span>${esc(c.city)}</span><span class="pill ${statusCls(c.status)}">${esc(c.status)}</span></span>
      <span class="mt"><span>Open pipeline</span><b>${o.length ? money(sum(o, d => d.amount)) + ' · ' + o.length + ' deal' + (o.length > 1 ? 's' : '') : 'None'}</b></span>
      <span class="mt"><span>${esc(p.type || '')} · ${esc(p.tier || '')}</span><span>Last touch ${lt ? (daysSince(lt) === 0 ? 'today' : daysSince(lt) + 'd ago') : '—'}</span></span>
      <span class="go">Click to open the contact →</span>`;
    t.hidden = false;
    const r = anchor.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
    let x = r.right + 10, y = r.top - 10;
    if (x + w > innerWidth - 10) x = r.left - w - 10;
    if (y + h > innerHeight - 10) y = innerHeight - h - 10;
    t.style.left = Math.max(10, x) + 'px'; t.style.top = Math.max(10, y) + 'px';
  }
  addEventListener('scroll', hideMtip, {passive:true});
  window.selectContact = cid => {
    S.mapSel = cid; hideMtip(); render();
    if (matchMedia('(max-width:1080px)').matches) $('.mpanel')?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
  };
})();
