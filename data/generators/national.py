import json, random, datetime, re
random.seed(2027)
T = datetime.date(2026, 10, 15)
D = lambda n: (T + datetime.timedelta(days=n)).isoformat()
# id, name, type, tier, region, stage, joined, mdfAlloc, domain, color, contacts[(name,title,city,status,territory)], reported
P = [
 ('p-cascade','Cascade Cloud Partners','MSP','Gold','Pacific Northwest','activate','2025-12-02',50000,'cascadecloud.example','#2E8B9A',[
   ('Hannah Lindqvist','Chief Executive Officer','Seattle, WA','Active',['WA']),('Marcus Oyelaran','Director of Channel Sales','Portland, OR','Active',['OR','WA']),
   ('Tessa Kahale','Solutions Engineer','Seattle, WA','Active',['WA','AK']),('Brian Ostrowski','Account Executive','Spokane, WA','At risk',['WA','ID','MT']),('Rosa Delgado','Account Executive','Boise, ID','Onboarding',['ID','MT','WY'])],620000),
 ('p-goldengate','Golden Gate Systems Group','SI','Platinum','Northern California','grow','2024-11-12',110000,'ggsg.example','#B23A6E',[
   ('Daniel Whitcombe','Managing Partner','San Francisco, CA','Active',['CA']),('Mei-Lin Zhao','VP, Cloud Practice','San Jose, CA','Active',['CA','NV']),
   ('Andre Baptiste','Alliance Manager','San Francisco, CA','Active',['CA','HI']),('Kara Jennings','Enterprise Account Director','Sacramento, CA','Active',['CA','OR'])],1450000),
 ('p-pacificrim','Pacific Rim Technology','VAR','Silver','Southern California','enable','2026-05-20',30000,'pacrimtech.example','#C2571A',[
   ('Victor Alarcón','President','Los Angeles, CA','Active',['CA']),('Jasmine Okafor','Sales Manager','San Diego, CA','Active',['CA']),
   ('Tyler Brandt','Account Manager','Phoenix, AZ','Onboarding',['AZ','NM']),('Nadia Petrova','Account Manager','Las Vegas, NV','Dormant',['NV','UT'])],210000),
 ('p-wasatch','Wasatch Data Partners','MSP','Registered','Mountain West','onboard','2026-08-26',15000,'wasatchdata.example','#4E7D3A',[
   ('Caleb Sorensen','Owner','Salt Lake City, UT','Onboarding',['UT']),('Leah Martinez','Service Delivery Lead','Salt Lake City, UT','Onboarding',['UT','ID']),
   ('Owen Fairbanks','Account Executive','Denver, CO','Onboarding',['CO','WY'])],0),
 ('p-prairie','Prairie Point Networks','VAR','Gold','Great Plains','activate','2026-01-14',45000,'prairiepoint.example','#8A6A00',[
   ('Gretchen Albers','CEO','Kansas City, MO','Active',['MO','KS']),('Darnell Hughes','Director of Sales','St. Louis, MO','Active',['MO','IL']),
   ('Emily Sato','Inside Sales Lead','Wichita, KS','Active',['KS','OK']),('Ross Lindgren','Account Executive','Omaha, NE','At risk',['NE','IA','SD','ND'])],480000),
 ('p-lakeshore','Lakeshore Technology Group','MSP','Platinum','Great Lakes','grow','2025-02-03',100000,'lakeshoretg.example','#2F6FD1',[
   ('Patrick Mulcahy','Chief Revenue Officer','Chicago, IL','Active',['IL']),('Aaliyah Brooks','VP, Managed Services','Chicago, IL','Active',['IL','IN']),
   ('Stefan Kowalczyk','Regional Sales Director','Detroit, MI','Active',['MI']),('Ingrid Halvorsen','Account Executive','Minneapolis, MN','Active',['MN','WI']),
   ('Jamal Reed','Account Executive','Columbus, OH','Active',['OH','KY']),('Megan Doyle','Solutions Architect','Milwaukee, WI','Dormant',['WI'])],1320000),
 ('p-peachtree','Peachtree Managed IT','MSP','Silver','Southeast','enable','2026-06-09',25000,'peachtreemit.example','#6B3FA0',[
   ('Lamar Whitfield','Founder & CEO','Atlanta, GA','Active',['GA']),('Courtney Ames','Partner Marketing Manager','Atlanta, GA','Active',['GA','SC']),
   ('Ben Castellano','Account Executive','Nashville, TN','Onboarding',['TN','KY']),('Ruth Okonkwo','Account Executive','Birmingham, AL','Active',['AL','MS']),
   ('Grant Ellison','Account Executive','Charlotte, NC','Onboarding',['NC','SC'])],160000),
 ('p-suncoast','Suncoast Solutions','Referral','Registered','Florida','recruit','2026-10-01',0,'suncoastsol.example','#1F8A6C',[
   ('Isabel Ferreira','Principal','Tampa, FL','Onboarding',['FL']),('Carlos Medina','Business Development','Miami, FL','Onboarding',['FL','PR']),
   ('Dana Kowalski','Consultant','Orlando, FL','Onboarding',['FL'])],0),
 ('p-capitol','Capitol Federal Integrators','SI','Gold','Mid-Atlantic','activate','2025-10-21',65000,'capitolfed.example','#2442C9',[
   ('Raymond Stokes','President','Washington, DC','Active',['DC','MD']),('Elena Marsh','Director, Public Sector','Richmond, VA','Active',['VA']),
   ('Kevin Tran','Capture Manager','Virginia Beach, VA','Active',['VA','WV']),('Shonda Parks','Account Executive','Raleigh, NC','At risk',['NC']),
   ('Michael Brennan','Solutions Architect','Baltimore, MD','Active',['MD','DE'])],720000),
 ('p-empire','Empire Distribution Group','Distributor','Platinum','National','grow','2024-08-05',150000,'empiredist.example','#111827',[
   ('Sofia Rinaldi','VP, Vendor Alliances','New York, NY','Active',['NY','NJ']),('Joel Abramson','Channel Development Manager','Philadelphia, PA','Active',['PA','NJ','DE']),
   ('Nicole Grant','Channel Development Manager','Hartford, CT','Active',['CT','RI','MA']),('Paul Desrosiers','Channel Development Manager','Manchester, NH','Active',['NH','VT','ME']),
   ('Aiden Cole','Partner Recruitment Lead','Boston, MA','Active',['MA']),('Tasha Monroe','National Accounts Manager','Dallas, TX','Active',['TX','LA','AR'])],1900000),
]
W = {c:{} for c in ['partners','contacts','deals','mdf','campaigns','events','touches','engagements','plans','assets']}
AREA = {'WA':'206','OR':'503','ID':'208','CA':'415','AZ':'602','NV':'702','UT':'801','CO':'303','MO':'816','KS':'316','NE':'402','IL':'312','MI':'313','MN':'612','OH':'614','WI':'414','GA':'404','TN':'615','AL':'205','NC':'704','FL':'813','DC':'202','VA':'804','MD':'410','NY':'212','PA':'215','CT':'860','NH':'603','MA':'617','TX':'214'}
NOTES = {'Active':['Responsive; prefers a short weekly check-in.','Owns the co-sell relationship on this side.','Asked for the Q1 roadmap briefing.','Running two joint assessments this quarter.','Wants more MDF for events in the new year.'],
 'At risk':['Two meetings missed this quarter. Re-engage before the QBR.','Raised a pricing concern on the last call.'],
 'Dormant':['No activity in 90+ days. Verify the contact is still in role.'],
 'Onboarding':['Working through certification modules.','Portal access just provisioned.','Kickoff completed; scheduling enablement.']}
LIFE = ['recruit','onboard','enable','activate','grow']
cid = 2001
for pid,name,typ,tier,region,stage,joined,alloc,dom,color,cons,rep in P:
    W['partners'][pid] = dict(name=name,type=typ,tier=tier,region=region,stage=stage,joinedAt=joined,mdfAllocated=alloc,reportedPipeline=rep,domain=dom,portalKey='',portalName='',deskContactId='',deskName='',sample=True)
    for (cn,title,city,status,terr) in cons:
        c = f'C{cid}'; cid += 1
        first,last = cn.split(' ',1)
        st = city.split(', ')[1]
        lt = {'Active':random.randint(1,14),'Onboarding':random.randint(2,20),'At risk':random.randint(35,60),'Dormant':random.randint(95,160)}[status]
        W['contacts'][c] = dict(name=cn,title=title,partnerId=pid,city=city,status=status,lastTouch=D(-lt),source='portal',sourceId=c,
            email=f"{re.sub('[^a-z]','',first.lower())}.{re.sub('[^a-z]','',last.lower())}@{dom}",phone=f"({AREA.get(st,'555')}) 555-{random.randint(1000,9999)}",
            note=random.choice(NOTES[status]),territory=sorted(terr),sample=True)
# some partners are going quiet, so the engagement view shows a spread
QUIET = {'p-pacificrim':38,'p-suncoast':22,'p-peachtree':12,'p-prairie':6}
for c,v in W['contacts'].items():
    q = QUIET.get(v['partnerId'],0)
    if q: v['lastTouch'] = (datetime.date.fromisoformat(v['lastTouch']) - datetime.timedelta(days=q + random.randint(0,10))).isoformat()
# deals
ACCTS = {
 'p-cascade':[('Evergreen Health Partners','Managed Backup & DR',185000,'proposal'),('Puget Freight Lines','Hybrid IT Services',96000,'qualified'),('Willamette School District','Managed Backup & DR',142000,'negotiation'),('Snake River Credit Union','Ransomware Recovery',68000,'won')],
 'p-goldengate':[('Bayview Biotech','DR Modernization',520000,'negotiation'),('Sierra Logistics','Cloud Migration',310000,'proposal'),('Presidio Capital','DR Modernization',275000,'won'),('Delta Ag Cooperative','Hybrid IT Services',188000,'qualified'),('Mission Medical Group','Ransomware Recovery',140000,'lost')],
 'p-pacificrim':[('Harbor Freight Brokers','Managed Backup & DR',88000,'qualified'),('Coronado Dental Group','Ransomware Recovery',54000,'registered'),('Sonoran Builders','Hybrid IT Services',72000,'proposal')],
 'p-wasatch':[('Alta Outdoor Co.','Managed Backup & DR',46000,'registered')],
 'p-prairie':[('Heartland Grain','Hybrid IT Services',156000,'proposal'),('Gateway Orthopedics','Ransomware Recovery',92000,'negotiation'),('Flint Hills Bank','Managed Backup & DR',118000,'qualified'),('Platte Valley Schools','Managed Backup & DR',64000,'won')],
 'p-lakeshore':[('Great Lakes Steel','DR Modernization',410000,'negotiation'),('North Shore Health','Ransomware Recovery',265000,'proposal'),('Motor City Parts','Hybrid IT Services',198000,'qualified'),('Twin Cities Legal','Managed Backup & DR',122000,'won'),('Buckeye Insurance','DR Modernization',236000,'registered'),('Badger Foods','Managed Backup & DR',84000,'lost')],
 'p-peachtree':[('Magnolia Pediatrics','Ransomware Recovery',58000,'qualified'),('Music Row Studios','Managed Backup & DR',47000,'registered'),('Southern Rail Supply','Hybrid IT Services',99000,'proposal')],
 'p-suncoast':[('Gulf Breeze Resorts','Managed Backup & DR',75000,'registered')],
 'p-capitol':[('Commonwealth Transit Authority','DR Modernization',460000,'proposal'),('Chesapeake County Schools','Managed Backup & DR',178000,'negotiation'),('Federal Contractors Alliance','Cloud Migration',230000,'qualified'),('Triangle Research Labs','Ransomware Recovery',96000,'won')],
 'p-empire':[('Hudson Valley Health','DR Modernization',540000,'negotiation'),('Liberty Mutual Aid Society','Managed Backup & DR',260000,'proposal'),('Keystone State Utilities','Hybrid IT Services',380000,'qualified'),('Bay State Manufacturing','DR Modernization',310000,'won'),('Garden State Retail','Ransomware Recovery',145000,'registered'),('Lone Star Energy Services','Hybrid IT Services',220000,'qualified'),('Narragansett Marine','Managed Backup & DR',88000,'lost')],
}
NEXT = {'registered':'Discovery call scheduled','qualified':'Technical scoping workshop','proposal':'Proposal review with CFO','negotiation':'Redlines with procurement','won':'Kickoff with customer','lost':'Lost to incumbent; revisit at renewal'}
dn = 101; deal_ids = {}
for pid, rows in ACCTS.items():
    pcs = [k for k,v in W['contacts'].items() if v['partnerId']==pid]
    for acct, prod, amt, stg in rows:
        did = f'DN{dn}'; dn += 1
        created = D(-random.randint(25,150))
        close = D(random.randint(10,120)) if stg not in ('won','lost') else D(-random.randint(5,40))
        if stg in ('won','lost') and close < created: created = D(-random.randint(60,140))
        W['deals'][did] = dict(name=f'{acct} — {prod}',account=acct,partnerId=pid,contactId=random.choice(pcs),product=prod,stage=stg,amount=amt,createdAt=created,closeDate=close,
            nextStep=NEXT[stg],stageChangedAt=D(-random.randint(3,40)),sample=True)
        deal_ids.setdefault(pid,[]).append(did)
# campaigns, mdf, events
CAMP = {
 'p-cascade':('Pacific Northwest school recovery program','live',D(-30),'25 district recovery assessments','Free backup health check','IT directors at K-12 districts in WA and OR'),
 'p-goldengate':('Bay Area biotech DR acceleration','live',D(-55),'$1.5M DR pipeline in FY27 H1','DR architecture sprint, two weeks','Infrastructure VPs at life-sciences firms'),
 'p-prairie':('Heartland ag and lending resilience','live',D(-20),'30 qualified meetings','Ransomware tabletop exercise','Ag cooperatives and community banks'),
 'p-lakeshore':('Midwest manufacturing uptime series','live',D(-70),'$2M pipeline across five states','Plant-floor recovery assessment','Plant IT leaders at 250–2,000 employee manufacturers'),
 'p-capitol':('Public-sector continuity briefing tour','production',D(12),'15 agency briefings','Continuity-of-operations workshop','State and county IT leadership in VA, MD and DC'),
 'p-empire':('Northeast reseller recruitment drive','live',D(-45),'40 new resellers through distribution','Distribution starter bundle','Small MSPs and VARs across the Northeast'),
 'p-peachtree':('Southeast healthcare recovery readiness','production',D(20),'20 clinic assessments','Recovery readiness assessment','Practice managers at clinics in GA, AL and TN'),
}
cn_ = 10; camp_of = {}
for pid,(nm,st,launch,goal,offer,aud) in CAMP.items():
    c = f'c{cn_}'; cn_ += 1; camp_of[pid] = c
    W['campaigns'][c] = dict(name=nm,partnerId=pid,status=st,launchDate=launch,goal=goal,offer=offer,audience=aud,
        messaging={'tagline':'Recovery you have tested before you need it.','ctas':[f'Book a {offer[0].lower()+offer[1:]}']},sample=True)
MDF = [
 ('p-cascade','District IT leaders breakfast, Seattle','Event',9000,'paid',-40,'c',36,41),
 ('p-cascade','Paid social to K-12 IT, WA/OR','Digital ads',6000,'approved',14,'c',50,None),
 ('p-goldengate','Biotech DR summit, South San Francisco','Event',22000,'claimed',-12,'c',35,38),
 ('p-goldengate','Account-based ads to 60 life-sciences firms','Digital ads',14000,'paid',-60,'c',70,82),
 ('p-pacificrim','Partner sales enablement bootcamp','Training',5000,'requested',25,'',20,None),
 ('p-prairie','Ag lender ransomware tabletop, Kansas City','Event',8000,'paid',-25,'c',30,27),
 ('p-prairie','Telemarketing sprint, MO/KS/NE','Telemarketing',6500,'approved',10,'c',40,None),
 ('p-lakeshore','Manufacturing uptime roadshow, 4 cities','Event',28000,'paid',-50,'c',90,104),
 ('p-lakeshore','LinkedIn lead-gen, Great Lakes','Digital ads',12000,'claimed',-8,'c',60,58),
 ('p-peachtree','Clinic recovery webinar','Webinar',4500,'requested',30,'',35,None),
 ('p-capitol','Continuity briefing, Richmond','Event',10000,'approved',18,'c',25,None),
 ('p-capitol','Public-sector content syndication','Content',7000,'paid',-35,'c',45,49),
 ('p-empire','Reseller recruitment webinars','Webinar',15000,'paid',-30,'c',80,96),
 ('p-empire','Distribution starter bundle promo','Digital ads',18000,'approved',5,'c',100,None),
 ('p-empire','Northeast partner summit, New York','Event',30000,'requested',45,'c',120,None),
]
mn = 10; mdf_of = {}
for pid,act,kind,amt,st,run,camp,exp,actual in MDF:
    m = f'm{mn}'; mn += 1
    req = D(min(run,0)-random.randint(20,40))
    hist = [{'action':'Requested','at':req}]
    if st in ('approved','paid','claimed'): hist.append({'action':'Approved','at':D(min(run,0)-random.randint(8,18))})
    if st in ('claimed','paid'): hist.append({'action':'Marked complete','at':D(min(run+3,-1))})
    if st == 'paid': hist.append({'action':'Paid','at':D(min(run+12,-1))})
    W['mdf'][m] = dict(activity=act,partnerId=pid,kind=kind,amount=amt,status=st,runDate=D(run),requestedAt=req,expectedLeads=exp,actualLeads=actual,
        proof='Invoices and lead list uploaded to the PRM.' if st in ('paid','claimed') else '',history=hist,campaignId=camp_of.get(pid,'') if camp else '',sample=True)
    mdf_of.setdefault(pid,[]).append(m)
EV = [
 ('p-cascade','District IT leaders breakfast, Seattle',-40,'Breakfast briefing','done','[Venue], South Lake Union, Seattle',0,52,45,38,22,5,410000),
 ('p-goldengate','Biotech DR summit, South San Francisco',-12,'Executive summit','done','[Venue], Oyster Point',2,48,40,38,29,7,980000),
 ('p-prairie','Ag lender ransomware tabletop',-25,'Workshop','done','[Venue], Crossroads, Kansas City',0,30,25,27,20,4,330000),
 ('p-lakeshore','Manufacturing uptime roadshow: Chicago',-50,'Roadshow','done','[Venue], Fulton Market, Chicago',0,64,60,51,40,8,1150000),
 ('p-capitol','Continuity briefing, Richmond',18,'Executive briefing','promoting','[Venue], Downtown Richmond',0,14,30,0,0,0,0),
 ('p-empire','Northeast partner summit, New York',45,'Partner summit','planning','[Venue], Midtown Manhattan',2,0,150,0,0,0,0),
 ('p-empire','Reseller recruitment webinar #3',-30,'Webinar','done','Zoom Webinar',0,210,150,132,61,9,640000),
]
en = 10; ev_of = {}
for pid,nm,dd,fmt,st,loc,mi,regs,target,att,leads,opps,rp in EV:
    e = f'e{en}'; en += 1
    mid = mdf_of[pid][mi] if mi < len(mdf_of[pid]) else ''
    W['events'][e] = dict(name=nm,partnerId=pid,date=D(dd),format=fmt,status=st,location=loc,mdfId=mid,campaignId=camp_of.get(pid,''),regs=regs,targetRegs=target,attended=att,leads=leads,opps=opps,reportedPipeline=rp,budget=W['mdf'][mid]['amount'] if mid else 0,sample=True)
    ev_of.setdefault(pid,[]).append(e)
# touches: link most deals of partners with marketing to events/mdf/campaign
tn = 100
for pid, dids in deal_ids.items():
    for did in dids:
        dl = W['deals'][did]
        opts = []
        for e in ev_of.get(pid,[]):
            if W['events'][e]['status']=='done': opts.append(('event',e,W['events'][e]['date']))
        for m in mdf_of.get(pid,[]):
            if W['mdf'][m]['status'] in ('paid','claimed'): opts.append(('mdf',m,W['mdf'][m]['runDate']))
        if pid in camp_of and W['campaigns'][camp_of[pid]]['status']=='live': opts.append(('campaign',camp_of[pid],W['campaigns'][camp_of[pid]]['launchDate']))
        if not opts or random.random() < .22: continue
        for kind,ref,dt in random.sample(opts, min(len(opts), random.choice([1,1,2,2,3]))):
            dd = max(dt, D(-150))
            if dd > D(0): continue
            W['touches'][f't{tn}'] = dict(dealId=did,kind=kind,refId=ref,date=dd,note={'event':'Attended the event','mdf':'Lead from MDF-funded activity','campaign':'Responded to the campaign offer'}[kind],sample=True); tn += 1
# engagements
ACT = ['Deal registration approved','Certification module completed','Portal login','Newsletter opened','Enablement webinar attended','Co-branded asset downloaded','Lead accepted']
DESK = [('call','Pipeline review call'),('meeting','QBR prep meeting'),('email','Sent Q1 promo details'),('call','Joint customer call'),('meeting','Account mapping session'),('email','Follow-up on MDF claim')]
gn = 0
for c,v in W['contacts'].items():
    base = {'Active':7,'Onboarding':4,'At risk':2,'Dormant':1}[v['status']] - (3 if v['partnerId'] in QUIET else 0)
    base = max(base,1)
    last = (T - datetime.date.fromisoformat(v['lastTouch'])).days
    for i in range(base):
        ago = last + int(i * random.uniform(6,16))
        if ago > 84 and i: break
        if random.random() < .55:
            typ,summ = 'activity',random.choice(ACT); src='portal'
        else:
            typ,summ = random.choice(DESK); src='desk'
        W['engagements'][f'g-{c}-{i+1}'] = dict(contactId=c,partnerId=v['partnerId'],date=D(-ago),type=typ,summary=summ,source=src,sample=True); gn += 1
    if v['status'] == 'Active' and random.random() < .35:
        W['engagements'][f'g-{c}-p'] = dict(contactId=c,partnerId=v['partnerId'],date=D(random.randint(3,21)),type='meeting',summary='Planned: quarterly business review',source='hub',planned=True,sample=True)
json.dump(W, open('seed6/national.json','w'), ensure_ascii=False, indent=0)
for k,v in W.items(): print(k, len(v))
print('pipeline', sum(d['amount'] for d in W['deals'].values() if d['stage'] not in ('won','lost')))
# ---- business plans ----
PB=[('recruit','Mutual NDA signed','joint',0,'nda'),('recruit','Partner agreement signed','joint',7,'agreement'),('recruit','Executive sponsors named on both sides','joint',7,'sponsor'),
('onboard','Portal and PRM access provisioned','vendor',10,'portal'),('onboard','Kickoff meeting held','joint',14,'kickoff'),('onboard','Ideal customer profile agreed','joint',21,'icp'),('onboard','Pricing and deal registration walkthrough','vendor',21,'pricing'),
('enable','Sales certification: 2 reps','partner',45,'salescert'),('enable','Technical certification: 1 engineer','partner',60,'techcert'),('enable','Demo environment ready','vendor',45,'demo'),('enable','Joint value proposition and messaging approved','joint',50,'playbook'),
('activate','First joint campaign launched','joint',75,'firstcamp'),('activate','First deal registered','partner',90,'dealreg'),('activate','First closed-won deal','partner',120,'firstwin'),
('grow','Quarterly business review held','joint',120,'qbr'),('grow','Joint business plan refreshed for next half','joint',180,'jbp')]
VP = {
 'p-cascade':('Cascade runs IT for school districts and mid-size firms across Washington, Oregon and Idaho.','Tested recovery for Northwest school districts, delivered locally by Cascade on Northwind.','K-12 districts and 100–1,000 seat firms in WA, OR and ID.'),
 'p-goldengate':('Golden Gate is our largest West Coast integrator, leading DR modernization for life-sciences and finance.','Golden Gate designs and runs the DR program; Northwind supplies the recovery platform.','Life-sciences, fintech and logistics firms with 500–5,000 staff in Northern California.'),
 'p-pacificrim':('Pacific Rim resells infrastructure across Southern California, Arizona and Nevada.','','Mid-market construction, logistics and dental groups in the Southwest.'),
 'p-wasatch':('Wasatch is a new Utah MSP adding Northwind backup to its managed tiers.','','Small professional-services firms along the Wasatch Front.'),
 'p-prairie':('Prairie Point sells to agriculture, lending and healthcare across the Great Plains.','Ransomware-ready recovery for ag lenders and rural healthcare, sold and supported by Prairie Point.','Ag cooperatives, community banks and rural hospitals in MO, KS, NE and IA.'),
 'p-lakeshore':('Lakeshore is our anchor MSP in the Great Lakes, with offices in five states.','Plant-floor uptime: Lakeshore runs recovery testing; Northwind guarantees the platform.','Manufacturers with 250–2,000 staff in IL, MI, OH, WI and MN.'),
 'p-peachtree':('Peachtree serves clinics and small businesses across Georgia, Alabama and Tennessee.','','Independent clinics and specialty practices in the Southeast.'),
 'p-suncoast':('Suncoast refers hospitality and healthcare opportunities across Florida.','','Resorts, hotel groups and outpatient clinics in Florida.'),
 'p-capitol':('Capitol Federal integrates continuity and recovery for state and local government.','Continuity-of-operations programs for agencies, designed by Capitol on Northwind.','State, county and K-12 IT in VA, MD, DC and NC.'),
 'p-empire':('Empire distributes Northwind to more than 300 resellers, mostly in the Northeast with national accounts in Texas.','Empire recruits, enables and finances resellers; Northwind provides the platform and partner programme.','Small and mid-size MSPs and VARs nationwide, concentrated in the Northeast.'),
}
GOALS = {'activate':[('pipeline',None,'Registered pipeline'),('won',None,'Closed-won revenue'),('mdfroi',10,'Pipeline per MDF dollar')],
         'grow':[('pipeline',None,'Registered pipeline'),('won',None,'Closed-won revenue'),('campaigns',3,'Joint campaigns live'),('certs',8,'Certified people')],
         'enable':[('deals',5,'Deals registered'),('certs',3,'Certified people')]}
SPONS = {'p-cascade':'Hannah Lindqvist, CEO','p-goldengate':'Daniel Whitcombe, Managing Partner','p-pacificrim':'Victor Alarcón, President','p-wasatch':'Caleb Sorensen, Owner','p-prairie':'Gretchen Albers, CEO','p-lakeshore':'Patrick Mulcahy, CRO','p-peachtree':'Lamar Whitfield, Founder & CEO','p-suncoast':'','p-capitol':'Raymond Stokes, President','p-empire':'Sofia Rinaldi, VP Vendor Alliances'}
def add(s,n): return (datetime.date.fromisoformat(s)+datetime.timedelta(days=n)).isoformat()
for pid,name,typ,tier,region,stage,joined,alloc,dom,color,cons,rep in P:
    si = LIFE.index(stage); ob=[]
    for i,(ph,t,o,off,k) in enumerate(PB):
        pi = LIFE.index(ph); due = add(joined,off)
        done = pi < si or (pi == si and random.random() < .55 and due <= D(0))
        ob.append(dict(id=f'{pid[2:5]}{i:02d}',phase=ph,title=t,owner=o,due=due,done=done,key=k,doneAt=(add(due,-random.randint(0,5))+'T15:00:00.000Z') if done else ''))
    pipe = sum(d['amount'] for d in W['deals'].values() if d['partnerId']==pid and d['stage']!='lost')
    goals=[]
    for i,(m,tg,l) in enumerate(GOALS.get(stage,[])):
        if tg is None: tg = round((pipe*1.6 if m=='pipeline' else pipe*.6)/50000)*50000 or 100000
        goals.append(dict(id=f'g{pid[2:5]}{i}',metric=m,target=tg,period='FY27',label=l,notes=''))
    ov,vp,tm = VP[pid]
    W['plans'][pid] = dict(partnerId=pid,summary=dict(startDate=joined,overview=ov,valueProp=vp,targetMarket=tm,offerings='',sponsorVendor='Dana Whitaker, VP Channel Sales' if si>=1 else '',sponsorPartner=SPONS[pid],period='FY27',term='12 months'),
        onboarding=ob,goals=goals,brand=dict(partnerColor=color,typography='Headlines in Helvetica Neue Bold; body in Helvetica Neue Regular. Never stretch or outline type.',
        voice='Plainspoken, confident, outcome-first. No hype or jargon. Give the partner visible credit.',dos=['Name both companies in the first line','Lead with the customer outcome','Use the approved co-brand lockup'],
        donts=['Don’t change logo colours or proportions','Don’t put the lockup on busy photos','Don’t invent statistics or customer names'],lockupRules='Vendor logo on the left, partner on the right, separated by a thin rule. Keep clear space equal to the height of the monogram on all sides.',partnerLogo=''),
        logos=[],files=[],chat=[],createdAt='2026-10-01T16:00:00.000Z',updatedAt=D(-random.randint(1,9))+'T16:00:00.000Z',sample=True)
json.dump(W, open('seed6/national.json','w'), ensure_ascii=False, indent=0)
print('plans', len(W['plans']))
