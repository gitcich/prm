/* ---------- Contact list import and territories ---------- */
const STATE_BY_NAME = Object.fromEntries(Object.entries(STATE_NAME).map(([a, n]) => [n.toLowerCase(), a]));
const toState = v => { v = String(v || '').trim(); if (!v) return ''; const up = v.toUpperCase(); if (STATE_NAME[up]) return up; return STATE_BY_NAME[v.toLowerCase()] || ''; };
const parseStates = v => [...new Set(String(v || '').split(/[;,/|]+/).map(toState).filter(Boolean))];
const terrOf = c => (c.territory || []).filter(a => STATE_NAME[a]);
const contactXY = c => CITY_XY[c.city] || STATE_XY[stateOf(c)] || null;

function parseCSV(text) {
  text = String(text || '').replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0] || '';
  const sep = (first.match(/\t/g) || []).length > (first.match(/,/g) || []).length ? '\t' : (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some(x => x.trim() !== '')) rows.push(row); row = []; }
    else cell += ch;
  }
  row.push(cell); if (row.some(x => x.trim() !== '')) rows.push(row);
  return rows.map(r => r.map(x => x.trim()));
}
const IMP_FIELDS = [
  ['name','Full name',['name','full name','contact','contact name']], ['first','First name',['first','first name','firstname','given name']], ['last','Last name',['last','last name','lastname','surname','family name']],
  ['title','Title',['title','job title','role','position']], ['partner','Partner',['partner','company','account','organization','organisation','partner name','reseller']],
  ['city','City',['city','town','location']], ['state','State',['state','st','province','region state']], ['email','Email',['email','e-mail','email address']],
  ['phone','Phone',['phone','mobile','telephone','phone number','cell']], ['status','Status',['status','contact status','stage']],
  ['territory','Territory (states)',['territory','territories','states covered','coverage','region','regions']], ['note','Notes',['notes','note','comments','comment']]
];
const normKey = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const normCo = s => String(s || '').toLowerCase().replace(/\b(inc|llc|ltd|corp|co|the)\b/g, '').replace(/[^a-z0-9]/g, '');
function matchPartner(v) {
  const k = normCo(v); if (!k) return '';
  const ps = vals(S.partners);
  const exact = ps.find(p => [p.name, p.portalName, p.deskName].some(n => n && normCo(n) === k)); if (exact) return exact.id;
  const part = ps.find(p => [p.name, p.portalName, p.deskName].some(n => n && (normCo(n).startsWith(k) || k.startsWith(normCo(n))))); return part ? part.id : '';
}
function impGuess(headers) {
  const map = {};
  IMP_FIELDS.forEach(([f, , keys]) => { const i = headers.findIndex(h => keys.includes(normKey(h))); if (i >= 0) map[f] = i; });
  return map;
}
function impRows() {
  const I = S.imp, out = [];
  if (!I.rows.length) return out;
  const get = (r, f) => I.map[f] != null && I.map[f] !== '' ? (r[I.map[f]] || '').trim() : '';
  const existing = vals(S.contacts);
  I.rows.forEach((r, idx) => {
    let name = get(r, 'name') || [get(r, 'first'), get(r, 'last')].filter(Boolean).join(' ');
    let city = get(r, 'city'), st = toState(get(r, 'state'));
    const cm = city.match(/^(.*?),\s*([A-Za-z .]+)$/); if (cm && toState(cm[2])) { city = cm[1].trim(); st = st || toState(cm[2]); }
    const pid = matchPartner(get(r, 'partner')) || I.defPartner || '';
    const email = get(r, 'email');
    const rec = {name, title:get(r, 'title'), partnerId:pid, city:city && st ? `${city}, ${st}` : st ? `${STATE_NAME[st]}, ${st}` : city, email, phone:get(r, 'phone'),
      status:['Active','Onboarding','At risk','Dormant'].find(s => s.toLowerCase() === get(r, 'status').toLowerCase()) || 'Active', territory:parseStates(get(r, 'territory')), note:get(r, 'note')};
    const issues = [], warns = [];
    if (!name) issues.push('No name');
    if (!pid) issues.push(get(r, 'partner') ? `Partner “${get(r, 'partner')}” not found` : 'No partner');
    if (!st) warns.push('No state: won’t appear on the map');
    else if (!CITY_XY[rec.city]) warns.push('Placed at the state centre');
    if (get(r, 'territory') && !rec.territory.length) warns.push('Territory not recognised');
    const dup = existing.find(c => (email && c.email && c.email.toLowerCase() === email.toLowerCase()) || (c.name.toLowerCase() === name.toLowerCase() && c.partnerId === pid));
    out.push({idx, rec, issues, warns, dup:dup ? dup.id : null});
  });
  return out;
}
function vImport() {
  const I = S.imp, rows = impRows(), headers = I.headers;
  const ok = rows.filter(r => !r.issues.length), dups = ok.filter(r => r.dup), news = ok.filter(r => !r.dup);
  const willWrite = news.length + (I.dupMode === 'update' ? dups.length : 0);
  return `<div class="scrim" data-act="impclose-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="impH">
    <div class="mhead"><div><h2 id="impH">Import partner contacts</h2><p class="small muted">Upload a CSV or paste rows from a spreadsheet. Contacts land on the map and in the contact list.</p></div><button class="btn sm ghost" data-act="impclose" aria-label="Close">✕</button></div>
    <div class="mbody">
      ${I.result ? `<div class="banner ${I.result.failed ? 'warn' : 'info'}"><span><b>Import finished.</b> ${I.result.added} added, ${I.result.updated} updated, ${I.result.skipped} skipped${I.result.failed ? `, ${I.result.failed} failed to save` : ''}.</span><button class="btn sm" data-act="impclose">Done</button></div>` : ''}
      <section class="stack" style="gap:10px"><h3>1 · Choose the list</h3>
        <div class="row"><label class="btn" for="impFile">Choose CSV file</label><input type="file" id="impFile" accept=".csv,.tsv,.txt,text/csv" hidden><span class="small muted">${I.fileName ? esc(I.fileName) + ' · ' + I.rows.length + ' rows' : 'or paste below'}</span>
          <button class="btn sm ghost" data-act="imptemplate" type="button">Copy a template header</button></div>
        <textarea class="inp" id="impPaste" rows="4" placeholder="Name,Title,Partner,City,State,Email,Phone,Status,Territory&#10;Jordan Lee,Channel Manager,Bluebonnet IT Solutions,Waco,TX,jordan@example.com,(254) 555-0100,Active,TX;OK">${esc(I.paste)}</textarea>
        <div class="row"><button class="btn sm" data-act="impparse" type="button">Read pasted rows</button><label class="check"><input type="checkbox" id="impHeader" ${I.hasHeader ? 'checked' : ''}> First row is column names</label></div>
      </section>
      ${headers.length ? `<section class="stack" style="gap:10px"><h3>2 · Match columns</h3>
        <div class="impmap">${IMP_FIELDS.map(([f, label]) => `<div class="field"><label for="im-${f}">${label}</label><select class="inp" id="im-${f}" data-impmap="${f}"><option value="">Not in file</option>${headers.map((h, i) => `<option value="${i}" ${String(I.map[f]) === String(i) ? 'selected' : ''}>${esc(h || 'Column ' + (i + 1))}</option>`).join('')}</select></div>`).join('')}</div>
        <div class="grid2" style="gap:12px">
          <div class="field"><label for="impDef">Partner for rows without a match</label><select class="inp" id="impDef" data-impset="defPartner"><option value="">Skip those rows</option>${sortedPartners().map(p => `<option value="${esc(p.id)}" ${I.defPartner === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="impDup">If a contact already exists</label><select class="inp" id="impDup" data-impset="dupMode"><option value="skip" ${I.dupMode === 'skip' ? 'selected' : ''}>Skip it</option><option value="update" ${I.dupMode === 'update' ? 'selected' : ''}>Update it with the file’s values</option></select></div>
        </div></section>
      <section class="stack" style="gap:10px"><h3>3 · Check and import</h3>
        <p class="small"><b>${news.length}</b> new · <b>${dups.length}</b> already exist (matched by email, or name and partner) · <b style="color:${rows.length - ok.length ? 'var(--bad)' : 'inherit'}">${rows.length - ok.length}</b> can’t be imported</p>
        <div class="tw" style="max-height:300px;overflow:auto"><table><thead><tr><th>Row</th><th>Name</th><th>Partner</th><th>Location</th><th>Territory</th><th>Result</th></tr></thead><tbody>
          ${rows.slice(0, 200).map(r => `<tr><td class="num small">${r.idx + 1}</td><td>${esc(r.rec.name || '—')}<span class="sub">${esc(r.rec.title)}</span></td><td>${r.rec.partnerId ? esc(pName(r.rec.partnerId)) : '—'}</td><td class="small">${esc(r.rec.city || '—')}</td><td class="small">${r.rec.territory.join(', ') || '—'}</td>
            <td class="small">${r.issues.length ? `<span style="color:var(--bad)">${esc(r.issues.join('; '))}</span>` : r.dup ? (I.dupMode === 'update' ? '<span class="pill pipe">Update</span>' : '<span class="pill">Skip, exists</span>') : '<span class="pill ok">New</span>'}${r.warns.length ? `<span class="sub" style="color:var(--warn)">${esc(r.warns.join('; '))}</span>` : ''}</td></tr>`).join('')}
        </tbody></table></div>
      </section>` : ''}
    </div>
    <div class="mfoot"><button class="btn" data-act="impclose">Cancel</button><button class="btn primary" data-act="imprun" ${willWrite && !I.running && S.canWrite ? '' : 'disabled'}>${I.running ? `<span class="thinking">Importing ${I.done}/${willWrite}…</span>` : `Import ${willWrite} contact${willWrite === 1 ? '' : 's'}`}</button></div>
  </div></div>`;
}
function impLoad(text, fileName) {
  const rows = parseCSV(text), I = S.imp;
  I.fileName = fileName || ''; I.result = null;
  if (!rows.length) { I.headers = []; I.rows = []; toast('No rows found in that list.'); return; }
  if (I.hasHeader) { I.headers = rows[0]; I.rows = rows.slice(1); }
  else { I.headers = rows[0].map((_, i) => 'Column ' + (i + 1)); I.rows = rows; }
  I.map = I.hasHeader ? impGuess(I.headers) : {};
}
async function impRun() {
  const I = S.imp, rows = impRows().filter(r => !r.issues.length && (!r.dup || I.dupMode === 'update'));
  I.running = true; I.done = 0; render();
  let added = 0, updated = 0, failed = 0;
  const stamp = Date.now().toString(36);
  for (const [n, r] of rows.entries()) {
    const data = {...r.rec, updatedAt:now()};
    try {
      if (r.dup) { const keep = Object.fromEntries(Object.entries(data).filter(([k, v]) => Array.isArray(v) ? v.length : v)); await S.db.doc('contacts/' + r.dup).update(keep); updated++; }
      else { await S.db.doc(`contacts/I-${stamp}-${n}`).set({...data, source:'import', lastTouch:'', importedAt:now(), importedBy:S.uid || ''}); added++; }
    } catch (e) { failed++; }
    I.done = n + 1; if (n % 5 === 4) render();
  }
  const total = impRows().length;
  I.running = false; I.result = {added, updated, failed, skipped:total - added - updated - failed};
  render(); toast(`Imported ${added}, updated ${updated}`);
}
function terrMini(c, editing) {
  const terr = editing ? [...S.terrDraft] : terrOf(c), xy = contactXY(c), tc = typeColor(P(c.partnerId)?.type);
  let vb = [0, 0, 975, 610];
  if (!editing) {
    const bbs = (terr.length ? terr : [stateOf(c)].filter(Boolean)).map(a => STATE_BB[a]).filter(Boolean);
    if (xy) bbs.push([xy[0], xy[1], xy[0], xy[1]]);
    if (bbs.length) vb = boxVB(Math.min(...bbs.map(b => b[0])), Math.min(...bbs.map(b => b[1])), Math.max(...bbs.map(b => b[2])), Math.max(...bbs.map(b => b[3])), 25);
  }
  const sc = vb[2] / 975, set = new Set(terr);
  return `<svg class="terrmap${editing ? ' editing' : ''}" viewBox="${vb.map(v => v.toFixed(1)).join(' ')}" role="img" aria-label="${terr.length ? 'Territory: ' + terr.map(a => STATE_NAME[a]).join(', ') : 'No territory assigned'}">
    ${US_STATES.map(s => `<path class="tst${set.has(s.a) ? ' in' : ''}" ${editing ? `data-tst="${s.a}"` : ''} style="--tc:${tc};stroke-width:${(.8 * sc).toFixed(2)}" d="${s.d}"><title>${esc(s.n)}${editing ? (set.has(s.a) ? ' · click to remove' : ' · click to add') : ''}</title></path>`).join('')}
    ${xy ? `<circle cx="${xy[0]}" cy="${xy[1]}" r="${(7 * Math.max(sc, .18)).toFixed(2)}" fill="${tc}" stroke="#fff" stroke-width="${(2 * Math.max(sc, .18)).toFixed(2)}"><title>${esc(c.name)} · ${esc(c.city)}</title></circle>` : ''}
  </svg>`;
}
function terrSection(c) {
  const editing = S.terrEdit === c.id, terr = editing ? [...S.terrDraft] : terrOf(c);
  return `<div class="msec terr"><h3><span>Territory${terr.length ? ' · ' + terr.length + ' state' + (terr.length > 1 ? 's' : '') : ''}</span>${editing ? '' : `<button type="button" class="linkbtn" data-act="terredit" data-cid="${esc(c.id)}" ${S.canWrite ? '' : 'disabled'}>${terr.length ? 'Edit' : 'Assign'}</button>`}</h3>
    ${terrMini(c, editing)}
    <div class="tchips">${terr.length ? terr.sort((x, y) => STATE_NAME[x].localeCompare(STATE_NAME[y])).map(a => `<span class="tchip">${esc(STATE_NAME[a])}${editing ? ` <button type="button" data-act="terrdel" data-st="${a}" aria-label="Remove ${esc(STATE_NAME[a])}">×</button>` : ''}</span>`).join('') : `<span class="small muted">${editing ? 'Click states on the map, or add them below.' : 'No territory assigned yet.'}</span>`}</div>
    ${editing ? `<div class="row"><select class="inp" id="terrAdd" style="flex:1;min-width:150px"><option value="">Add a state…</option>${Object.entries(STATE_NAME).sort((x, y) => x[1].localeCompare(y[1])).filter(([a]) => !S.terrDraft.has(a)).map(([a, n]) => `<option value="${a}">${esc(n)}</option>`).join('')}</select>
      <button type="button" class="btn sm primary" data-act="terrsave" data-cid="${esc(c.id)}">Save territory</button><button type="button" class="btn sm" data-act="terrcancel">Cancel</button></div>` : ''}
  </div>`;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act], [data-tst]'); if (!b) return;
  if (b.dataset.tst && S.terrEdit) { const a = b.dataset.tst; S.terrDraft.has(a) ? S.terrDraft.delete(a) : S.terrDraft.add(a); render(); return; }
  const act = b.dataset.act;
  if (act === 'impopen') { S.imp = {open:true, rows:[], headers:[], map:{}, hasHeader:true, dupMode:'skip', defPartner:S.partnerSel.size === 1 ? [...S.partnerSel][0] : '', paste:'', fileName:'', result:null, running:false, done:0}; render(); setTimeout(() => $('.modal .btn[for="impFile"], .modal label[for="impFile"]')?.focus(), 30); }
  else if (act === 'impclose' || (act === 'impclose-bg' && e.target === b)) { if (S.imp?.running) return; S.imp = null; render(); }
  else if (act === 'impparse') { S.imp.paste = $('#impPaste').value; impLoad(S.imp.paste, ''); render(); }
  else if (act === 'imprun') impRun();
  else if (act === 'imptemplate') { const t = 'Name,Title,Partner,City,State,Email,Phone,Status,Territory,Notes'; try { await navigator.clipboard.writeText(t); toast('Template header copied'); } catch (x) { S.imp.paste = t + '\n'; render(); } }
  else if (act === 'terredit') { S.terrEdit = b.dataset.cid; S.terrDraft = new Set(terrOf(S.contacts[b.dataset.cid])); render(); }
  else if (act === 'terrcancel') { S.terrEdit = null; render(); }
  else if (act === 'terrdel') { S.terrDraft.delete(b.dataset.st); render(); }
  else if (act === 'terrsave') { const cid = b.dataset.cid, t = [...S.terrDraft].sort(); if (await write(db => db.doc('contacts/' + cid).update({territory:t, updatedAt:now()}), t.length ? `Territory saved: ${t.length} state${t.length > 1 ? 's' : ''}` : 'Territory cleared')) { S.terrEdit = null; render(); } }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'impFile' && el.files?.[0]) { const f = el.files[0]; if (f.size > 5e6) { toast('That file is over 5 MB. Split it and import in parts.'); return; } f.text().then(t => { impLoad(t, f.name); render(); }); }
  else if (el.id === 'impHeader') { S.imp.hasHeader = el.checked; if (S.imp.paste || S.imp.fileName) { const raw = S.imp.rows; impLoad(S.imp.fileName ? [S.imp.headers, ...raw].map(r => r.map(x => /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x).join(',')).join('\n') : S.imp.paste, S.imp.fileName); } render(); }
  else if (el.dataset.impmap) { S.imp.map[el.dataset.impmap] = el.value === '' ? '' : +el.value; render(); }
  else if (el.dataset.impset) { S.imp[el.dataset.impset] = el.value; render(); }
  else if (el.id === 'terrAdd' && el.value) { S.terrDraft.add(el.value); render(); }
});
document.addEventListener('input', e => { if (e.target.id === 'impPaste' && S.imp) S.imp.paste = e.target.value; });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.imp && !S.imp.running) { S.imp = null; render(); } });
