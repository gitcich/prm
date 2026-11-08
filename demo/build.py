"""Build the public demo of the Partner Command Center into docs/ for GitHub Pages.

The hub normally runs inside claude.ai, which supplies window.claude (shared database,
Claude, connectors). The demo swaps in a browser-only runtime: sample data that each
visitor can change (kept in their own browser), canned AI answers, and simulated
Apollo/Notion connections.
"""
import json, pathlib, re, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs'
HUB_URL = 'https://claude.ai/artifact/PQatsPhYqisWaschGNrmnY'
MANUAL_URL = 'https://claude.ai/artifact/BQqigB6NVNxADuigEhvyd4'
STORE = 'pcc-demo-v1'

hub = (ROOT / 'hub' / 'index.html').read_text()
seed = (ROOT / 'data' / 'sample-data.json').read_text()
cap = (ROOT / 'manual' / 'capture.py').read_text()
mock = cap[cap.index('MOCK = r"""') + len('MOCK = r"""'):cap.index('""" % SEED')]

def sub(s, a, b):
    assert a in s, a[:80]
    return s.replace(a, b, 1)

# 1. load from the visitor's browser if they've used the demo before
mock = sub(mock, "const DATA = %s; window.DATA = DATA;",
  "const SEED = %s; let DATA = SEED;\n  try { const saved = JSON.parse(localStorage.getItem('" + STORE + "') || 'null'); if (saved && saved.partners) DATA = saved; } catch (e) {}\n  window.DATA = DATA;\n"
  "  let saveT; const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem('" + STORE + "', JSON.stringify(DATA)); } catch (e) {} }, 400); };")
mock = sub(mock, "const fire = c => (L[c] || []).forEach(f => setTimeout(() => f(snap(c)), 0));",
  "const fire = c => { persist(); (L[c] || []).forEach(f => setTimeout(() => f(snap(c)), 0)); };")
mock = mock.replace('%s', seed, 1)
# 2. real downloads
mock = sub(mock, "const dl = {save:async (o) => { window.__dl = {filename:o?.filename, size:o?.data?.size}; return {status:'saved'}; }};",
  "const dl = {save:async (o) => { const u = URL.createObjectURL(o.data); const a = document.createElement('a'); a.href = u; a.download = o.filename || 'download'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); return {status:'saved'}; }};")
mock = sub(mock, "n === 'user' ? {can:() => true, id:async () => 'u_me'}", "n === 'user' ? {can:() => true, canEdit:() => true, isOwner:() => true, id:async () => 'u_demo', name:async () => 'Demo user'}")

# 3. demo bar, reset, and links to private apps
chrome = r"""
<style>
#demoBar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9999;display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center;
  max-width:calc(100vw - 32px);padding:8px 10px 8px 14px;border-radius:999px;background:#1B1D2A;color:#fff;font:13px/1.35 "Atkinson Hyperlegible",system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25)}
#demoBar b{color:#F5C77A}#demoBar a{color:#fff}
#demoBar button{font:inherit;font-weight:700;border:0;border-radius:999px;padding:5px 12px;cursor:pointer;background:#fff;color:#1B1D2A}
#demoBar button.x{background:transparent;color:#fff;padding:5px 8px}
@media (max-width:640px){#demoBar{bottom:8px;padding:6px 6px 6px 12px;gap:6px;font-size:12px;flex-wrap:nowrap}#demoBar .long,#demoBar a{display:none}#demoBar button{padding:4px 10px}}
</style>
<div id="demoBar" role="region" aria-label="About this demo"><span><b>Demo</b> with sample data<span class="long">. Your changes stay in this browser; AI answers and CRM connections are simulated</span>.</span>
<a href="manual/" target="_blank" rel="noopener">Manual</a><button type="button" id="demoReset">Reset demo</button><button type="button" class="x" id="demoHide" aria-label="Hide this bar">✕</button></div>
<script>
document.getElementById('demoReset').onclick = () => { if (confirm('Reset the demo? Your changes will be cleared and the sample data restored.')) { try { localStorage.removeItem('""" + STORE + r"""'); } catch (e) {} location.hash = 'home'; location.reload(); } };
document.getElementById('demoHide').onclick = () => document.getElementById('demoBar').remove();
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="https://claude.ai/"]'); if (!a) return;
  e.preventDefault(); e.stopPropagation();
  const t = document.getElementById('toastRoot');
  if (t) { t.textContent = 'That opens a separate private app (' + (a.textContent.trim() || 'source tool') + '). It isn’t part of this public demo.'; }
}, true);
</script>
"""

page = hub.replace(MANUAL_URL, 'manual/')
page = sub(page, "Six partners also appear in the Pipeline Portal and the Engagement Desk (sometimes under different names; each partner page shows the match). The other ten exist only in this hub, so their Portal links won’t find them.",
  "Everything here is invented: 16 partners, their deals, accounts, leads, campaigns and events. Click around, change things, approve a deal registration or open the partner portal.")
html = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<meta name="description" content="A working demo of Partner Command Center: partner lifecycle, account mapping, deal registration, MDF, campaigns, events, an LMS and attribution in one hub.">'
        '<style>:root{box-sizing:border-box}body{margin:0;padding:0}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style>'
        '</head><body>' + mock + page + chrome + '</body></html>')

if OUT.exists(): shutil.rmtree(OUT)
(OUT / 'manual' / 'shots').mkdir(parents=True)
(OUT / 'index.html').write_text(html)
man = (ROOT / 'manual' / 'index.html').read_text()
man = man.replace(HUB_URL, '../')
man = re.sub(r'https://claude\.ai/code/artifact/[0-9a-f-]+', '../#tools', man)
(OUT / 'manual' / 'index.html').write_text(man)
for f in (ROOT / 'manual' / 'shots').glob('*.webp'): shutil.copy(f, OUT / 'manual' / 'shots' / f.name)
(OUT / '.nojekyll').write_text('')
print('demo written to', OUT, round(len(html) / 1024), 'KB')
