# Academy seed content: courses with modules, lessons and quizzes
def T(title, minutes, body): return {'type':'text','title':title,'minutes':minutes,'body':body.strip()}
def V(title, minutes, url, body): return {'type':'video','title':title,'minutes':minutes,'url':url,'body':body.strip()}
def Q(title, qs): return {'type':'quiz','title':title,'minutes':5,'quiz':{'questions':[{'q':q,'options':o,'answer':a,'explain':e} for q,o,a,e in qs]}}

COURSES = [
 dict(id='crs-onboard', order=1, title='Partner Onboarding Essentials', track='onboarding', level='Foundation', status='published', planKey='pricing',
  summary='Everything a new partner needs in the first 30 days: the program, deal registration, MDF and how to work with your partner account manager.',
  cert={'enabled':False,'name':'','validMonths':12}, modules=[
  ('The Northwind partner program', [
    T('Welcome to the program', 6, '''
## What the program gives you
Northwind Cloud sells backup, recovery and resilience services through partners. As a partner you get:
- **Partner pricing** on every Northwind service you resell or bundle
- **Deal registration** that protects opportunities you find
- **Market development funds (MDF)** for joint marketing
- A named **partner account manager (PAM)** who plans with you

## Tiers
Partners move from Registered to Silver, Gold and Platinum as certified people, registered pipeline and closed revenue grow. Higher tiers unlock deeper discounts, larger MDF allocations and co-selling support.

**Try it:** Find your current tier on your partner page and note one requirement for the next tier.'''),
    T('Your first 30 days', 7, '''
## The onboarding path
1. Sign the partner agreement and name an executive sponsor
2. Get portal access for your sales and technical leads
3. Hold a kickoff with your PAM to agree your ideal customer profile
4. Walk through pricing and deal registration
5. Start the Sales and Technical certifications

## What good looks like
By day 30 most successful partners have two people enrolled in certification, one joint account plan and their first opportunity registered.

**Try it:** Book your kickoff and list three target accounts to bring to it.'''),
    Q('Check your understanding', [
      ('Which benefit protects an opportunity your team found?', ['MDF', 'Deal registration', 'Partner tiering', 'The demo environment'], 1, 'Registering a deal gives you protection and partner pricing on that opportunity.'),
      ('What moves a partner to a higher tier?', ['Time in the program only', 'Certified people, registered pipeline and closed revenue', 'Number of MDF requests', 'Attending a webinar'], 1, 'Tiers reflect capability and results: certifications, pipeline and revenue.'),
      ('Who should you agree your ideal customer profile with?', ['Your partner account manager', 'Northwind support', 'Your end customer', 'No one; it is optional'], 0, 'The ICP is agreed with your PAM at kickoff and guides joint planning.')])]),
  ('Deal registration and MDF', [
    T('Registering a deal', 8, '''
## When to register
Register as soon as you have a named customer, a real project and a rough timeline. Early registration protects your margin and lets your PAM line up help.

## What you need
- Customer name and decision maker
- Product or service and estimated value
- Expected close month and next step

## After you submit
Your PAM reviews within two business days. Approved registrations last 90 days and can be extended while the deal is active.

**Try it:** Draft a registration for one live opportunity using the fields above.'''),
    T('Requesting and claiming MDF', 8, '''
## How MDF works
MDF is funding for marketing you run with Northwind: events, digital ads, content and telemarketing.

1. **Request** the activity with a budget, expected leads and a run date
2. **Run** the activity once approved
3. **Claim** with proof: invoices and the lead list
4. **Get paid** once the claim is approved

## Make it count
Link every request to a campaign. That lets the program trace which deals your activity created, so strong results earn more funding next quarter.

**Try it:** Sketch one activity, its budget and the number of leads you expect.'''),
    Q('Check your understanding', [
      ('When should you register a deal?', ['After it closes', 'As soon as there is a named customer, a project and a timeline', 'Only above a set deal size', 'At the end of each quarter'], 1, 'Register early to protect the opportunity and get support.'),
      ('What proof does an MDF claim need?', ['A screenshot of the ad', 'Invoices and the lead list', 'A customer reference', 'Nothing'], 1, 'Claims are paid against invoices and the leads the activity produced.'),
      ('Why link MDF requests to a campaign?', ['It is required to get paid', 'So the program can trace which deals the activity created', 'To skip approval', 'It reduces the budget'], 1, 'Linking lets attribution credit your activity with the pipeline it created.')])]),
 ]),
 dict(id='crs-sales', order=2, title='Certified Sales Professional', track='sales', level='Professional', status='published', planKey='salescert',
  summary='Position Northwind recovery services, run discovery, handle objections and build a business case your customer can sign.',
  cert={'enabled':True,'name':'Northwind Certified Sales Professional','validMonths':12}, modules=[
  ('Why customers buy recovery', [
    T('The problem behind the purchase', 8, '''
## Customers don't buy backup
They buy confidence that the business keeps running. Most buyers already have backups; what they lack is **proof they can recover** in a time the business can live with.

## Three triggers to listen for
- **An incident:** ransomware at a peer, an outage, a failed restore
- **An audit or insurer question** about recovery testing
- **A change:** cloud migration, merger, new compliance rules

## Who cares about what
- **IT leaders:** recovery time, effort, fewer tools
- **Finance:** predictable cost, avoided downtime
- **Executives:** reputation and continuity

**Try it:** Write the trigger and the main worry for one account you are working.'''),
    V('Northwind in five minutes', 6, 'https://videos.northwind.example/northwind-in-five-minutes', '''
Watch the overview, then note:
- The **three services** Northwind offers and who each is for
- How **immutable copies** stop ransomware from deleting backups
- What a **tested recovery** report shows an auditor'''),
    Q('Check your understanding', [
      ('What are customers really buying?', ['Storage capacity', 'Confidence they can recover in time', 'The lowest price per terabyte', 'A new backup console'], 1, 'Buyers want proof the business keeps running, not just copies of data.'),
      ('Which of these is a buying trigger?', ['An insurer asking about recovery testing', 'A new office chair policy', 'A stable, unchanged environment', 'A renewed antivirus licence'], 0, 'Audit and insurer questions about recovery are strong triggers.'),
      ('What does finance usually care about most?', ['Recovery time objectives', 'Predictable cost and avoided downtime', 'Console design', 'Number of backup jobs'], 1, 'Finance weighs predictable spend against the cost of downtime.')])]),
  ('Discovery and qualification', [
    T('Running discovery', 10, '''
## Questions that open the conversation
1. "If your main system went down this morning, how long until you are back?"
2. "When did you last restore a full system, and how did it go?"
3. "Who would make the call to pay a ransom, and what would they need to know?"
4. "What has your insurer or auditor asked about recovery?"

## Listen for the gap
The gap between the time they **need** to recover and the time they **can** recover is your business case. Write both numbers down in the customer's words.

**Try it:** Use two of these questions on your next call and record the gap.'''),
    T('Qualifying the opportunity', 8, '''
## Four things to confirm
- **Pain:** a recovery gap the customer agrees matters
- **Power:** who signs, and who influences them
- **Plan:** the steps and dates to a decision
- **Budget:** where the money comes from this year

If one is missing, the next step is to find it, not to send a proposal.

## Register early
Once pain and power are confirmed, register the deal so your PAM can bring technical help and pricing support.

**Try it:** Score one opportunity against the four items and name the missing one.'''),
    Q('Check your understanding', [
      ('What forms the core of your business case?', ['The price of the competitor', 'The gap between required and actual recovery time', 'The number of servers', 'Your quota'], 1, 'The recovery gap, in the customer\'s words, is what the investment closes.'),
      ('Pain and power are confirmed but there is no decision plan. What next?', ['Send the proposal now', 'Work with the customer to map the steps and dates to a decision', 'Discount the price', 'Close the opportunity'], 1, 'Find the missing piece before proposing.'),
      ('When should you register the deal?', ['After the proposal is accepted', 'Once pain and power are confirmed', 'Only if a competitor appears', 'Never for small deals'], 1, 'Register once the opportunity is real so you get protection and support.'),
      ('Which question best reveals recovery readiness?', ['How many users do you have?', 'When did you last restore a full system, and how did it go?', 'What is your budget?', 'Who is your current vendor?'], 1, 'Past restore results show the real gap.')])]),
  ('Objections and closing', [
    T('Handling common objections', 9, '''
## "We already have backups"
Agree, then ask when they last proved a full recovery. The gap usually appears here.

## "It's too expensive"
Compare cost with the downtime it prevents, using their own hourly cost of an outage. Offer a phased start.

## "Our current vendor is fine"
Ask what their insurer or auditor would say about the last recovery test. Offer a no-cost readiness assessment.

**Try it:** Write your answer to the objection you hear most, in two sentences.'''),
    T('Building the business case and closing', 9, '''
## A one-page business case
- **The gap:** required versus actual recovery time
- **The risk:** what an outage costs per hour, in their numbers
- **The plan:** phases, owners and dates
- **The investment:** price and what it replaces

## Mutual action plan
Agree the remaining steps with your champion: security review, legal, budget approval and a signature date. Share it and update it weekly.

**Try it:** Build a mutual action plan for one late-stage deal.'''),
    Q('Final assessment', [
      ('A prospect says "We already have backups." Best response?', ['Drop the price', 'Agree, then ask when they last proved a full recovery', 'Argue that their backups are bad', 'Move on to another account'], 1, 'Acknowledge, then uncover whether recovery has been proven.'),
      ('How should you answer a cost objection?', ['Compare cost with downtime avoided, in their numbers', 'Promise a bigger discount next quarter', 'Ignore it', 'Remove features'], 0, 'Tie cost to the outage cost the customer already accepts.'),
      ('What belongs in a mutual action plan?', ['Only the price', 'Remaining steps, owners and dates to signature', 'Your commission', 'The competitor\'s weaknesses'], 1, 'A shared, dated plan keeps both sides moving to signature.'),
      ('Which item is NOT part of the one-page business case?', ['The recovery gap', 'The hourly cost of an outage', 'The phased plan', 'Your internal quota'], 3, 'Quota matters to you, not to the customer\'s decision.')])]),
 ]),
 dict(id='crs-tech', order=3, title='Certified Technical Specialist', track='technical', level='Professional', status='published', planKey='techcert',
  summary='Design, deploy and test Northwind recovery for customers, including immutable copies, runbooks and recovery testing.',
  cert={'enabled':True,'name':'Northwind Certified Technical Specialist','validMonths':24}, modules=[
  ('Architecture', [
    T('How Northwind protects data', 10, '''
## The building blocks
- **Agents and connectors** capture data from servers, databases and SaaS apps
- **Primary copies** land in the customer's region for fast restore
- **Immutable copies** are locked for a set period and cannot be changed or deleted, even by an administrator
- **Recovery orchestration** brings systems back in the right order

## Designing for the gap
Start from the recovery time and recovery point the business needs, then choose copy frequency, retention and where recovery runs.

**Try it:** For one customer workload, write the recovery time and point it needs.'''),
    T('Sizing and retention', 8, '''
## What drives size
- Protected data volume and its daily change rate
- Retention: how long each copy is kept
- Immutable lock period

## A simple approach
1. Group workloads by importance
2. Set recovery targets per group
3. Pick retention per group, not one rule for everything
4. Review with the customer and record the decisions

Use the sizing calculator in the partner portal; never quote sizes from memory.

**Try it:** Group five workloads from a customer into tiers with targets.'''),
    Q('Check your understanding', [
      ('What makes an immutable copy different?', ['It is compressed', 'It cannot be changed or deleted during its lock period', 'It is stored on tape', 'It restores faster'], 1, 'Immutability is what stops ransomware from deleting backups.'),
      ('Where should a design start?', ['With the cheapest storage tier', 'With the recovery time and point the business needs', 'With the number of agents', 'With last year\'s design'], 1, 'Recovery targets drive every other design choice.'),
      ('How should retention be set?', ['One rule for all workloads', 'Per workload group based on importance', 'As long as possible', 'By the customer\'s budget only'], 1, 'Tiering retention keeps cost aligned with value.')])]),
  ('Deployment', [
    T('Deployment checklist', 9, '''
## Before you start
- Network paths and firewall rules agreed
- Service accounts with least privilege
- Encryption keys and who holds them

## Deploy in waves
1. Pilot one non-critical workload
2. Confirm backup and a test restore
3. Roll out by workload group
4. Turn on immutable copies once retention is agreed

## Hand-over
Document every setting in the runbook and walk the customer's team through a restore.

**Try it:** Turn this checklist into a project plan for your next deployment.'''),
    Q('Check your understanding', [
      ('What should come first in a deployment?', ['Turn on immutability for everything', 'Pilot one non-critical workload and test a restore', 'Migrate all data at once', 'Train end users'], 1, 'A pilot proves the design before wider rollout.'),
      ('Which principle applies to service accounts?', ['Use a domain admin account', 'Least privilege', 'Share one account across customers', 'No passwords'], 1, 'Least privilege limits damage if an account is compromised.'),
      ('What must the hand-over include?', ['A runbook and a walkthrough of a restore', 'Only the invoice', 'A marketing brochure', 'Nothing beyond the login'], 0, 'The customer needs documented settings and practised recovery.')])]),
  ('Recovery testing', [
    T('Testing and runbooks', 10, '''
## Why test
A backup that has never been restored is a hope, not a plan. Regular tests prove recovery time and expose gaps before an incident does.

## A quarterly test
1. Pick the systems and the scenario (for example, ransomware on the file server)
2. Restore into an isolated environment
3. Time each step against the target
4. Record results and fixes in the runbook
5. Share the report with the customer's leadership and, if needed, their insurer

**Try it:** Write the scenario and success criteria for one customer's next test.'''),
    Q('Final assessment', [
      ('Why restore into an isolated environment during tests?', ['It is faster', 'To avoid affecting production and to contain any malware', 'It is cheaper', 'Auditors require it for every restore'], 1, 'Isolation keeps tests safe and realistic.'),
      ('What should a recovery test report show?', ['Only that the backup job succeeded', 'Measured recovery time against the target, with gaps and fixes', 'The number of backup copies', 'Licence counts'], 1, 'Measured results against targets prove readiness.'),
      ('How often is a recovery test recommended in this course?', ['Once at deployment', 'Quarterly', 'Only after an incident', 'Every five years'], 1, 'Quarterly tests keep runbooks current.'),
      ('Who should receive the test report?', ['Only the partner engineer', 'The customer\'s leadership and, if needed, their insurer', 'No one', 'The competitor'], 1, 'Sharing results builds confidence and supports compliance.')])]),
 ]),
 dict(id='crs-ransom', order=4, title='Ransomware Readiness for Healthcare', track='sales', level='Expert', status='published', planKey='',
  summary='Run a recovery readiness assessment for clinics and practices, and turn the findings into a funded project.',
  cert={'enabled':False,'name':'','validMonths':12}, modules=[
  ('Healthcare context', [
    T('What clinics worry about', 8, '''
## The stakes
When systems go down, clinics divert patients, delay care and lose revenue by the hour. Leaders worry about patient safety first, then reputation and cost.

## Who is in the room
- **Practice administrator:** keeps the clinic open, owns the budget
- **IT lead or MSP:** runs systems day to day
- **Compliance officer:** answers to regulators and insurers

Speak to safety and continuity first; technology comes second.

**Try it:** Map the three roles at one clinic you work with.'''),
    T('Running the readiness assessment', 10, '''
## In 60 minutes
1. List critical systems: records, scheduling, imaging, phones
2. For each, ask how long the clinic can run without it
3. Ask when each was last restored and how long it took
4. Check whether backups are immutable and off-site
5. Summarise the gaps on one page

## Deliver the readout
Lead with the biggest gap and a phased plan to close it. Offer a quarterly recovery drill as an ongoing service.

**Try it:** Use the five steps with one clinic this month.'''),
    Q('Check your understanding', [
      ('What should you lead with when talking to clinic leaders?', ['Storage specifications', 'Patient safety and continuity', 'Price per gigabyte', 'Your certifications'], 1, 'Safety and continuity matter most to clinical leaders.'),
      ('Who usually owns the budget at a practice?', ['The practice administrator', 'The newest nurse', 'The insurer', 'Northwind'], 0, 'The administrator keeps the clinic running and controls spend.'),
      ('What ongoing service does the course recommend after the assessment?', ['Annual newsletter', 'A quarterly recovery drill', 'A one-time discount', 'Nothing'], 1, 'Regular drills prove recovery and create recurring revenue.')])]),
 ]),
 dict(id='crs-comarketing', order=5, title='Co-Marketing with MDF and the Content Studio', track='marketing', level='Foundation', status='published', planKey='',
  summary='Plan a joint campaign, fund it with MDF, create co-branded content and prove the pipeline it produced.',
  cert={'enabled':False,'name':'','validMonths':12}, modules=[
  ('Planning a joint campaign', [
    T('From brief to launch', 8, '''
## A good brief answers
- **Who:** the audience, in one sentence
- **Offer:** what they get for responding
- **Goal:** meetings and pipeline, with a number
- **Message:** why the partner and Northwind together

## Launch checklist
1. Brief approved by both sides
2. MDF request linked to the campaign
3. Content approved by vendor and partner
4. Tracking agreed so every deal can be credited

**Try it:** Write a four-line brief for your next campaign.'''),
    T('Co-branded content that gets approved', 7, '''
## Rules that speed approval
- Name both companies in the first line
- Lead with the customer outcome
- Use the approved lockup and colours
- Never invent statistics or customer names

## Using the content studio
Brainstorm ideas from the campaign brief, draft copy and graphics with AI, then submit for review. Both the vendor and the partner approve before anything is scheduled.

**Try it:** Draft one LinkedIn post for your campaign and submit it for review.'''),
    Q('Check your understanding', [
      ('What must a campaign brief include?', ['Audience, offer, goal and message', 'Only the budget', 'A competitor list', 'The partner\'s logo'], 0, 'These four items keep both sides aligned.'),
      ('Who approves co-branded content before it is scheduled?', ['Only the partner', 'Only the vendor', 'Both the vendor and the partner', 'Nobody'], 2, 'Dual approval protects both brands.'),
      ('Why agree tracking before launch?', ['So every resulting deal can be credited', 'To lower the budget', 'It is optional', 'To delay launch'], 0, 'Tracking lets attribution prove the campaign\'s pipeline.')])]),
 ]),
 dict(id='crs-pubsec', order=6, title='Selling to State and Local Government', track='sales', level='Professional', status='draft', planKey='',
  summary='Draft: procurement paths, continuity-of-operations requirements and how to partner on public-sector bids.',
  cert={'enabled':False,'name':'','validMonths':12}, modules=[
  ('Public-sector buying', [
    T('How agencies buy', 8, '''
## Common paths
- Cooperative contracts that let agencies buy without a new bid
- Formal requests for proposal with fixed timelines
- Small purchases below a local threshold

## What reviewers look for
Continuity-of-operations plans, data residency and clear recovery testing.

**Try it:** Find which contract vehicles your agency customers use.'''),
  ])]),
]
