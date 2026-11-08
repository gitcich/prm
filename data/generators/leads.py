import json, random, re, datetime as dt
random.seed(9)
D=json.load(open('../sample-data.json'))
T=dt.date(2026,10,28)
iso=lambda d: d.isoformat()
def dts(d,h=15): return f"{d.isoformat()}T{h:02d}:{random.randint(0,59):02d}:00Z"
P=D['partners']; deals=D['deals']; contacts=D['contacts']
norm=lambda s: re.sub(r'[^a-z0-9]','',re.sub(r'\b(inc|llc|ltd|corp|co|the)\b','',s.lower()))
slug=lambda s: re.sub(r'[^a-z0-9]+','',s.lower())[:22]+'.example'
IND=[('school|isd|academy|college|university|district','Education'),('health|clinic|medical|hospital|care|pharma|bio','Healthcare'),('bank|credit|financial|capital|insurance','Financial services'),('law|legal|partners llp','Legal'),('county|city of|state|municipal|authority|transit','Public sector'),('steel|manufactur|industries|fabrication|plastics|works','Manufacturing'),('logistic|freight|transport|shipping','Logistics'),('energy|oil|power|utility|solar','Energy'),('retail|market|foods|grocery','Retail'),('media|studio','Media')]
def industry(n):
    for k,v in IND:
        if re.search(k,n.lower()): return v
    return random.choice(['Professional services','Manufacturing','Healthcare','Financial services','Technology'])
OWN=['Maya Chen','Derek Olsen','Priya Natarajan','Tom Becker','Alicia Ramos','Jordan Lee']
REGION_STATE={}
for pid,p in P.items():
    cs=[c for c in contacts.values() if c.get('partnerId')==pid and c.get('state')]
    REGION_STATE[pid]=[(c.get('city'),c.get('state')) for c in cs] or [('','')]
acc={}; byname={}
def get_acct(name, pid):
    k=norm(name)
    if k in byname: return acc[byname[k]]
    aid='ac-s%03d'%(len(acc)+1)
    city,st=random.choice(REGION_STATE[pid])
    a={'name':name,'domain':slug(name),'industry':industry(name),'city':city or '','state':(st or '')[:2],'employees':random.choice([120,250,400,800,1500,3200,6000]),'vendorStatus':'none','partners':{},'stage':'mapped','motion':'','vendorOwner':random.choice(OWN),'tier':random.choice(['Strategic','Growth','Growth','Emerging']),'nextStep':'','nextStepDate':'','notes':'','plays':[],'thread':[],'source':'Sample','sample':True,'createdAt':dts(T-dt.timedelta(days=random.randint(20,120)))}
    a['id']=aid; acc[aid]=a; byname[k]=aid; return a
rank={'none':0,'prospect':1,'opportunity':2,'customer':3}
for did,d in deals.items():
    a=get_acct(d['account'], d['partnerId'])
    st={'won':'customer','lost':'prospect'}.get(d['stage'],'opportunity')
    cur=a['partners'].get(d['partnerId'],{}).get('status','none')
    if rank[st]>=rank[cur]: a['partners'][d['partnerId']]={'status':st,'role':random.choice(['resell','resell','services']),'owner':''}
    if rank[st]>rank[a['vendorStatus']]: a['vendorStatus']=st
# partner owners from partner contacts
for a in acc.values():
    for pid,r in a['partners'].items():
        cs=[c['name'] for c in contacts.values() if c.get('partnerId')==pid]
        r['owner']=random.choice(cs) if cs else ''
# second partner overlaps
pids=list(P)
for a in random.sample(list(acc.values()), 14):
    other=random.choice([p for p in pids if p not in a['partners']])
    a['partners'][other]={'status':random.choice(['customer','customer','prospect','none']),'role':random.choice(['services','referral','influence']),'owner':''}
# extra accounts
EXTRA=[('Riverbend Health System','customer','none'),('Granite Peak Credit Union','customer','prospect'),('Lone Pine County','customer','none'),('Harborview Logistics','customer','prospect'),('Sterling Ridge Academy','customer','none'),('Copperline Manufacturing','customer','prospect'),('Bayside Orthopedics','customer','none'),('Northgate Freight','prospect','prospect'),('Summit Legal Group','prospect','prospect'),('Prairie Wind Energy','prospect','none'),('Cypress Bend ISD','prospect','prospect'),('Ironwood Plastics','none','customer'),('Clearwater Municipal Utility','none','customer'),('Maple & Finch LLP','none','prospect'),('Redstone Biologics','none','prospect'),('Bluewater Credit Union','none','none'),('Evergreen Senior Living','prospect','customer'),('Kestrel Aerospace Parts','none','prospect')]
for i,(n,ps,vs) in enumerate(EXTRA):
    pid=pids[i%len(pids)]
    a=get_acct(n,pid); a['partners'][pid]={'status':ps,'role':random.choice(['resell','services']),'owner':random.choice([c['name'] for c in contacts.values() if c.get('partnerId')==pid] or [''])}; a['vendorStatus']=vs
    a['stage']='identified' if ps=='none' else 'mapped'
for a in acc.values():
    a['partnerIds']=list(a['partners'])
    ovs=[(rank[a['vendorStatus']],rank[r['status']]) for r in a['partners'].values()]
    if any(v==2 or p==2 for v,p in ovs): a['stage']=random.choice(['cosell','cosell','engaging']); a['motion']=random.choice(['cosell','partner','cosell'])
    elif any(v==3 and p==3 for v,p in ovs): a['stage']='won'; a['motion']=random.choice(['partner','cosell'])
    elif any(p==3 for v,p in ovs): a['stage']=random.choice(['mapped','engaging']); a['motion']='partner'
    elif any(v==3 for v,p in ovs): a['stage']=random.choice(['mapped','engaging']); a['motion']='vendor'
    if a['stage'] in ('cosell','engaging') or random.random()<.35:
        a['nextStep']=random.choice(['Joint discovery call with IT leadership','Partner intro to the CFO','Send co-branded recovery assessment offer','Align on one owner and close plan','Executive sponsor call','Review renewal timing with the partner','Invite to the regional lunch & learn','Share reference customer from the same vertical'])
        a['nextStepDate']=iso(T+dt.timedelta(days=random.randint(-12,24)))
# saved plays and notes on a few
sel=[a for a in acc.values() if a['stage'] in ('cosell','engaging')][:3]
for a in sel:
    pid=list(a['partners'])[0]
    a['plays']=[{'id':'pl-s'+a['id'][-3:],'title':'Joint recovery readiness review','motion':'Co-sell','lead':'Joint','why':'Both teams have a reason to be in the room, and a readiness review gives the buyer something useful before any pricing talk.','steps':['Partner: confirm the IT lead and propose two dates','Vendor: bring a solutions engineer and the assessment template','Joint: run the 60-minute review and agree one follow-up','Partner: send the written summary within two days'],'talkTrack':'We have been helping teams like yours prove they can recover in hours, not days. Would a short review of where you stand be useful before your next planning cycle?','targets':['IT director','CFO'],'signals':['A second meeting is booked','They share their current recovery plan'],'partnerId':pid,'status':'active','savedAt':dts(T-dt.timedelta(days=6))}]
    a['thread']=[{'by':'sample','at':dts(T-dt.timedelta(days=9)),'text':'Partner says the IT lead is open to a review after month-end close. Agreed the partner leads the first call.'}]
# leads
FN=['Avery','Jordan','Taylor','Morgan','Casey','Riley','Jamie','Quinn','Reese','Dakota','Skyler','Rowan','Emerson','Hayden','Parker','Sydney','Logan','Cameron','Drew','Elliot','Marisol','Andre','Keisha','Raj','Lena','Victor','Hannah','Omar','Grace','Diego']
LN=['Patel','Nguyen','Garcia','Johnson','Kim','Okafor','Martinez','Brooks','Sullivan','Chen','Rivera','Foster','Hughes','Reyes','Coleman','Ward','Price','Bennett','Murphy','Ortiz']
TI=['IT Director','CIO','VP of Infrastructure','Systems Administrator','CFO','Director of Operations','IT Manager','CISO','Network Engineer','Practice Manager']
SRC=['Webinar','Website form','Event','Referral','Partner sourced','Apollo.io','Trade show']
plan=['new']*8+['assigned']*11+['accepted']*6+['working']*13+['qualified']*6+['converted']*5+['declined']*3+['disqualified']*3
random.shuffle(plan)
leads={}; accts=list(acc.values()); used=set()
for i,st in enumerate(plan):
    a=random.choice(accts); fn=random.choice(FN); ln=random.choice(LN)
    while (fn,ln) in used: fn=random.choice(FN); ln=random.choice(LN)
    used.add((fn,ln))
    pid='' if st=='new' and random.random()<.75 else random.choice(list(a['partners']))
    created=T-dt.timedelta(days=random.randint(2,55))
    if st=='assigned': created=T-dt.timedelta(days=random.choice([0,1,1,1,2,2,2,0,1,5,6]))
    l={'first':fn,'last':ln,'name':f'{fn} {ln}','title':random.choice(TI),'email':f'{fn.lower()}.{ln.lower()}@{a["domain"]}','phone':'','company':a['name'],'accountId':a['id'],'partnerId':pid,'status':st,'rating':random.choice(['hot','warm','warm','cold']),'owner':'partner' if st in ('accepted','working','qualified','converted') else 'vendor','source':random.choice(SRC),'notes':random.choice(['','','Asked about immutable backups after an insurance audit.','Came to the lunch & learn; wants pricing for 300 seats.','Downloaded the recovery checklist twice.']),'nextStep':'','nextStepDate':'','createdAt':dts(created),'sample':True}
    h=[{'action':'Created','at':dts(created),'by':'sample'}]
    if pid and st!='new':
        asg=created+dt.timedelta(days=random.randint(0,1)) if st!='assigned' else created
        l['assignedAt']=dts(asg,14); h.append({'action':'Assigned to '+P[pid]['name'],'at':l['assignedAt'],'by':'sample'})
        if st in ('accepted','working','qualified','converted'):
            acc_t=dt.datetime.fromisoformat(l['assignedAt'][:-1])+dt.timedelta(hours=random.choice([3,6,18,26,40,70]))
            l['acceptedAt']=acc_t.strftime('%Y-%m-%dT%H:%M:00Z'); h.append({'action':'Accepted by '+P[pid]['name'],'at':l['acceptedAt'],'by':'sample'})
        if st=='declined': h.append({'action':'Declined by '+P[pid]['name'],'note':random.choice(['Outside our service area','No capacity this quarter','Existing conflict with another vendor']),'at':dts(asg+dt.timedelta(days=1)),'by':'sample'})
        if st in ('working','qualified','converted'): h.append({'action':'Working','at':dts(asg+dt.timedelta(days=2)),'by':'sample'})
        if st in ('qualified','converted'): h.append({'action':'Qualified','at':dts(asg+dt.timedelta(days=6)),'by':'sample'})
    if st=='converted':
        ds=[k for k,d in deals.items() if norm(d['account'])==norm(a['name'])]
        if ds: l['dealId']=ds[0]; h.append({'action':'Converted to opportunity','at':dts(created+dt.timedelta(days=12)),'by':'sample'})
        else: l['status']='qualified'
    if st=='disqualified': h.append({'action':'Disqualified','note':'No budget until next fiscal year','at':dts(created+dt.timedelta(days=8)),'by':'sample'})
    if st in ('working','qualified','accepted'):
        l['nextStep']=random.choice(['Discovery call','Send recovery assessment','Book demo with SE','Follow up after board meeting']); l['nextStepDate']=iso(T+dt.timedelta(days=random.randint(-4,14)))
    l['history']=h; leads['ld-s%03d'%(i+1)]=l
# deal registrations
regs={}
def reg(i,pid,acct,dom,city,st,cname,ctitle,product,amount,close,status,created_days,**kw):
    c=T-dt.timedelta(days=created_days)
    r={'partnerId':pid,'submitter':{'name':random.choice([x['name'] for x in contacts.values() if x.get('partnerId')==pid] or ['Partner rep']),'email':''},'account':{'name':acct,'domain':dom,'city':city,'state':st,'industry':industry(acct)},'contact':{'name':cname,'title':ctitle,'email':cname.lower().replace(' ','.')+'@'+dom,'phone':''},'product':product,'amount':amount,'closeDate':iso(T+dt.timedelta(days=close)),'oppStage':random.choice(['Discovery','Qualified','Proposal sent']),'need':kw.get('need','Replace an aging backup appliance before the support contract ends, and prove recovery to their cyber insurer.'),'competitors':kw.get('comp','Veeam, Rubrik'),'vendorInvolved':'','leadId':'','status':status,'source':'portal','sample':True,'createdAt':dts(c),'history':[{'action':'Submitted','at':dts(c),'by':'sample'}]}
    if status in ('approved','rejected','info'):
        dd=c+dt.timedelta(days=random.randint(1,3))
        if status=='approved':
            r['approvedAt']=dts(dd); r['expiresAt']=iso(dd+dt.timedelta(days=90)) if 'exp' not in kw else iso(T+dt.timedelta(days=kw['exp'])); r['decision']={'label':'Approved','note':'','by':'sample','at':dts(dd)}; r['history'].append({'action':'Approved; protected until '+r['expiresAt'],'at':dts(dd),'by':'sample'})
            if kw.get('deal'): r['dealId']=kw['deal']
        elif status=='rejected': r['decision']={'label':'Rejected','note':kw.get('note','Already protected for another partner.'),'by':'sample','at':dts(dd)}; r['history'].append({'action':'Rejected','note':r['decision']['note'],'at':dts(dd),'by':'sample'})
        else: r['decision']={'label':'Question','note':kw.get('note','Who is the economic buyer, and is budget approved for this fiscal year?'),'by':'sample','at':dts(dd)}; r['history'].append({'action':'More information requested','note':r['decision']['note'],'at':dts(dd),'by':'sample'})
    regs['dr-s%03d'%i]=r
pick=lambda pid: [ (k,d) for k,d in deals.items() if d['partnerId']==pid and d['stage'] in ('registered','qualified','proposal')]
# approved linked to existing open deals
n=1
for pid in ['p-bluebonnet','p-lakeshore','p-empire','p-goldengate','p-cascade','p-capitol']:
    ds=pick(pid)
    if not ds: continue
    k,d=ds[0]; a=acc[byname[norm(d['account'])]]
    reg(n,pid,d['account'],a['domain'],a['city'],a['state'],random.choice(FN)+' '+random.choice(LN),random.choice(TI),d['product'],d['amount'],(dt.date.fromisoformat(d['closeDate'])-T).days,'approved',random.randint(20,70),deal=k,**({'exp':9} if n==2 else {}))
    n+=1
# submitted new
reg(n,'p-prairie','Heartland Grain Cooperative','heartlandgrain.example','Wichita','KS','Lena Foster','IT Manager','Backup and Recovery',64000,75,'submitted',1); n+=1
reg(n,'p-peachtree','Magnolia Pediatrics Group','magnoliapeds.example','Atlanta','GA','Omar Reyes','Practice Administrator','Managed Cloud',38000,60,'submitted',3); n+=1
reg(n,'p-wasatch','Canyon Ridge Credit Union','canyonridgecu.example','Provo','UT','Grace Ward','CISO','Security Operations',112000,95,'submitted',0); n+=1
# conflict: account already opportunity with another partner
cf=[a for a in acc.values() if any(r['status']=='opportunity' for r in a['partners'].values())][0]
other=[p for p in pids if p not in cf['partners']][0]
reg(n,other,cf['name'],cf['domain'],cf['city'],cf['state'],'Victor Hughes','VP of Infrastructure','Hybrid IT Services',90000,80,'submitted',2,need='Consolidating two data centers; the partner has run their network for three years.'); n+=1
reg(n,'p-suncoast','Gulfstream Marine Supply','gulfstreammarine.example','Tampa','FL','Hannah Price','Director of Operations','Backup and Recovery',27000,45,'info',6); n+=1
reg(n,'p-harbor','Beacon Hill Dental Partners','beaconhilldental.example','Boston','MA','Andre Brooks','CFO','Managed Cloud',22000,40,'rejected',20,note='This practice is already a direct customer under an enterprise agreement.'); n+=1
reg(n,'p-keystone',cf['name'] if False else 'Allegheny Steelworks','alleghenysteel.example','Pittsburgh','PA','Keisha Murphy','CIO','Security Operations',150000,-5,'approved',120,exp=-3); n+=1
for r in regs.values(): r['conflicts']=[]
json.dump({'accounts':{k:{kk:vv for kk,vv in v.items() if kk!='id'} for k,v in acc.items()},'leads':leads,'dealregs':regs},open('leadseed.json','w'))
print(len(acc),len(leads),len(regs))
import collections
print(collections.Counter(l['status'] for l in leads.values()))
