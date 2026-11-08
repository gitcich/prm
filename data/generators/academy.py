import json, random, datetime, re, sys
sys.path.insert(0, '.')
from courses import COURSES
random.seed(42)
T0 = datetime.date(2026, 10, 19)
D = lambda n: (T0 + datetime.timedelta(days=n)).isoformat()
TS = lambda n, h=15: D(n) + f'T{h:02d}:{random.randint(0,59):02d}:00.000Z'
base = json.load(open('../sample-data.json'))
courses = {}
for c in COURSES:
    mods = []
    for mi, (mt, lessons) in enumerate(c['modules']):
        ls = []
        for li, l in enumerate(lessons):
            l = dict(l); l['id'] = f"{c['id'][4:]}-{mi+1}{li+1}"
            if l['type'] == 'quiz':
                for qi, q in enumerate(l['quiz']['questions']): q['id'] = f"{l['id']}q{qi+1}"
            ls.append(l)
        mods.append({'id': f"{c['id'][4:]}-m{mi+1}", 'title': mt, 'lessons': ls})
    doc = {k: v for k, v in c.items() if k not in ('id', 'modules')}
    doc.update(modules=mods, passMark=80, createdAt='2026-06-01T15:00:00.000Z', updatedAt='2026-09-20T15:00:00.000Z', publishedAt='2026-06-05T15:00:00.000Z' if c['status']=='published' else '', by='', sample=True)
    courses[c['id']] = doc
lessons = lambda cid: [l for m in courses[cid]['modules'] for l in m['lessons']]
STAGE = {p: v['stage'] for p, v in base['partners'].items()}
SALES = re.compile(r'sales|account|ceo|founder|president|owner|director|channel|business|principal|managing|revenue|vp|alliance|capture|consultant|recruit', re.I)
TECH = re.compile(r'engineer|architect|solutions|service|security|delivery|technical|operations|practice', re.I)
MKT = re.compile(r'marketing', re.I)
ens = {}
n = 0
def enroll(cid, ct, mode, assigned_ago, due_in=None, done_ago=None):
    global n
    n += 1; eid = f'en-s{n:03d}'
    c = courses[cid]; ls = lessons(cid); prog = {}
    e = dict(courseId=cid, contactId=ct, partnerId=base['contacts'][ct]['partnerId'], assignedAt=TS(-assigned_ago, 14), due=D(due_in) if due_in is not None else '', progress=prog, by='', sample=True)
    if mode == 'assigned': pass
    elif mode in ('progress', 'overdue'):
        k = random.randint(1, max(1, len(ls) - 1))
        for i, l in enumerate(ls[:k]):
            at = TS(-max(1, assigned_ago - 3 - i * 2))
            if l['type'] == 'quiz':
                sc = random.choice([75, 80, 100, 100, 67, 83]); prog[l['id']] = {'done': sc >= 80, 'score': sc, 'attempts': 1 if sc >= 80 else 2, 'at': at}
            else: prog[l['id']] = {'done': True, 'at': at}
        e['startedAt'] = TS(-max(1, assigned_ago - 3)); e['lastAt'] = max(v['at'] for v in prog.values())
    elif mode == 'done':
        scores = []
        for i, l in enumerate(ls):
            at = TS(-(done_ago + len(ls) - i))
            if l['type'] == 'quiz':
                sc = random.choice([80, 83, 90, 100, 100, 75]); att = 1 if sc >= 80 else 2; sc = max(sc, 80); scores.append(sc)
                prog[l['id']] = {'done': True, 'score': sc, 'attempts': att, 'at': at}
            else: prog[l['id']] = {'done': True, 'at': at}
        e['startedAt'] = TS(-(done_ago + len(ls) + 2)); e['completedAt'] = TS(-done_ago, 17); e['lastAt'] = e['completedAt']
        e['score'] = round(sum(scores) / len(scores)) if scores else None
        if c['cert']['enabled']:
            done_d = T0 - datetime.timedelta(days=done_ago)
            m = done_d.month - 1 + c['cert']['validMonths']; exp = done_d.replace(year=done_d.year + m // 12, month=m % 12 + 1, day=min(done_d.day, 28))
            e['certId'] = f"NW-{'SLS' if cid=='crs-sales' else 'TEC'}-{done_d.strftime('%y%m')}-{n:03d}"; e['certExpires'] = exp.isoformat()
    ens[eid] = e
for ct, v in base['contacts'].items():
    pid = v['partnerId']; st = STAGE.get(pid); title = v.get('title', '')
    if not st: continue
    if st == 'recruit': enroll('crs-onboard', ct, random.choice(['assigned', 'progress']), 12, 20); continue
    if st == 'onboard': enroll('crs-onboard', ct, random.choice(['progress', 'progress', 'done']), 30, 10, done_ago=6); continue
    if st == 'enable':
        enroll('crs-onboard', ct, 'done', 120, None, done_ago=random.randint(40, 90))
        if TECH.search(title): enroll('crs-tech', ct, random.choice(['progress', 'overdue', 'done']), 50, random.choice([-6, 14, 21]), done_ago=random.randint(5, 25))
        elif SALES.search(title): enroll('crs-sales', ct, random.choice(['progress', 'overdue', 'done', 'assigned']), 45, random.choice([-4, 10, 25]), done_ago=random.randint(5, 30))
        if MKT.search(title): enroll('crs-comarketing', ct, 'progress', 20, 20)
        continue
    # activate / grow
    enroll('crs-onboard', ct, 'done', 400, None, done_ago=random.randint(200, 380))
    if TECH.search(title):
        enroll('crs-tech', ct, random.choice(['done', 'done', 'progress']), 300, 30, done_ago=random.randint(30, 260))
    if SALES.search(title) or not TECH.search(title):
        mode = random.choice(['done', 'done', 'done', 'progress'])
        done_ago = random.choice([60, 120, 200, 330, 338, 350, 372])
        enroll('crs-sales', ct, mode, done_ago + 20 if mode == 'done' else 40, 21 if mode != 'done' else None, done_ago=done_ago)
    if MKT.search(title) or (st == 'grow' and random.random() < .3): enroll('crs-comarketing', ct, random.choice(['done', 'progress']), 90, 15, done_ago=random.randint(10, 60))
    if pid in ('p-bluebonnet', 'p-peachtree') and SALES.search(title): enroll('crs-ransom', ct, random.choice(['progress', 'assigned', 'done']), 25, 14, done_ago=8)
import collections
print('courses', len(courses), 'enrollments', len(ens))
print(collections.Counter('done' if e.get('completedAt') else ('overdue' if e['due'] and e['due'] < T0.isoformat() else ('prog' if e['progress'] else 'assigned')) for e in ens.values()))
certs = [e for e in ens.values() if e.get('certId')]
print('certs', len(certs), 'expiring<=45d', sum(1 for e in certs if T0.isoformat() <= e['certExpires'] <= D(45)), 'expired', sum(1 for e in certs if e['certExpires'] < T0.isoformat()))
json.dump({'courses': courses, 'enrollments': ens}, open('academy.json', 'w'), ensure_ascii=False)
comb = json.load(open('../seed6/combined.json')); comb.update(courses=courses, enrollments=ens)
json.dump(comb, open('../sample-data.json', 'w'), ensure_ascii=False)
