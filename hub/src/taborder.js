/* ---------- tab order: press and hold a tab, then drag it ---------- */
const TAB_KEY = 'pcc.tabOrder';
function tabOrder() {
  const keys = Object.keys(VIEWS), saved = (S.tabOrder || []).filter(k => VIEWS[k]);
  return [...saved, ...keys.filter(k => !saved.includes(k))];
}
const tabsCustom = () => (S.tabOrder || []).filter(k => VIEWS[k]).join() !== Object.keys(VIEWS).filter(k => (S.tabOrder || []).includes(k)).join() || false;
function loadTabOrder() {
  try { const t = JSON.parse(localStorage.getItem(TAB_KEY) || 'null'); if (Array.isArray(t)) S.tabOrder = t; } catch (e) {}
}
async function syncTabOrder() {
  if (!S.db || !S.uid) return;
  try { const d = await S.db.doc('data/users/' + S.uid + '/prefs').get(); const t = d?.exists ? d.data()?.tabOrder : null; if (Array.isArray(t) && t.join() !== (S.tabOrder || []).join()) { S.tabOrder = t; try { localStorage.setItem(TAB_KEY, JSON.stringify(t)); } catch (e) {} schedule(); } } catch (e) {}
}
function saveTabOrder(order, msg) {
  S.tabOrder = order;
  try { order ? localStorage.setItem(TAB_KEY, JSON.stringify(order)) : localStorage.removeItem(TAB_KEY); } catch (e) {}
  if (S.db && S.uid) S.db.doc('data/users/' + S.uid + '/prefs').set({tabOrder:order || [], updatedAt:now()}).catch(() => {});
  if (msg) toast(msg);
}
const TD = {timer:0, el:null, start:null, active:false, horiz:false, pid:null, suppress:false};
const railLinks = () => [...document.querySelectorAll('#rail a[data-tab]')];
function tdEnd(commit) {
  clearTimeout(TD.timer); TD.timer = 0;
  if (!TD.active) { TD.el = null; return; }
  const rail = $('#rail'); rail.classList.remove('reordering');
  TD.el.classList.remove('dragging'); TD.el.style.transform = '';
  const order = railLinks().map(a => a.dataset.tab);
  TD.active = false; S.tabDrag = false; TD.el = null; TD.suppress = true; setTimeout(() => { TD.suppress = false; }, 350);
  if (commit && order.join() !== tabOrder().join()) saveTabOrder(order, 'Tab order saved. Press and hold a tab to move it again.');
  render();
}
document.addEventListener('pointerdown', e => {
  const a = e.target.closest('#rail a[data-tab]'); if (!a || e.button > 0) return;
  TD.el = a; TD.start = {x:e.clientX, y:e.clientY}; TD.pid = e.pointerId;
  TD.timer = setTimeout(() => {
    TD.active = true; S.tabDrag = true;
    const rail = $('#rail'); TD.horiz = getComputedStyle(rail).flexDirection === 'row';
    rail.classList.add('reordering'); a.classList.add('dragging');
    try { a.setPointerCapture(TD.pid); } catch (x) {}
    if (navigator.vibrate) try { navigator.vibrate(15); } catch (x) {}
  }, e.pointerType === 'mouse' ? 280 : 420);
});
document.addEventListener('pointermove', e => {
  if (!TD.el || e.pointerId !== TD.pid) return;
  if (!TD.active) { if (Math.hypot(e.clientX - TD.start.x, e.clientY - TD.start.y) > 8) { clearTimeout(TD.timer); TD.el = null; } return; }
  e.preventDefault();
  const rail = $('#rail'), links = railLinks().filter(x => x !== TD.el);
  const pos = TD.horiz ? e.clientX : e.clientY;
  let before = null;
  for (const x of links) { const r = x.getBoundingClientRect(), mid = TD.horiz ? r.left + r.width / 2 : r.top + r.height / 2; if (pos < mid) { before = x; break; } }
  const last = railLinks().pop();
  if (before) { if (TD.el.nextElementSibling !== before) rail.insertBefore(TD.el, before); }
  else if (last !== TD.el) last.after(TD.el);
  if (TD.horiz) { const r = rail.getBoundingClientRect(); if (e.clientX < r.left + 30) rail.scrollLeft -= 12; else if (e.clientX > r.right - 30) rail.scrollLeft += 12; }
}, {passive:false});
document.addEventListener('touchmove', e => { if (TD.active) e.preventDefault(); }, {passive:false});
document.addEventListener('pointerup', e => { if (TD.el && e.pointerId === TD.pid) tdEnd(true); });
document.addEventListener('pointercancel', e => { if (TD.el && e.pointerId === TD.pid) tdEnd(false); });
document.addEventListener('click', e => { if ((TD.suppress || TD.active) && e.target.closest('#rail a[data-tab]')) { e.preventDefault(); e.stopPropagation(); } }, true);
document.addEventListener('contextmenu', e => { if ((TD.timer || TD.active) && e.target.closest('#rail a[data-tab]')) e.preventDefault(); });
document.addEventListener('dragstart', e => { if (e.target.closest?.('#rail')) e.preventDefault(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && TD.active) { const order = tabOrder(); TD.active = false; S.tabDrag = false; TD.el = null; $('#rail').classList.remove('reordering'); render(); return; }
  const a = e.target.closest?.('#rail a[data-tab]'); if (!a || !e.altKey || !e.shiftKey) return;
  const dir = {ArrowUp:-1, ArrowLeft:-1, ArrowDown:1, ArrowRight:1}[e.key]; if (!dir) return;
  e.preventDefault();
  const order = tabOrder(), i = order.indexOf(a.dataset.tab), j = i + dir; if (j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]]; saveTabOrder(order, `${VIEWS[order[j]].label} moved ${dir < 0 ? 'up' : 'down'}`); render();
  setTimeout(() => $(`#rail a[data-tab="${order[j]}"]`)?.focus(), 0);
});
document.addEventListener('click', e => { if (e.target.closest('[data-act="tabreset"]')) { saveTabOrder(null, 'Tabs back in their original order'); render(); } });
