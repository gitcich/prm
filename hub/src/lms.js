/* ---------- Academy: courses, assignments, lesson player, quizzes, certifications ---------- */
const TRACKS = {sales:['Sales','camp'], technical:['Technical','pipe'], marketing:['Marketing','mdf'], onboarding:['Onboarding','']};
const LEVELS = ['Foundation', 'Professional', 'Expert'];
const LTYPES = {text:['Reading','M4 3h9l3 3v11H4zM7 8h6M7 11h6M7 14h4'], video:['Video','M3 5h11v10H3zM14 8l4-2v8l-4-2'], file:['File','M5 2h7l4 4v12H5zM12 2v4h4'], quiz:['Quiz','M10 18a8 8 0 100-16 8 8 0 000 16zM8 8a2 2 0 114 0c0 1.5-2 1.5-2 3M10 14v.5']};
const EN_ST = {assigned:['Assigned',''], in_progress:['In progress','pipe'], completed:['Completed','ok'], overdue:['Overdue','bad']};
const CERT_ST = {valid:['Valid','ok'], expiring:['Expiring soon','warn'], expired:['Expired','bad']};
const CR = id => S.courses?.[id] ? {id, ...S.courses[id]} : null;
const EN = id => S.enrollments?.[id] ? {id, ...S.enrollments[id]} : null;
const lessonsOf = c => (c?.modules || []).flatMap(m => (m.lessons || []).map(l => ({...l, moduleId:m.id, moduleTitle:m.title})));
const courseMinutes = c => sum(lessonsOf(c), l => Number(l.minutes) || 0);
const enProgress = (en, c) => { const ls = lessonsOf(c); return ls.length ? ls.filter(l => en.progress?.[l.id]?.done).length / ls.length : 0; };
const enStatus = en => en.completedAt ? 'completed' : en.due && en.due < today() ? 'overdue' : Object.keys(en.progress || {}).length ? 'in_progress' : 'assigned';
const certStatus = en => !en.certExpires ? null : en.certExpires < today() ? 'expired' : (pd(en.certExpires) - pd(today())) / 864e5 <= 45 ? 'expiring' : 'valid';
const addMonths = (d, n) => { const x = pd(d); x.setMonth(x.getMonth() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const addDays = (d, n) => { const x = pd(d); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const crRef = id => CR(id) ? `<a class="ref course" href="#${esc(id)}">${esc(CR(id).title)}</a>` : '<span class="muted">Course removed</span>';
const ctName = id => S.contacts[id]?.name || (S._full?.contacts?.[id]?.name) || 'Unknown learner';
const enOf = (courseId, contactId) => vals(S.enrollments).find(e => e.courseId === courseId && e.contactId === contactId);
const certsFor = pid => vals(S.enrollments).filter(e => e.partnerId === pid && e.certId && certStatus(e) !== 'expired');
const quizScore = (en, c) => { const qs = lessonsOf(c).filter(l => l.type === 'quiz').map(l => en.progress?.[l.id]?.score).filter(v => v != null); return qs.length ? Math.round(sum(qs, v => v) / qs.length) : null; };
const trackPill = t => stPill(Object.fromEntries(Object.entries(TRACKS).map(([k, v]) => [k, v])), t);
const newId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// tiny, safe markdown for lesson bodies: headings, bullets, numbered lists, bold, italics, links
function mdLite(src) {
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const out = []; let list = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of String(src || '').split('\n')) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { close(); continue; }
    if ((m = line.match(/^(#{1,3})\s+(.*)/))) { close(); out.push(`<h${m[1].length + 2}>${inline(m[2])}</h${m[1].length + 2}>`); }
    else if ((m = line.match(/^\s*[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = line.match(/^>\s?(.*)/))) { close(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); }
    else { close(); out.push(`<p>${inline(line)}</p>`); }
  }
  close(); return out.join('');
}

/* ----- certificate graphic ----- */
function certSVG(en, c) {
  const b = brand(), name = ctName(en.contactId), p = (S._full || S).partners[en.partnerId], certName = c?.cert?.name || c?.title || 'Course completion';
  const F = 'font-family="Helvetica Neue, Helvetica, Arial, sans-serif"', W = 1100, H = 780;
  const fit = (s, max) => s.length > max ? s.slice(0, max - 1) + '…' : s;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#FFFFFF"/><rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${b.vendorColor}" stroke-width="3"/>
  <rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="${b.vendorColor}" stroke-opacity=".25" stroke-width="1"/>
  <rect x="36" y="36" width="${W - 72}" height="14" fill="${b.vendorColor}"/>
  <g transform="translate(${W / 2 - 34} 92)"><rect width="68" height="68" rx="15" fill="${b.vendorColor}"/><text x="34" y="44" text-anchor="middle" ${F} font-size="28" font-weight="800" fill="#fff">${xmlEsc(initials(b.vendorName))}</text></g>
  <text x="${W / 2}" y="200" text-anchor="middle" ${F} font-size="15" font-weight="700" letter-spacing="4" fill="#5D6275">${xmlEsc(b.vendorName.toUpperCase())} PARTNER ACADEMY</text>
  <text x="${W / 2}" y="268" text-anchor="middle" ${F} font-size="44" font-weight="300" fill="#111827">Certificate of ${c?.cert?.enabled ? 'Certification' : 'Completion'}</text>
  <text x="${W / 2}" y="320" text-anchor="middle" ${F} font-size="17" fill="#5D6275">This certifies that</text>
  <text x="${W / 2}" y="392" text-anchor="middle" ${F} font-size="52" font-weight="700" fill="#111827">${xmlEsc(fit(name, 34))}</text>
  <line x1="${W / 2 - 260}" y1="414" x2="${W / 2 + 260}" y2="414" stroke="#D9DCE5" stroke-width="2"/>
  <text x="${W / 2}" y="448" text-anchor="middle" ${F} font-size="17" fill="#5D6275">of ${xmlEsc(fit(p?.name || 'partner organization', 60))} has successfully completed</text>
  <text x="${W / 2}" y="500" text-anchor="middle" ${F} font-size="30" font-weight="700" fill="${b.vendorColor}">${xmlEsc(fit(certName, 52))}</text>
  ${en.score != null ? `<text x="${W / 2}" y="538" text-anchor="middle" ${F} font-size="16" fill="#5D6275">Final assessment score ${en.score}%</text>` : ''}
  <g ${F} font-size="14" fill="#5D6275">
    <text x="150" y="640">Awarded</text><text x="150" y="664" font-size="18" font-weight="700" fill="#111827">${xmlEsc(fdate((en.completedAt || '').slice(0, 10)))}</text>
    <text x="${W / 2}" y="640" text-anchor="middle">${en.certExpires ? 'Valid through' : 'Course'}</text><text x="${W / 2}" y="664" text-anchor="middle" font-size="18" font-weight="700" fill="#111827">${xmlEsc(en.certExpires ? fdate(en.certExpires) : (TRACKS[c?.track]?.[0] || '') + ' track')}</text>
    <text x="${W - 150}" y="640" text-anchor="end">Certificate ID</text><text x="${W - 150}" y="664" text-anchor="end" font-size="18" font-weight="700" fill="#111827">${xmlEsc(en.certId || en.id.toUpperCase().slice(-10))}</text>
  </g>
  <text x="${W / 2}" y="722" text-anchor="middle" ${F} font-size="12" fill="#9AA0B2">Verify with your ${xmlEsc(b.vendorName)} partner account manager.</text>
</svg>`;
}

/* ----- views: Academy home ----- */
const ACAD_TABS = [['academy','Catalog'],['academy-learners','Learners'],['academy-certs','Certifications']];
function acadHead(tab) {
  const ens = vals(S.enrollments), pub = vals(S.courses).filter(c => c.status === 'published');
  const done = ens.filter(e => e.completedAt).length, overdue = ens.filter(e => enStatus(e) === 'overdue').length;
  const certs = ens.filter(e => e.certId && certStatus(e) !== 'expired');
  const n = {'academy':Object.keys(S.courses).length, 'academy-learners':new Set(ens.map(e => e.contactId)).size, 'academy-certs':ens.filter(e => e.certId).length};
  return `${crumbs(['Home','home'],['Academy'])}
  <div class="phead"><div><h1>Academy</h1><p class="sub">Partner training: courses, assignments, quizzes and certifications, tracked per person and per partner.</p></div>
    <div class="row">${S.ai && !S.aiOff ? `<button class="btn ai" data-act="acgen">✦ Build a course with AI</button>` : ''}<button class="btn primary" data-act="acnew">New course</button><button class="btn" data-act="acassign">Assign training</button></div></div>
  <div class="kpis">
    <a class="kpi" href="#academy"><span class="eyebrow">Published courses</span><span class="v num">${pub.length}</span><span class="s">${Object.keys(S.courses).length - pub.length} in draft · ${sum(pub, c => lessonsOf(c).length)} lessons</span></a>
    <a class="kpi pipe" href="#academy-learners"><span class="eyebrow">Completion rate</span><span class="v num">${pct(ens.length ? done / ens.length : 0)}</span><span class="s">${done} of ${ens.length} assignments complete</span></a>
    <a class="kpi camp" href="#academy-certs"><span class="eyebrow">Active certifications</span><span class="v num">${certs.length}</span><span class="s">${certs.filter(e => certStatus(e) === 'expiring').length} expiring within 45 days</span></a>
    <a class="kpi ${overdue ? 'mdf' : ''}" href="#academy-learners" data-act="acoverdue"><span class="eyebrow">Overdue</span><span class="v num" style="${overdue ? 'color:var(--bad)' : ''}">${overdue}</span><span class="s">assignments past their due date</span></a>
  </div>
  <nav class="subtabs" aria-label="Academy views" style="margin-top:18px">${ACAD_TABS.map(([k, l]) => `<a href="#${k}" ${k === tab ? 'aria-current="page"' : ''}>${l}<span class="n">${n[k]}</span></a>`).join('')}</nav>`;
}
function vAcademy(tab = 'academy') {
  const F = S.acF || (S.acF = {track:'', status:'', q:'', cstat:'', learnQ:''});
  let body = '';
  if (tab === 'academy') {
    const list = vals(S.courses).map(c => ({...c})).filter(c => (!F.track || c.track === F.track) && (!F.status || c.status === F.status) && (!F.q || (c.title + ' ' + c.summary).toLowerCase().includes(F.q.toLowerCase())))
      .sort((a, b) => (a.status === 'draft') - (b.status === 'draft') || (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title));
    body = `<div class="acfilters"><div class="chips" role="group" aria-label="Track">${[['', 'All tracks'], ...Object.entries(TRACKS).map(([k, v]) => [k, v[0]])].map(([k, l]) => `<button class="chip" data-act="actrack" data-v="${k}" aria-pressed="${F.track === k}">${l}</button>`).join('')}</div>
      <div class="row"><select class="inp" id="acStatus" aria-label="Status" style="width:auto"><option value="">Published and draft</option><option value="published" ${F.status === 'published' ? 'selected' : ''}>Published only</option><option value="draft" ${F.status === 'draft' ? 'selected' : ''}>Drafts only</option></select>
      <input class="inp" id="acQ" type="search" placeholder="Search courses" value="${esc(F.q)}" style="width:220px" aria-label="Search courses"></div></div>
      ${list.length ? `<div class="cgrid">${list.map(c => { const ens = vals(S.enrollments).filter(e => e.courseId === c.id), done = ens.filter(e => e.completedAt).length, ls = lessonsOf(c); return `<a class="ccourse" href="#${esc(c.id)}">
        <span class="cband t-${c.track || 'onboarding'}"><span>${esc(TRACKS[c.track]?.[0] || 'Course')}</span>${c.cert?.enabled ? '<span class="cbadge" title="Awards a certification">★ Certification</span>' : ''}</span>
        <span class="cbody"><b>${esc(c.title)}</b>${c.status === 'draft' ? ' <span class="pill warn">Draft</span>' : ''}${ex(c)}<span class="small muted cdesc">${esc(c.summary || '')}</span>
        <span class="small muted">${esc(c.level || 'Foundation')} · ${(c.modules || []).length} modules · ${ls.length} lessons · ${Math.round(courseMinutes(c))} min</span></span>
        <span class="cfoot"><span class="small"><b class="num">${ens.length}</b> assigned · <b class="num">${done}</b> complete</span><span class="bar"><i style="width:${ens.length ? done / ens.length * 100 : 0}%;background:var(--ok)"></i></span></span></a>`; }).join('')}</div>`
      : `<div class="panel"><div class="empty">No courses match. ${F.track || F.status || F.q ? '<button class="btn sm" data-act="acclear">Clear filters</button>' : 'Create one, or build one with AI.'}</div></div>`}`;
  } else if (tab === 'academy-learners') {
    const ens = vals(S.enrollments);
    const people = [...new Set(ens.map(e => e.contactId))].map(cid => {
      const mine = ens.filter(e => e.contactId === cid), c = (S._full || S).contacts[cid] || {};
      return {id:cid, name:c.name || 'Unknown learner', title:c.title || '', partnerId:mine[0].partnerId, assigned:mine.length, prog:mine.filter(e => enStatus(e) === 'in_progress').length,
        done:mine.filter(e => e.completedAt).length, overdue:mine.filter(e => enStatus(e) === 'overdue').length, certs:mine.filter(e => e.certId && certStatus(e) !== 'expired').length,
        last:mine.map(e => e.lastAt || e.completedAt || e.assignedAt || '').sort().pop() || ''};
    }).filter(r => !F.learnQ || (r.name + ' ' + pName(r.partnerId)).toLowerCase().includes(F.learnQ.toLowerCase()));
    const courses = vals(S.courses).filter(c => c.status === 'published').sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    const parts = sortedPartners().filter(p => ens.some(e => e.partnerId === p.id));
    if (!S.sort['ac-learn']) S.sort['ac-learn'] = {col:5, dir:-1};
    body = `<section class="panel"><div class="panel-h"><h2>Completion by partner and course</h2><span class="small muted">Completed of assigned · darker is further along</span></div>
      ${parts.length && courses.length ? `<div class="tw"><table class="acmatrix"><thead><tr><th>Partner</th>${courses.map(c => `<th title="${esc(c.title)}"><a href="#${esc(c.id)}">${esc(c.title.length > 26 ? c.title.slice(0, 25) + '…' : c.title)}</a></th>`).join('')}</tr></thead><tbody>
        ${parts.map(p => `<tr><td>${pRef(p.id)}</td>${courses.map(c => { const e = ens.filter(x => x.partnerId === p.id && x.courseId === c.id), d = e.filter(x => x.completedAt).length, f = e.length ? d / e.length : 0;
          return `<td class="mcell" style="${e.length ? `background:color-mix(in srgb, var(--ok) ${Math.round(12 + f * 60)}%, transparent)` : ''}">${e.length ? `<b class="num">${d}/${e.length}</b>` : '<span class="muted">—</span>'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>` : '<div class="empty">Assign a published course to see progress here.</div>'}</section>
      <section class="panel" style="margin-top:18px"><div class="panel-h"><h2>Learners</h2><div class="row"><input class="inp" id="acLearnQ" type="search" placeholder="Find a learner or partner" value="${esc(F.learnQ)}" style="width:220px" aria-label="Find a learner"><button class="btn sm" data-act="acassign">Assign training</button></div></div>
      ${table('ac-learn', [
        {h:'Learner', asc:1, sort:r => r.name.toLowerCase(), v:r => `${ref(r.id, 'partner', r.name)}<span class="sub">${esc(r.title)}</span>`},
        {h:'Partner', asc:1, sort:r => pName(r.partnerId).toLowerCase(), v:r => pRef(r.partnerId)},
        {h:'Assigned', r:1, sort:r => r.assigned, v:r => r.assigned},
        {h:'In progress', r:1, sort:r => r.prog, v:r => r.prog},
        {h:'Completed', r:1, sort:r => r.done, v:r => r.done},
        {h:'Overdue', r:1, sort:r => r.overdue, v:r => r.overdue ? `<b style="color:var(--bad)">${r.overdue}</b>` : '0'},
        {h:'Certifications', r:1, sort:r => r.certs, v:r => r.certs ? `<span class="pill ok">★ ${r.certs}</span>` : '0'},
        {h:'Last activity', sort:r => r.last, v:r => `<span class="nowrap">${fdate(r.last.slice(0, 10))}</span>`}
      ], people, 'No one has been assigned training yet.')}</section>`;
  } else {
    const rows = vals(S.enrollments).filter(e => e.certId).map(e => ({...e, cs:certStatus(e) || 'valid'})).filter(e => !F.cstat || e.cs === F.cstat);
    if (!S.sort['ac-certs']) S.sort['ac-certs'] = {col:4, dir:1};
    body = `<div class="acfilters"><div class="chips" role="group" aria-label="Certification status">${[['', 'All'], ...Object.entries(CERT_ST).map(([k, v]) => [k, v[0]])].map(([k, l]) => `<button class="chip" data-act="accstat" data-v="${k}" aria-pressed="${F.cstat === k}">${l}</button>`).join('')}</div></div>
      <section class="panel">${table('ac-certs', [
        {h:'Person', asc:1, sort:r => ctName(r.contactId).toLowerCase(), v:r => `${ref(r.contactId, 'partner', ctName(r.contactId))}`},
        {h:'Partner', asc:1, sort:r => pName(r.partnerId).toLowerCase(), v:r => pRef(r.partnerId)},
        {h:'Certification', asc:1, sort:r => (CR(r.courseId)?.cert?.name || '').toLowerCase(), v:r => `${esc(CR(r.courseId)?.cert?.name || CR(r.courseId)?.title || '')}<span class="sub">${crRef(r.courseId)}</span>`},
        {h:'Earned', sort:r => r.completedAt || '', v:r => `<span class="nowrap">${fdate((r.completedAt || '').slice(0, 10))}</span>`},
        {h:'Expires', asc:1, sort:r => r.certExpires || '9999', v:r => `<span class="nowrap">${r.certExpires ? fdate(r.certExpires) : 'Never'}</span>`},
        {h:'Status', asc:1, sort:r => ['expired','expiring','valid'].indexOf(r.cs), v:r => stPill(CERT_ST, r.cs)},
        {h:'Certificate', v:r => `<a class="btn sm" href="#${esc(r.id)}" data-act="accertview" data-id="${esc(r.id)}">View</a>${S.dl ? ` <button class="btn sm" data-act="accertdl" data-id="${esc(r.id)}" data-kind="png">PNG</button>` : ''}`}
      ], rows, F.cstat ? 'No certifications with that status.' : 'No certifications awarded yet. They appear when someone completes a course that awards one.')}</section>`;
  }
  return acadHead(tab) + `<div style="margin-top:16px">${body}</div>`;
}

/* ----- course page: outline, enrollments, editor ----- */
function vCourse(id) {
  const c0 = CR(id), editing = !!S.cdraft?.[id], c = editing ? {id, ...S.cdraft[id]} : c0;
  const ens = vals(S.enrollments).filter(e => e.courseId === id), done = ens.filter(e => e.completedAt).length, ls = lessonsOf(c);
  const scores = ens.map(e => e.score).filter(v => v != null);
  if (!S.sort['c-en-' + id]) S.sort['c-en-' + id] = {col:3, dir:-1};
  const head = `${crumbs(['Home','home'],['Academy','academy'],[c0.title])}
  <div class="phead"><div><div class="row">${trackPill(c0.track)}<span class="pill">${esc(c0.level || 'Foundation')}</span>${c0.status === 'draft' ? '<span class="pill warn">Draft</span>' : '<span class="pill ok">Published</span>'}${c0.cert?.enabled ? '<span class="pill camp">★ Certification</span>' : ''}${ex(c0)}</div>
    <h1 style="margin-top:6px">${esc(c0.title)}</h1><p class="sub">${esc(c0.summary || '')}</p></div>
    <div class="row">${editing ? `<span class="pill warn" id="cDirty" ${S.cdirty?.[id] ? '' : 'hidden'}>Unsaved</span><button class="btn" data-act="cdiscard" data-id="${esc(id)}">Close editor</button><button class="btn primary" data-act="csave" data-id="${esc(id)}" ${S.canWrite ? '' : 'disabled'}>Save course</button>`
      : `<a class="btn" href="#preview-${esc(id)}">Preview as learner</a><button class="btn" data-act="cedit" data-id="${esc(id)}">Edit course</button>${c0.status === 'draft' ? `<button class="btn primary" data-act="cpublish" data-id="${esc(id)}" ${ls.length ? '' : 'disabled title="Add a lesson first"'}>Publish</button>` : `<button class="btn" data-act="cunpublish" data-id="${esc(id)}">Unpublish</button><button class="btn primary" data-act="acassign" data-course="${esc(id)}">Assign</button>`}`}</div></div>`;
  if (editing) return head + courseEditor(id, c);
  return head + `
  <div class="kpis">
    <div class="kpi"><span class="eyebrow">Content</span><span class="v num">${ls.length} lessons</span><span class="s">${(c.modules || []).length} modules · about ${Math.round(courseMinutes(c))} minutes</span></div>
    <div class="kpi pipe"><span class="eyebrow">Assigned</span><span class="v num">${ens.length}</span><span class="s">${new Set(ens.map(e => e.partnerId)).size} partners · ${ens.filter(e => enStatus(e) === 'overdue').length} overdue</span></div>
    <div class="kpi ok"><span class="eyebrow">Completed</span><span class="v num">${done}</span><span class="s">${pct(ens.length ? done / ens.length : 0)} completion</span></div>
    <div class="kpi camp"><span class="eyebrow">Average score</span><span class="v num">${scores.length ? Math.round(sum(scores, v => v) / scores.length) + '%' : '—'}</span><span class="s">pass mark ${c.passMark || 80}%</span></div>
  </div>
  <div class="grid-main">
    <section class="panel"><div class="panel-h"><h2>Course outline</h2><span class="small muted">${ls.length} lessons</span></div>
      ${(c.modules || []).length ? (c.modules || []).map((m, mi) => `<div class="cmod"><h3><span class="num muted">${mi + 1}</span> ${esc(m.title)}</h3><ol class="clessons">${(m.lessons || []).map(l => `<li><svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="${LTYPES[l.type]?.[1] || LTYPES.text[1]}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg><span>${esc(l.title)}</span><span class="small muted">${LTYPES[l.type]?.[0] || 'Reading'}${l.type === 'quiz' ? ' · ' + (l.quiz?.questions || []).length + ' questions' : ''} · ${Number(l.minutes) || 0} min</span></li>`).join('')}</ol></div>`).join('') : '<div class="empty">No lessons yet. Select <b>Edit course</b> to add modules and lessons.</div>'}
    </section>
    <div class="stack">
      <section class="panel"><div class="panel-h"><h2>Certification</h2></div><div class="panel-b small">${c.cert?.enabled ? `<p><b>${esc(c.cert.name || c.title)}</b></p><p class="muted" style="margin-top:4px">Awarded on completion with every quiz passed at ${c.passMark || 80}% or better. Valid for ${c.cert.validMonths || 12} months${c.planKey ? `; counts toward the business-plan step “${esc(PLAYBOOK.find(x => x[4] === c.planKey)?.[1] || c.planKey)}”` : ''}.</p>` : '<p class="muted">This course doesn’t award a certification. Turn one on in the editor.</p>'}</div></section>
      <section class="panel"><div class="panel-h"><h2>By partner</h2></div><div class="list">${[...new Set(ens.map(e => e.partnerId))].map(pid => { const e = ens.filter(x => x.partnerId === pid), d = e.filter(x => x.completedAt).length; return `<div class="li"><span class="t">${pRef(pid)}</span><span class="d"><span class="bar" style="display:inline-block;width:90px;vertical-align:middle"><i style="width:${d / e.length * 100}%;background:var(--ok)"></i></span> ${d} of ${e.length} complete</span></div>`; }).join('') || '<div class="empty">Not assigned to anyone yet.</div>'}</div></section>
    </div>
  </div>
  <section class="panel" style="margin-top:18px"><div class="panel-h"><h2>Learners</h2>${c0.status === 'published' ? `<button class="btn sm" data-act="acassign" data-course="${esc(id)}">Assign</button>` : ''}</div>
    ${table('c-en-' + id, [
      {h:'Learner', asc:1, sort:r => ctName(r.contactId).toLowerCase(), v:r => `${ref(r.contactId, 'partner', ctName(r.contactId))}`},
      {h:'Partner', asc:1, sort:r => pName(r.partnerId).toLowerCase(), v:r => pRef(r.partnerId)},
      {h:'Progress', r:1, sort:r => enProgress(r, c), v:r => `<span class="nowrap"><span class="bar" style="display:inline-block;width:80px;vertical-align:middle"><i style="width:${enProgress(r, c) * 100}%;background:var(--pipe)"></i></span> ${pct(enProgress(r, c))}</span>`},
      {h:'Status', asc:1, sort:r => ['overdue','assigned','in_progress','completed'].indexOf(enStatus(r)), v:r => stPill(EN_ST, enStatus(r))},
      {h:'Due', asc:1, sort:r => r.due || '9999', v:r => `<span class="nowrap">${r.due ? fdate(r.due) : '—'}</span>`},
      {h:'Score', r:1, sort:r => r.score ?? -1, v:r => r.score != null ? r.score + '%' : '—'},
      {h:'', v:r => `<span class="row nowrap" style="justify-content:flex-end"><a class="btn sm" href="#${esc(r.id)}">${r.completedAt ? 'Review' : 'Open player'}</a>${r.completedAt ? '' : `<button class="btn sm" data-act="enmark" data-id="${esc(r.id)}">Mark complete</button>`}<button class="btn sm ghost ${S.armed === 'enrm:' + r.id ? 'armed' : ''}" data-act="enrm" data-id="${esc(r.id)}" aria-label="Remove assignment">${S.armed === 'enrm:' + r.id ? 'Remove?' : '✕'}</button></span>`}
    ], ens, 'No one is assigned yet.')}</section>`;
}

function courseEditor(id, c) {
  const busy = k => S.busy['c:' + id + ':' + k];
  const ai = S.ai && !S.aiOff;
  return `<div class="banner info" style="margin-bottom:16px"><span>Editing. Changes are kept here until you select <b>Save course</b>. Learners see the saved version.</span></div>
  <section class="panel"><div class="panel-h"><h2>Course details</h2></div><div class="panel-b stack" style="gap:12px">
    <div class="field"><label for="cf-title">Title</label><input class="inp" id="cf-title" data-ccf="title" value="${esc(c.title || '')}"></div>
    <div class="field"><label for="cf-summary">Summary</label><textarea class="inp" id="cf-summary" data-ccf="summary" rows="2">${esc(c.summary || '')}</textarea></div>
    <div class="fgrid">
      <div class="field"><label for="cf-track">Track</label><select class="inp" id="cf-track" data-ccf="track">${Object.entries(TRACKS).map(([k, v]) => `<option value="${k}" ${c.track === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></div>
      <div class="field"><label for="cf-level">Level</label><select class="inp" id="cf-level" data-ccf="level">${LEVELS.map(l => `<option ${c.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label for="cf-passMark">Quiz pass mark (%)</label><input class="inp" type="number" min="1" max="100" id="cf-passMark" data-ccf="passMark" value="${esc(c.passMark || 80)}"></div>
      <div class="field"><label for="cf-planKey">Counts toward plan step</label><select class="inp" id="cf-planKey" data-ccf="planKey"><option value="">None</option>${PLAYBOOK.filter(x => x[0] === 'enable' || x[0] === 'onboard').map(x => `<option value="${x[4]}" ${c.planKey === x[4] ? 'selected' : ''}>${esc(x[1])}</option>`).join('')}</select></div>
    </div>
    <div class="fgrid">
      <label class="check" style="align-self:end;height:38px"><input type="checkbox" data-ccf="cert.enabled" ${c.cert?.enabled ? 'checked' : ''}><span>Awards a certification</span></label>
      <div class="field" style="grid-column:span 2"><label for="cf-certname">Certification name</label><input class="inp" id="cf-certname" data-ccf="cert.name" value="${esc(c.cert?.name || '')}" placeholder="e.g. Northwind Certified Sales Professional"></div>
      <div class="field"><label for="cf-certvalid">Valid for (months)</label><input class="inp" type="number" min="1" max="60" id="cf-certvalid" data-ccf="cert.validMonths" value="${esc(c.cert?.validMonths || 12)}"></div>
    </div></div></section>
  ${(c.modules || []).map((m, mi) => `<section class="panel cedmod"><div class="panel-h"><div class="row" style="flex:1;min-width:0"><span class="num muted">${mi + 1}</span><input class="inp" data-mf="${mi}" value="${esc(m.title)}" aria-label="Module ${mi + 1} title" style="flex:1;font-weight:700"></div>
      <div class="row"><button class="btn sm ghost" data-act="cmup" data-mi="${mi}" ${mi ? '' : 'disabled'} aria-label="Move module up">↑</button><button class="btn sm ghost" data-act="cmdown" data-mi="${mi}" ${mi < c.modules.length - 1 ? '' : 'disabled'} aria-label="Move module down">↓</button><button class="btn sm ghost ${S.armed === 'cmdel:' + mi ? 'armed' : ''}" data-act="cmdel" data-mi="${mi}">${S.armed === 'cmdel:' + mi ? 'Delete module?' : 'Delete'}</button></div></div>
      ${(m.lessons || []).map((l, li) => { const open = S.copen === `${mi}.${li}`, k = `${mi}.${li}`; return `<div class="cedlesson ${open ? 'open' : ''}">
        <div class="cedrow"><button class="linkbtn" data-act="clopen" data-k="${k}" aria-expanded="${open}"><svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="${LTYPES[l.type]?.[1]}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg> ${esc(l.title || 'Untitled lesson')}</button>
          <span class="small muted">${LTYPES[l.type]?.[0]}${l.type === 'quiz' ? ' · ' + (l.quiz?.questions || []).length + ' q' : ''} · ${Number(l.minutes) || 0} min</span>
          <span class="row"><button class="btn sm ghost" data-act="clup" data-k="${k}" ${li ? '' : 'disabled'} aria-label="Move lesson up">↑</button><button class="btn sm ghost" data-act="cldown" data-k="${k}" ${li < m.lessons.length - 1 ? '' : 'disabled'} aria-label="Move lesson down">↓</button><button class="btn sm ghost ${S.armed === 'cldel:' + k ? 'armed' : ''}" data-act="cldel" data-k="${k}">${S.armed === 'cldel:' + k ? 'Delete?' : '✕'}</button></span></div>
        ${open ? `<div class="cedbody">
          <div class="fgrid"><div class="field" style="grid-column:span 2"><label>Lesson title</label><input class="inp" data-lf="${k}.title" value="${esc(l.title || '')}"></div>
            <div class="field"><label>Type</label><select class="inp" data-lf="${k}.type">${Object.entries(LTYPES).map(([t, v]) => `<option value="${t}" ${l.type === t ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></div>
            <div class="field"><label>Minutes</label><input class="inp" type="number" min="1" data-lf="${k}.minutes" value="${esc(l.minutes || 5)}"></div></div>
          ${l.type === 'video' || l.type === 'file' ? `<div class="field"><label>${l.type === 'video' ? 'Video link (YouTube, Vimeo, or a .mp4 file)' : 'File link'}</label><input class="inp" data-lf="${k}.url" value="${esc(l.url || '')}" placeholder="https://">${S.up ? `<span class="small muted">Or <label class="linkbtn" for="lup-${k.replace('.', '-')}">upload a file</label><input type="file" id="lup-${k.replace('.', '-')}" data-lup="${k}" hidden> (20 MB max)</span>` : ''}</div>` : ''}
          ${l.type !== 'quiz' ? `<div class="field"><label>${l.type === 'text' ? 'Lesson text' : 'Notes shown with the ' + (l.type === 'video' ? 'video' : 'file')} <span class="muted">(# heading, - bullet, **bold**)</span></label><textarea class="inp" rows="${l.type === 'text' ? 12 : 4}" data-lf="${k}.body">${esc(l.body || '')}</textarea></div>
            ${ai ? `<div class="row"><button class="btn sm ai" data-act="claiwrite" data-k="${k}" ${busy('w' + k) ? 'disabled' : ''}>${busy('w' + k) ? '<span class="thinking">Writing…</span>' : '✦ ' + (l.body ? 'Rewrite' : 'Write') + ' this lesson with AI'}</button></div>` : ''}`
          : `<div class="qed">${(l.quiz?.questions || []).map((q, qi) => `<div class="qedq"><div class="row" style="align-items:flex-start"><span class="num muted" style="padding-top:9px">${qi + 1}</span><textarea class="inp" rows="2" data-qf="${k}.${qi}.q" aria-label="Question ${qi + 1}" style="flex:1">${esc(q.q || '')}</textarea><button class="btn sm ghost" data-act="cqdel" data-k="${k}" data-qi="${qi}" aria-label="Delete question">✕</button></div>
              <div class="qedopts">${(q.options || []).map((o, oi) => `<label class="qedopt"><input type="radio" name="qa-${k}-${qi}" data-qa="${k}.${qi}" value="${oi}" ${q.answer === oi ? 'checked' : ''} aria-label="Correct answer"><input class="inp" data-qo="${k}.${qi}.${oi}" value="${esc(o)}" aria-label="Option ${oi + 1}"></label>`).join('')}</div>
              <div class="field"><label class="small">Why this is the answer (shown after submitting)</label><input class="inp" data-qf="${k}.${qi}.explain" value="${esc(q.explain || '')}"></div></div>`).join('') || '<p class="small muted">No questions yet.</p>'}
            <div class="row"><button class="btn sm" data-act="cqadd" data-k="${k}">Add question</button>${ai ? `<button class="btn sm ai" data-act="claiquiz" data-k="${k}" ${busy('q' + k) ? 'disabled' : ''}>${busy('q' + k) ? '<span class="thinking">Writing questions…</span>' : '✦ Write questions from this module with AI'}</button>` : ''}</div>
            <p class="small muted">Select the circle beside the correct answer. Learners need ${c.passMark || 80}% to pass and can retake.</p></div>`}
        </div>` : ''}</div>`; }).join('')}
      <div class="panel-b row" style="border-top:1px solid var(--line)">${Object.entries(LTYPES).map(([t, v]) => `<button class="btn sm" data-act="cladd" data-mi="${mi}" data-type="${t}">+ ${v[0]}</button>`).join('')}</div>
    </section>`).join('')}
  <div class="row" style="margin-top:14px"><button class="btn" data-act="cmadd">+ Add module</button><span style="flex:1"></span><button class="btn danger ${S.armed === 'cdel:' + id ? 'armed' : ''}" data-act="cdel" data-id="${esc(id)}">${S.armed === 'cdel:' + id ? 'Delete course and its assignments?' : 'Delete course'}</button></div>`;
}

/* ----- lesson player ----- */
function vPlayer(enId, previewId) {
  const en = enId ? EN(enId) : null, c = CR(en ? en.courseId : previewId);
  if (!c) return `<div class="panel"><div class="empty">That course isn’t here any more.</div></div>`;
  const key = enId || 'preview-' + c.id, ls = lessonsOf(c);
  const prog = en ? (en.progress || {}) : (S.prevProg[c.id] || (S.prevProg[c.id] = {}));
  const doneN = ls.filter(l => prog[l.id]?.done).length, finished = en ? !!en.completedAt : ls.length && doneN === ls.length;
  let cur = S.playAt[key] && ls.find(l => l.id === S.playAt[key]) ? S.playAt[key] : (ls.find(l => !prog[l.id]?.done) || ls[0])?.id;
  if (S.playAt[key] === '_done') cur = '_done';
  const L = ls.find(l => l.id === cur), idx = ls.findIndex(l => l.id === cur);
  const learner = en ? (S._full || S).contacts[en.contactId] : null;
  const head = `${crumbs(['Home','home'],['Academy','academy'],[c.title, c.id],[en ? ctName(en.contactId) : 'Preview'])}
  <div class="phead"><div><div class="row">${trackPill(c.track)}${en ? stPill(EN_ST, enStatus(en)) : '<span class="pill warn">Preview: progress isn’t saved</span>'}</div><h1 style="margin-top:6px">${esc(c.title)}</h1>
    <p class="sub">${en ? `Recording progress for ${ref(en.contactId, 'partner', ctName(en.contactId))} · ${pRef(en.partnerId)}${en.due ? ' · due ' + fdate(en.due) : ''}` : 'This is what a learner sees.'}</p></div>
    <div class="pprog"><span class="small muted">${doneN} of ${ls.length} lessons</span><span class="bar"><i style="width:${ls.length ? doneN / ls.length * 100 : 0}%;background:var(--ok)"></i></span></div></div>`;
  const outline = `<nav class="panel pout" aria-label="Lessons">${(c.modules || []).map((m, mi) => `<div class="poutm"><span class="eyebrow">${mi + 1} · ${esc(m.title)}</span>${(m.lessons || []).map(l => `<button class="poutl ${l.id === cur ? 'on' : ''} ${prog[l.id]?.done ? 'done' : ''}" data-act="plgo" data-key="${esc(key)}" data-l="${esc(l.id)}" ${l.id === cur ? 'aria-current="step"' : ''}><span class="pck" aria-hidden="true">${prog[l.id]?.done ? '✓' : ''}</span><span>${esc(l.title)}</span><span class="small muted">${l.type === 'quiz' ? 'Quiz' : (Number(l.minutes) || 0) + 'm'}</span></button>`).join('')}</div>`).join('')}
    ${finished ? `<button class="poutl ${cur === '_done' ? 'on' : ''}" data-act="plgo" data-key="${esc(key)}" data-l="_done"><span class="pck">★</span><span>${c.cert?.enabled ? 'Certificate' : 'Completion'}</span></button>` : ''}</nav>`;
  let main;
  if (cur === '_done' || (!L && finished)) {
    main = en ? `<div class="pdone"><h2>${c.cert?.enabled ? 'Certified' : 'Course complete'}</h2><p class="muted">${esc(ctName(en.contactId))} finished on ${fdate((en.completedAt || '').slice(0, 10))}${en.score != null ? ` with an average quiz score of ${en.score}%` : ''}.${en.certExpires ? ` The certification is valid through ${fdate(en.certExpires)}.` : ''}</p>
      <div class="certprev"><img src="${svgSrc(certSVG(en, c))}" alt="Certificate for ${esc(ctName(en.contactId))}"></div>
      <div class="row">${S.dl ? `<button class="btn primary" data-act="accertdl" data-id="${esc(en.id)}" data-kind="png">Download PNG</button><button class="btn" data-act="accertdl" data-id="${esc(en.id)}" data-kind="svg">Download SVG</button>` : ''}<a class="btn" href="#${esc(c.id)}">Back to course</a></div></div>`
      : `<div class="pdone"><h2>That’s the whole course</h2><p class="muted">In a real assignment, finishing here records completion${c.cert?.enabled ? ' and awards the certification' : ''}.</p><button class="btn" data-act="prevreset" data-id="${esc(c.id)}">Start the preview again</button></div>`;
  } else if (!L) main = '<div class="empty">This course has no lessons yet.</div>';
  else {
    const p = prog[L.id] || {}, last = idx === ls.length - 1;
    let content = '';
    if (L.type === 'quiz') content = quizView(key, c, L, p, !!en);
    else {
      if (L.type === 'video') { const u = L.url || '', mp4 = /\.(mp4|webm|mov)(\?|$)/i.test(u) || u.startsWith('blob:') || u.includes('/_blob/');
        content += u ? (mp4 ? `<video class="pvideo" src="${esc(u)}" controls preload="metadata"></video>` : `<a class="pvidlink" href="${esc(u)}" target="_blank" rel="noopener"><span class="pplay" aria-hidden="true">▶</span><span><b>Watch the video</b><span class="small muted">Opens ${esc((u.match(/^https?:\/\/([^/]+)/) || [])[1] || 'the video')} in a new tab · ${Number(L.minutes) || 0} min</span></span></a>`) : '<p class="muted">No video link yet.</p>'; }
      if (L.type === 'file') content += L.url ? `<a class="pvidlink" href="${esc(L.url)}" target="_blank" rel="noopener"><span class="pplay" aria-hidden="true">⬇</span><span><b>Open the file</b><span class="small muted">${esc(L.fileName || 'Course material')}</span></span></a>` : '<p class="muted">No file attached yet.</p>';
      content += `<div class="pbody">${mdLite(L.body)}</div>`;
    }
    main = `<article class="plesson"><span class="eyebrow">${esc(L.moduleTitle)} · lesson ${idx + 1} of ${ls.length}</span><h2>${esc(L.title)}</h2>${content}
      <div class="pnav"><button class="btn" data-act="plgo" data-key="${esc(key)}" data-l="${esc(ls[idx - 1]?.id || '')}" ${idx ? '' : 'disabled'}>← Previous</button>
      ${L.type !== 'quiz' ? (p.done ? `<button class="btn primary" data-act="plgo" data-key="${esc(key)}" data-l="${esc(last ? (finished ? '_done' : '') : ls[idx + 1].id)}" ${last && !finished ? 'disabled' : ''}>${last ? 'Finish' : 'Next →'}</button>`
        : `<button class="btn primary" data-act="pldone" data-key="${esc(key)}" data-l="${esc(L.id)}" ${en && !S.canWrite ? 'disabled' : ''}>${last ? 'Complete course' : 'Mark complete and continue →'}</button>`)
        : (p.done ? `<button class="btn primary" data-act="plgo" data-key="${esc(key)}" data-l="${esc(last ? '_done' : ls[idx + 1].id)}">${last ? 'Finish' : 'Next →'}</button>` : '')}</div></article>`;
  }
  return head + `<div class="pgrid">${outline}<section class="panel pmain">${main}</section></div>`;
}
function quizView(key, c, L, p, real) {
  const qs = L.quiz?.questions || [], pass = c.passMark || 80, ans = S.quizAns[key + L.id] || {}, res = S.quizRes[key + L.id];
  if (!qs.length) return '<p class="muted">This quiz has no questions yet.</p>';
  return `${p.done && !res ? `<div class="banner info" style="margin:10px 0"><span>Passed with <b>${p.score}%</b>${p.attempts > 1 ? ` after ${p.attempts} attempts` : ''}. You can retake it to practise.</span></div>` : ''}
  <p class="small muted">${qs.length} questions · pass mark ${pass}%</p>
  <form class="quiz" id="quizForm" data-key="${esc(key)}" data-l="${esc(L.id)}">${qs.map((q, qi) => { const r = res?.items[qi]; return `<fieldset class="qq ${r ? (r.ok ? 'right' : 'wrong') : ''}"><legend><span class="num muted">${qi + 1}.</span> ${esc(q.q)}</legend>
    ${(q.options || []).map((o, oi) => `<label class="qopt ${r && oi === q.answer ? 'correct' : ''} ${r && !r.ok && oi === r.picked ? 'picked' : ''}"><input type="radio" name="q${qi}" value="${oi}" ${ans[qi] === oi ? 'checked' : ''} ${res ? 'disabled' : ''} data-qpick="${qi}"> <span>${esc(o)}</span></label>`).join('')}
    ${r ? `<p class="qexp"><b>${r.ok ? 'Correct.' : 'Not quite.'}</b> ${esc(q.explain || '')}</p>` : ''}</fieldset>`; }).join('')}
  ${res ? `<div class="banner ${res.score >= pass ? 'info' : 'warn'}"><span><b>${res.score}%</b> · ${res.score >= pass ? 'Passed.' : `Below the ${pass}% pass mark.`}${real ? '' : ' (Preview: not saved.)'}</span><button class="btn sm" type="button" data-act="qretake" data-key="${esc(key)}" data-l="${esc(L.id)}">Retake</button></div>`
    : `<div class="row"><button class="btn primary" type="submit">Submit answers</button><span class="small muted">${Object.keys(ans).length} of ${qs.length} answered</span></div>`}</form>`;
}

/* ----- modal: assign training and AI course builder ----- */
function acModal() {
  const M = S.acModal;
  if (M.kind === 'assign') {
    const courses = vals(S.courses).filter(c => c.status === 'published').sort((a, b) => a.title.localeCompare(b.title));
    const parts = sortedPartners();
    const pid = M.partnerId || (S.focus && S.partners[S.focus] ? S.focus : '');
    const contacts = pid ? vals(S.contacts).filter(c => c.partnerId === pid).sort((a, b) => a.name.localeCompare(b.name)) : [];
    const taken = cid => M.courseId && enOf(M.courseId, cid);
    const pick = contacts.filter(c => M.sel.has(c.id) && !taken(c.id)).length;
    return `<div class="scrim" data-act="acclose-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="asH" style="max-width:640px">
      <div class="mhead"><div><h2 id="asH">Assign training</h2><p class="small muted">Pick a course, a partner and the people who should take it.</p></div><button class="btn sm ghost" data-act="acclose" aria-label="Close">✕</button></div>
      <div class="mbody">
        <div class="fgrid" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr)"><div class="field"><label for="asCourse">Course</label><select class="inp" id="asCourse"><option value="">Choose a course…</option>${courses.map(c => `<option value="${esc(c.id)}" ${M.courseId === c.id ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select></div>
          <div class="field"><label for="asDue">Due date</label><input class="inp" type="date" id="asDue" value="${esc(M.due)}"></div></div>
        <div class="field"><label for="asPartner">Partner</label><select class="inp" id="asPartner" ${S.focus ? 'disabled' : ''}><option value="">Choose a partner…</option>${parts.map(p => `<option value="${esc(p.id)}" ${pid === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
        ${pid ? `<fieldset class="aspeople"><legend class="small"><b>People</b> · ${contacts.length} at ${esc(pName(pid))} <button type="button" class="linkbtn" data-act="asall">${contacts.every(c => M.sel.has(c.id) || taken(c.id)) ? 'Clear all' : 'Select all'}</button></legend>
          ${contacts.map(c => { const t = taken(c.id); return `<label class="check aspick ${t ? 'muted' : ''}"><input type="checkbox" data-aspick="${esc(c.id)}" ${M.sel.has(c.id) || t ? 'checked' : ''} ${t ? 'disabled' : ''}><span>${esc(c.name)} <span class="small muted">${esc(c.title)}${t ? ' · already assigned' : ''}</span></span></label>`; }).join('') || '<p class="small muted">No contacts for this partner yet. Add them on the Partners map.</p>'}</fieldset>` : ''}
      </div>
      <div class="mfoot"><button class="btn" data-act="acclose">Cancel</button><button class="btn primary" data-act="asgo" ${M.courseId && pick && S.canWrite && !M.running ? '' : 'disabled'}>${M.running ? 'Assigning…' : `Assign to ${pick} ${pick === 1 ? 'person' : 'people'}`}</button></div></div></div>`;
  }
  // AI course builder
  return `<div class="scrim" data-act="acclose-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="agH" style="max-width:680px">
    <div class="mhead"><div><h2 id="agH">Build a course with AI</h2><p class="small muted">Claude drafts modules, lessons and quizzes. You review and edit before publishing.</p></div><button class="btn sm ghost" data-act="acclose" aria-label="Close">✕</button></div>
    <form class="mbody" id="acGenForm">
      <div class="field"><label for="agTopic">What should partners learn?</label><textarea class="inp" id="agTopic" rows="3" placeholder="e.g. How to position Northwind immutable backup against ransomware for healthcare clinics, and run a recovery readiness assessment">${esc(M.topic || '')}</textarea></div>
      <div class="fgrid">
        <div class="field"><label for="agTrack">Track</label><select class="inp" id="agTrack">${Object.entries(TRACKS).map(([k, v]) => `<option value="${k}" ${M.track === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></div>
        <div class="field"><label for="agLevel">Level</label><select class="inp" id="agLevel">${LEVELS.map(l => `<option ${M.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label for="agMods">Modules</label><select class="inp" id="agMods">${[2, 3, 4, 5].map(n => `<option ${Number(M.mods || 3) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="field"><label for="agAud">Audience</label><select class="inp" id="agAud"><option value="">All partner types</option>${Object.entries(PTYPE).map(([k, v]) => `<option value="${k}" ${M.aud === k ? 'selected' : ''}>${esc(v[0])}</option>`).join('')}</select></div>
      </div>
      <label class="check"><input type="checkbox" id="agCert" ${M.cert !== false ? 'checked' : ''}><span>Award a certification on completion</span></label>
      <div class="field"><label>Source material <span class="muted">(optional: a text, Markdown or CSV file Claude should teach from)</span></label>
        <div class="row"><label class="btn sm" for="agFile">Attach file</label><input type="file" id="agFile" accept=".txt,.md,.csv,.json,text/*" hidden>${M.srcName ? `<span class="small">📎 ${esc(M.srcName)} <button type="button" class="linkbtn" data-act="agsrcdel">remove</button></span>` : '<span class="small muted">None</span>'}</div></div>
      ${M.err ? `<div class="banner warn"><span>${esc(M.err)}</span></div>` : ''}
      <div class="mfoot" style="margin:0 -20px -18px"><button class="btn" type="button" data-act="acclose">Cancel</button><button class="btn ai" type="submit" ${S.busy.acgen ? 'disabled' : ''}>${S.busy.acgen ? '<span class="thinking">Building the course… about a minute</span>' : '✦ Build course'}</button></div>
    </form></div></div>`;
}

/* ----- actions ----- */
S.cdraft = {}; S.cdirty = {}; S.playAt = {}; S.prevProg = {}; S.quizAns = {}; S.quizRes = {}; S.copen = null; S.acModal = null;
const cloneC = c => JSON.parse(JSON.stringify({title:c.title, summary:c.summary || '', track:c.track || 'sales', level:c.level || 'Foundation', status:c.status || 'draft', passMark:c.passMark || 80, planKey:c.planKey || '', cert:c.cert || {enabled:false, name:'', validMonths:12}, modules:c.modules || [], order:c.order ?? 99}));
const markCDirty = id => { S.cdirty[id] = true; const d = $('#cDirty'); if (d) d.hidden = false; };
const lpath = (id, k) => { const [mi, li] = k.split('.').map(Number); return S.cdraft[id].modules[mi].lessons[li]; };
const curCourse = () => { const r = route(); return S.cdraft[r] ? r : null; };
function finishFields(en, c, prog) {
  const ls = lessonsOf(c), all = ls.length && ls.every(l => prog[l.id]?.done);
  if (!all || en.completedAt) return {};
  const qs = ls.filter(l => l.type === 'quiz').map(l => prog[l.id]?.score).filter(v => v != null), score = qs.length ? Math.round(sum(qs, v => v) / qs.length) : null;
  const out = {completedAt:now(), score};
  if (c.cert?.enabled) { out.certId = (initials(brand().vendorName) + '-' + (c.track || 'c').slice(0, 3) + '-' + Date.now().toString(36)).toUpperCase(); out.certExpires = addMonths(today(), Number(c.cert.validMonths) || 12); }
  return out;
}
async function saveProgress(key, lessonId, rec, jump = true) {
  if (key.startsWith('preview-')) { const cid = key.slice(8); S.prevProg[cid] = {...(S.prevProg[cid] || {}), [lessonId]:rec}; return true; }
  const en = EN(key), c = CR(en.courseId), prog = {...(en.progress || {}), [lessonId]:rec};
  const fin = finishFields(en, c, prog);
  const ok = await write(db => db.doc('enrollments/' + key).update({progress:prog, lastAt:now(), startedAt:en.startedAt || now(), ...fin}), fin.completedAt ? (fin.certId ? 'Course complete. Certification awarded.' : 'Course complete.') : '');
  if (ok && fin.completedAt && jump) S.playAt[key] = '_done';
  return ok;
}
async function genCourse() {
  const M = S.acModal, topic = ($('#agTopic')?.value || '').trim();
  if (!topic) { M.err = 'Describe what partners should learn.'; render(); return; }
  Object.assign(M, {topic, track:$('#agTrack').value, level:$('#agLevel').value, mods:Number($('#agMods').value), aud:$('#agAud').value, cert:$('#agCert').checked, err:''});
  await withAI('acgen', async sample => {
    const b = brand();
    const prompt = `You design partner training for ${b.vendorName}, a B2B vendor selling through channel partners (MSPs, VARs, systems integrators, referral partners, distributors).
Build a ${M.level}-level ${TRACKS[M.track][0].toLowerCase()} course${M.aud ? ' for ' + PTYPE[M.aud][0] + ' partners' : ''}.
Topic: ${topic}
${M.src ? 'Teach from this source material (prefer its facts over general knowledge):\n---\n' + M.src.slice(0, 30000) + '\n---\n' : ''}
Requirements:
- Exactly ${M.mods} modules. Each module has 2–3 reading lessons followed by one quiz lesson with 3–4 multiple-choice questions about that module.
- Reading lessons: 180–350 words of practical, specific teaching in simple markdown (## subheadings, "- " bullets, **bold**). End each with a short "Try it" exercise.
- Never invent statistics, prices, customer names or product specs; use [X] placeholders where a number belongs.
- Each question has exactly 4 options, one correct (0-based "answer" index), and a one-sentence "explain".
- Realistic minutes per lesson (reading 5–12, quiz 5).
Return only JSON: {"title": string, "summary": string (one sentence), "certName": string, "modules": [{"title": string, "lessons": [{"type": "text", "title": string, "minutes": number, "body": string} | {"type": "quiz", "title": string, "minutes": number, "questions": [{"q": string, "options": [string, string, string, string], "answer": number, "explain": string}]}]}]}`;
    const r = await sample.json(prompt, {cache:false, modelTier:'complex'});
    const mods = (Array.isArray(r?.modules) ? r.modules : []).slice(0, 6).map(m => ({id:newId('m'), title:String(m?.title || 'Module').slice(0, 120), lessons:(Array.isArray(m?.lessons) ? m.lessons : []).slice(0, 8).map(l => {
      const type = l?.type === 'quiz' ? 'quiz' : 'text', base = {id:newId('l'), type, title:String(l?.title || (type === 'quiz' ? 'Check your understanding' : 'Lesson')).slice(0, 140), minutes:Math.max(1, Math.min(60, Number(l?.minutes) || (type === 'quiz' ? 5 : 8)))};
      if (type === 'text') return {...base, body:String(l?.body || '').slice(0, 8000)};
      return {...base, quiz:{questions:(Array.isArray(l?.questions) ? l.questions : []).slice(0, 10).map(q => { const opts = (Array.isArray(q?.options) ? q.options : []).slice(0, 5).map(o => String(o).slice(0, 300)); return {id:newId('q'), q:String(q?.q || '').slice(0, 500), options:opts, answer:Math.max(0, Math.min(opts.length - 1, Number(q?.answer) || 0)), explain:String(q?.explain || '').slice(0, 500)}; }).filter(q => q.q && q.options.length >= 2)}};
    }).filter(l => l.type === 'text' ? l.body : l.quiz.questions.length)})).filter(m => m.lessons.length);
    if (!mods.length) { M.err = 'That draft came back empty. Try again, or add more detail.'; return; }
    const id = newId('crs-');
    const doc = {title:String(r.title || topic).slice(0, 140), summary:String(r.summary || '').slice(0, 400), track:M.track, level:M.level, status:'draft', passMark:80, planKey:'', order:99,
      cert:{enabled:!!M.cert, name:String(r.certName || '').slice(0, 120), validMonths:12}, modules:mods, aiDrafted:true, createdAt:now(), updatedAt:now(), by:S.uid || ''};
    if (await write(db => db.doc('courses/' + id).set(doc), 'Course drafted. Review it, then publish.')) { S.acModal = null; S.cdraft[id] = cloneC(doc); location.hash = id; }
  });
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, F = S.acF || (S.acF = {track:'', status:'', q:'', cstat:'', learnQ:''});
  const known = ['actrack','acclear','accstat','acnew','acgen','acassign','acclose','acclose-bg','asall','asgo','agsrcdel','cedit','cdiscard','csave','cpublish','cunpublish','cdel','cmadd','cmup','cmdown','cmdel','cladd','clopen','clup','cldown','cldel','cqadd','cqdel','claiwrite','claiquiz','plgo','pldone','qretake','prevreset','enmark','enrm','accertdl','accertview','acoverdue'];
  if (!known.includes(act)) return;
  const id = b.dataset.id, d = id && S.cdraft[id];
  if (act === 'actrack') { F.track = b.dataset.v; render(); }
  else if (act === 'accstat') { F.cstat = b.dataset.v; render(); }
  else if (act === 'acclear') { Object.assign(F, {track:'', status:'', q:''}); render(); }
  else if (act === 'acoverdue') { if (!S.sort['ac-learn'] || S.sort['ac-learn'].col !== 5) S.sort['ac-learn'] = {col:5, dir:-1}; }
  else if (act === 'acnew') {
    const cid = newId('crs-'), doc = {title:'Untitled course', summary:'', track:'sales', level:'Foundation', status:'draft', passMark:80, planKey:'', order:99, cert:{enabled:false, name:'', validMonths:12},
      modules:[{id:newId('m'), title:'Module 1', lessons:[{id:newId('l'), type:'text', title:'Welcome', minutes:5, body:''}]}], createdAt:now(), updatedAt:now(), by:S.uid || ''};
    if (await write(db => db.doc('courses/' + cid).set(doc), 'Course created')) { S.cdraft[cid] = cloneC(doc); S.copen = '0.0'; location.hash = cid; }
  }
  else if (act === 'acgen') { S.acModal = {kind:'gen', track:'sales', level:'Foundation', mods:3, cert:true}; render(); setTimeout(() => $('#agTopic')?.focus(), 30); }
  else if (act === 'acassign') { S.acModal = {kind:'assign', courseId:b.dataset.course || '', partnerId:b.dataset.pid || '', sel:new Set(b.dataset.cid ? [b.dataset.cid] : []), due:addDays(today(), 30)}; if (b.dataset.cid && !S.acModal.partnerId) S.acModal.partnerId = S.contacts[b.dataset.cid]?.partnerId || ''; render(); }
  else if (act === 'acclose' || (act === 'acclose-bg' && e.target === b)) { if (S.busy.acgen || S.acModal?.running) return; S.acModal = null; render(); }
  else if (act === 'agsrcdel') { delete S.acModal.src; delete S.acModal.srcName; render(); }
  else if (act === 'asall') { const M = S.acModal, pid = M.partnerId || S.focus, cs = vals(S.contacts).filter(c => c.partnerId === pid && !(M.courseId && enOf(M.courseId, c.id))); const all = cs.every(c => M.sel.has(c.id)); cs.forEach(c => all ? M.sel.delete(c.id) : M.sel.add(c.id)); render(); }
  else if (act === 'asgo') {
    const M = S.acModal, c = CR(M.courseId); if (!c) return;
    const people = [...M.sel].filter(cid => S.contacts[cid] && !enOf(M.courseId, cid)); if (!people.length) return;
    M.running = true; render();
    const ok = await write(async db => { for (const cid of people) await db.doc('enrollments/' + newId('en-')).set({courseId:M.courseId, contactId:cid, partnerId:S.contacts[cid].partnerId, assignedAt:now(), due:M.due || '', progress:{}, by:S.uid || ''}); }, `Assigned “${c.title}” to ${people.length} ${people.length === 1 ? 'person' : 'people'}`);
    M.running = false; if (ok) S.acModal = null; render();
  }
  else if (act === 'cedit') { S.cdraft[id] = cloneC(CR(id)); S.cdirty[id] = false; S.copen = null; render(); }
  else if (act === 'cdiscard') { delete S.cdraft[id]; delete S.cdirty[id]; S.armed = null; render(); }
  else if (act === 'csave') {
    const t = (d.title || '').trim(); if (!t) { toast('Give the course a title.'); return; }
    d.passMark = Math.max(1, Math.min(100, Number(d.passMark) || 80)); d.cert.validMonths = Math.max(1, Number(d.cert.validMonths) || 12);
    if (await write(db => db.doc('courses/' + id).update({...d, title:t, updatedAt:now()}), 'Course saved')) { delete S.cdraft[id]; delete S.cdirty[id]; render(); }
  }
  else if (act === 'cpublish') write(db => db.doc('courses/' + id).update({status:'published', publishedAt:now(), updatedAt:now()}), 'Published. You can now assign it.');
  else if (act === 'cunpublish') write(db => db.doc('courses/' + id).update({status:'draft', updatedAt:now()}), 'Moved back to draft. Existing assignments keep working.');
  else if (act === 'cdel') {
    if (S.armed !== 'cdel:' + id) { S.armed = 'cdel:' + id; render(); return; }
    const ens = vals(S.enrollments).filter(x => x.courseId === id);
    if (await write(async db => { for (const x of ens) await db.doc('enrollments/' + x.id).delete(); await db.doc('courses/' + id).delete(); }, 'Course deleted')) { delete S.cdraft[id]; S.armed = null; location.hash = 'academy'; }
  }
  else if (act === 'cmadd') { const cid = curCourse(); S.cdraft[cid].modules.push({id:newId('m'), title:'Module ' + (S.cdraft[cid].modules.length + 1), lessons:[]}); markCDirty(cid); render(); }
  else if (act === 'cmup' || act === 'cmdown') { const cid = curCourse(), ms = S.cdraft[cid].modules, i = +b.dataset.mi, j = act === 'cmup' ? i - 1 : i + 1; [ms[i], ms[j]] = [ms[j], ms[i]]; S.copen = null; markCDirty(cid); render(); }
  else if (act === 'cmdel') { const cid = curCourse(), k = 'cmdel:' + b.dataset.mi; if (S.armed !== k) { S.armed = k; render(); return; } S.cdraft[cid].modules.splice(+b.dataset.mi, 1); S.armed = null; S.copen = null; markCDirty(cid); render(); }
  else if (act === 'cladd') { const cid = curCourse(), m = S.cdraft[cid].modules[+b.dataset.mi], t = b.dataset.type; m.lessons.push({id:newId('l'), type:t, title:t === 'quiz' ? 'Check your understanding' : 'New ' + LTYPES[t][0].toLowerCase(), minutes:5, body:'', ...(t === 'quiz' ? {quiz:{questions:[{id:newId('q'), q:'', options:['', '', '', ''], answer:0, explain:''}]}} : {})}); S.copen = `${b.dataset.mi}.${m.lessons.length - 1}`; markCDirty(cid); render(); }
  else if (act === 'clopen') { S.copen = S.copen === b.dataset.k ? null : b.dataset.k; render(); }
  else if (act === 'clup' || act === 'cldown') { const cid = curCourse(), [mi, li] = b.dataset.k.split('.').map(Number), ls = S.cdraft[cid].modules[mi].lessons, j = act === 'clup' ? li - 1 : li + 1; [ls[li], ls[j]] = [ls[j], ls[li]]; S.copen = null; markCDirty(cid); render(); }
  else if (act === 'cldel') { const cid = curCourse(), k = 'cldel:' + b.dataset.k; if (S.armed !== k) { S.armed = k; render(); return; } const [mi, li] = b.dataset.k.split('.').map(Number); S.cdraft[cid].modules[mi].lessons.splice(li, 1); S.armed = null; S.copen = null; markCDirty(cid); render(); }
  else if (act === 'cqadd') { const cid = curCourse(), l = lpath(cid, b.dataset.k); (l.quiz = l.quiz || {questions:[]}).questions.push({id:newId('q'), q:'', options:['', '', '', ''], answer:0, explain:''}); markCDirty(cid); render(); }
  else if (act === 'cqdel') { const cid = curCourse(), l = lpath(cid, b.dataset.k); l.quiz.questions.splice(+b.dataset.qi, 1); markCDirty(cid); render(); }
  else if (act === 'claiwrite') { const cid = curCourse(), k = b.dataset.k; await withAI('c:' + cid + ':w' + k, async sample => {
      const c = S.cdraft[cid], l = lpath(cid, k), m = c.modules[+k.split('.')[0]];
      const prompt = `Write one lesson for a ${c.level} ${TRACKS[c.track][0].toLowerCase()} course for channel partners of ${brand().vendorName}.
Course: ${c.title}. ${c.summary}
Module: ${m.title}. Other lessons in this module: ${m.lessons.filter(x => x !== l).map(x => x.title).join('; ') || 'none'}.
Lesson title: ${l.title}. ${l.type === 'video' ? 'This is the text that accompanies a video: a short summary and 3–5 key points.' : 'Write 200–350 words.'}
${l.body ? 'Current draft to improve:\n' + l.body + '\n' : ''}Use simple markdown (## subheadings, "- " bullets, **bold**), practical and specific, ending with a short "Try it" exercise. Never invent statistics, prices or customer names; use [X] placeholders. Return only the lesson text.`;
      const {text} = await sample(prompt, {cache:false}); l.body = String(text || '').trim().slice(0, 8000); markCDirty(cid); toast('Lesson drafted. Review, then save the course.'); }); }
  else if (act === 'claiquiz') { const cid = curCourse(), k = b.dataset.k; await withAI('c:' + cid + ':q' + k, async sample => {
      const c = S.cdraft[cid], l = lpath(cid, k), m = c.modules[+k.split('.')[0]];
      const material = m.lessons.filter(x => x.type !== 'quiz').map(x => `## ${x.title}\n${x.body || ''}`).join('\n\n') || `${c.title}: ${c.summary}`;
      const prompt = `Write 4 multiple-choice questions that check understanding of this training module for channel partners. Test application, not trivia. Each has exactly 4 plausible options, one correct.
Module: ${m.title}
${material.slice(0, 20000)}
Return only JSON: {"questions": [{"q": string, "options": [string, string, string, string], "answer": number (0-based), "explain": string (one sentence)}]}`;
      const r = await sample.json(prompt, {cache:false});
      const qs = (Array.isArray(r?.questions) ? r.questions : []).map(q => { const opts = (q?.options || []).slice(0, 5).map(String); return {id:newId('q'), q:String(q?.q || ''), options:opts, answer:Math.max(0, Math.min(opts.length - 1, Number(q?.answer) || 0)), explain:String(q?.explain || '')}; }).filter(q => q.q && q.options.length >= 2);
      if (!qs.length) { toast('No usable questions came back. Try again.'); return; }
      l.quiz = {questions:[...(l.quiz?.questions || []).filter(q => q.q.trim()), ...qs]}; markCDirty(cid); toast(`${qs.length} questions added. Check the answers, then save.`); }); }
  else if (act === 'plgo') { if (!b.dataset.l) return; S.playAt[b.dataset.key] = b.dataset.l; render(); document.querySelector('.pmain')?.scrollIntoView({block:'nearest'}); }
  else if (act === 'pldone') {
    const key = b.dataset.key, lid = b.dataset.l, c = CR(key.startsWith('preview-') ? key.slice(8) : EN(key).courseId), ls = lessonsOf(c), i = ls.findIndex(l => l.id === lid);
    if (await saveProgress(key, lid, {done:true, at:now()})) { if (S.playAt[key] !== '_done') S.playAt[key] = ls[i + 1]?.id || (key.startsWith('preview-') ? '_done' : lid); render(); }
  }
  else if (act === 'qretake') { delete S.quizRes[b.dataset.key + b.dataset.l]; S.quizAns[b.dataset.key + b.dataset.l] = {}; render(); }
  else if (act === 'prevreset') { S.prevProg[id] = {}; delete S.playAt['preview-' + id]; Object.keys(S.quizRes).filter(k => k.startsWith('preview-' + id)).forEach(k => delete S.quizRes[k]); render(); }
  else if (act === 'enmark') {
    const en = EN(id), c = CR(en.courseId), prog = {...(en.progress || {})};
    lessonsOf(c).forEach(l => { if (!prog[l.id]?.done) prog[l.id] = {done:true, at:now(), manual:true, ...(l.type === 'quiz' ? {score:100} : {})}; });
    write(db => db.doc('enrollments/' + id).update({progress:prog, lastAt:now(), markedBy:S.uid || '', ...finishFields(en, c, prog)}), 'Marked complete');
  }
  else if (act === 'enrm') { if (S.armed !== 'enrm:' + id) { S.armed = 'enrm:' + id; render(); return; } S.armed = null; write(db => db.doc('enrollments/' + id).delete(), 'Assignment removed'); }
  else if (act === 'accertview') { S.playAt[id] = '_done'; }
  else if (act === 'accertdl') { const en = EN(id); if (en) dlSVG(certSVG(en, CR(en.courseId)), `${ctName(en.contactId)} ${CR(en.courseId)?.cert?.name || 'certificate'}`, b.dataset.kind); }
});
document.addEventListener('input', e => {
  const el = e.target, cid = curCourse();
  if (el.id === 'acQ') { S.acF.q = el.value; render(); return; }
  if (el.id === 'acLearnQ') { S.acF.learnQ = el.value; render(); return; }
  if (!cid) return;
  const d = S.cdraft[cid];
  if (el.dataset.ccf && el.type !== 'checkbox') { const [a, bb] = el.dataset.ccf.split('.'); if (bb) d[a][bb] = el.value; else d[a] = el.value; markCDirty(cid); }
  else if (el.dataset.mf) { d.modules[+el.dataset.mf].title = el.value; markCDirty(cid); }
  else if (el.dataset.lf) { const p = el.dataset.lf.split('.'), l = lpath(cid, p[0] + '.' + p[1]); if (p[2] === 'type') return; l[p[2]] = p[2] === 'minutes' ? Number(el.value) || 0 : el.value; markCDirty(cid); }
  else if (el.dataset.qf) { const [mi, li, qi, f] = el.dataset.qf.split('.'), l = lpath(cid, mi + '.' + li); l.quiz.questions[+qi][f] = el.value; markCDirty(cid); }
  else if (el.dataset.qo) { const [mi, li, qi, oi] = el.dataset.qo.split('.').map(Number), l = lpath(cid, mi + '.' + li); l.quiz.questions[qi].options[oi] = el.value; markCDirty(cid); }
});
document.addEventListener('change', async e => {
  const el = e.target, cid = curCourse();
  if (el.id === 'acStatus') { S.acF.status = el.value; render(); }
  else if (el.id === 'asCourse') { S.acModal.courseId = el.value; render(); }
  else if (el.id === 'asPartner') { S.acModal.partnerId = el.value; S.acModal.sel = new Set(); render(); }
  else if (el.id === 'asDue') S.acModal.due = el.value;
  else if (el.dataset.aspick) { el.checked ? S.acModal.sel.add(el.dataset.aspick) : S.acModal.sel.delete(el.dataset.aspick); render(); }
  else if (el.id === 'agFile') { const f = el.files[0]; el.value = ''; if (!f) return; if (f.size > 2e6) { toast('Use a text file under 2 MB.'); return; } try { S.acModal.src = await f.text(); S.acModal.srcName = f.name; ['agTopic'].forEach(i => { S.acModal.topic = $('#agTopic')?.value || S.acModal.topic; }); render(); } catch (x) { toast('Couldn’t read that file.'); } }
  else if (el.dataset.qpick != null) { const f = el.closest('form'), k = f.dataset.key + f.dataset.l; (S.quizAns[k] = S.quizAns[k] || {})[+el.dataset.qpick] = +el.value; const s = f.querySelector('.row .small'); if (s) s.textContent = `${Object.keys(S.quizAns[k]).length} of ${f.querySelectorAll('fieldset').length} answered`; }
  else if (cid && el.dataset.ccf === 'cert.enabled') { S.cdraft[cid].cert.enabled = el.checked; markCDirty(cid); }
  else if (cid && el.dataset.lf && el.dataset.lf.endsWith('.type')) { const p = el.dataset.lf.split('.'), l = lpath(cid, p[0] + '.' + p[1]); l.type = el.value; if (el.value === 'quiz' && !l.quiz) l.quiz = {questions:[{id:newId('q'), q:'', options:['', '', '', ''], answer:0, explain:''}]}; markCDirty(cid); render(); }
  else if (cid && el.dataset.qa) { const [mi, li, qi] = el.dataset.qa.split('.'), l = lpath(cid, mi + '.' + li); l.quiz.questions[+qi].answer = +el.value; markCDirty(cid); }
  else if (cid && el.dataset.lup) {
    const f = el.files[0]; el.value = ''; if (!f || !S.up) return;
    if (f.size > 20e6) { toast('Files must be under 20 MB.'); return; }
    toast('Uploading ' + f.name + '…');
    try { const r = await S.up.upload(f); const l = lpath(cid, el.dataset.lup); l.url = r.url; l.fileName = f.name; l.assetId = r.id; markCDirty(cid); render(); toast('Uploaded. Save the course to keep it.'); }
    catch (x) { toast(x?.code === 'not_granted' || x?.code === 'not_uploader' ? 'Only editors can upload files.' : 'Upload failed. Check the file type.'); }
  }
});
document.addEventListener('submit', async e => {
  const f = e.target;
  if (f.id === 'acGenForm') { e.preventDefault(); genCourse(); }
  else if (f.id === 'quizForm') {
    e.preventDefault();
    const key = f.dataset.key, lid = f.dataset.l, c = CR(key.startsWith('preview-') ? key.slice(8) : EN(key).courseId), L = lessonsOf(c).find(l => l.id === lid), qs = L.quiz?.questions || [], ans = S.quizAns[key + lid] || {};
    if (Object.keys(ans).length < qs.length) { toast(`Answer all ${qs.length} questions first.`); return; }
    const items = qs.map((q, i) => ({picked:ans[i], ok:ans[i] === q.answer})), score = Math.round(items.filter(x => x.ok).length / qs.length * 100), pass = c.passMark || 80;
    S.quizRes[key + lid] = {items, score};
    const en = key.startsWith('preview-') ? null : EN(key), prev = en ? en.progress?.[lid] : S.prevProg[c.id]?.[lid];
    const attempts = (prev?.attempts || 0) + 1, best = Math.max(score, prev?.score || 0);
    if (score >= pass || prev?.done) await saveProgress(key, lid, {done:true, at:now(), score:best, attempts}, false);
    else if (en) await write(db => db.doc('enrollments/' + key).update({['progress']:{...(en.progress || {}), [lid]:{done:false, score:best, attempts, at:now()}}, lastAt:now(), startedAt:en.startedAt || now()}));
    render();
  }
});
