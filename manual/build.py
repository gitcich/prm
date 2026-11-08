import json, pathlib, html
ROOT = pathlib.Path(__file__).parent
BOX = json.loads((ROOT / 'boxes.json').read_text())
HUB = 'https://claude.ai/artifact/PQatsPhYqisWaschGNrmnY'
TOOLS = {
  'align': 'https://claude.ai/code/artifact/8d6b4f32-8cc6-4f1e-8bb7-864893900e98',
  'portal': 'https://claude.ai/code/artifact/d24b0da2-7a8d-493d-bf47-f910d558ae14',
  'desk': 'https://claude.ai/code/artifact/d133090b-32e4-4b89-b2ba-0159b15e7e89',
}
e = html.escape

# figure id -> (caption, hub anchor, [(title, text)] in same order as boxes)
FIGS = {
 'home': ('Home: the program at a glance', 'home', [
   ('Search everything', 'Finds partners, deals, MDF requests, campaigns, events and contacts as you type. Press <kbd>/</kbd> from anywhere to jump here.'),
   ('Side rail', 'The main views. The grey number is how many records each holds. The amber badge on Attribution counts open deals that have no marketing touch yet.'),
   ('Program numbers', 'MDF committed against what was allocated, campaign count, pipeline with a marketing touch, and pipeline earned per MDF dollar against your target. Each tile opens the page behind it.'),
   ('Needs attention', 'Your work queue, most urgent first. The stripe tells you why: red for a passed close date, amber for a decision waiting on you (an MDF request, a claim, an overdue event task), teal for housekeeping such as linking MDF or a partner ready to advance. <b>Approve</b> and <b>Advance</b> act right here; other buttons open the record.'),
   ('Partners', 'Every partner with tier, lifecycle stage, type and region, sorted by open pipeline. Click a name to open the partner page.'),
   ('Source tools', 'One-click links to the Pipeline Portal and the Engagement Desk, where deals and contacts come from. <b>Program settings</b>, top right, holds the MDF pool, return target, vendor name, brand voice and colors.'),
   ('Partner account', 'Type a partner name to view only that account across the whole hub. See <a href="#focus">Focus on one partner</a>.'),
 ]),
 'focus': ('Focused on one partner: every tab shows Keystone only', 'home', [
   ('Who you’re viewing', 'This chip stays at the top of every page while a partner is selected. <b>Change</b> picks another partner; <b>✕</b> shows all partners again.'),
   ('Partner account picker', 'Click and type any part of a partner’s name. The list is A–Z and also matches the names used in the Pipeline Portal and Engagement Desk.'),
   ('Numbers for that partner', 'Home, MDF, campaigns, events, content, pipeline, the map and attribution all recalculate for the selected partner.'),
   ('Counts follow the focus', 'The numbers in the side rail count only that partner’s records.'),
 ]),
 'content': ('Content studio: the board', 'content', [
   ('Content numbers', 'What’s in progress, how many pieces wait on each approver, and what’s approved, scheduled and published. Click a “need …” link to filter to it.'),
   ('Filters', 'Narrow the board by partner, campaign, format, or whose approval is outstanding.'),
   ('Content card', 'Each card shows a thumbnail, format, partner, campaigns, and approval ticks: V for vendor, P for partner. Click to open it.'),
   ('Board and Brainstorm', 'Two tabs: the board of every piece by stage, and the brainstorm workspace.'),
   ('New content', 'Starts a blank draft. From a partner or campaign page it’s assigned to that partner or campaign automatically.'),
 ]),
 'brainstorm': ('Content studio: brainstorming with AI', 'brainstorm', [
   ('Brainstorm with AI', 'Choose the partner account, a format if you want one, an angle and how many ideas. Claude uses the partner, the campaigns’ audience, offer and messaging, and your brand voice.'),
   ('Campaigns', 'Tick one or more campaigns for Claude to build from. Ideas carry these campaigns with them.'),
   ('Idea cards', 'Each idea has a format, channel, hook and why it fits. <b>Create draft</b> opens it as a draft; <b>Save idea</b> keeps it for later; <b>Dismiss</b> drops it.'),
   ('Saved ideas', 'Ideas waiting to be written. <b>Start draft</b> moves one onto the board.'),
   ('Add an idea by hand', 'Works without AI too.'),
 ]),
 'asset': ('Content studio: writing, designing and approving one piece', 'a-ex1', [
   ('Assignment', 'Title, format, the partner account it belongs to, the channel, and every campaign it serves. Content can serve several campaigns at once.'),
   ('Copy', 'Headline, subhead, body and call to action. <b>Write with AI</b> drafts from the brief; <b>Rewrite</b> takes a direction such as “shorter” or “for CFOs”. Nothing is kept until you select <b>Save changes</b>.'),
   ('Graphic design', 'The brand template is always ready in three layouts and four sizes. <b>Design with AI</b> has Claude draw a custom co-branded graphic; <b>Refine</b> adjusts it; earlier designs can be restored; download as SVG or PNG.'),
   ('Workflow', 'Idea → Draft → In review → Approved → Scheduled → Published. The button here always shows the next step.'),
   ('Approvals', 'The vendor and the partner each sign off. When both have, the piece moves to Approved.'),
   ('Comments', 'Comment as the vendor or the partner. <b>Request changes</b> sends the piece back to the author with your note.'),
 ]),
 'plan': ('Business plan: one joint plan per partner', 'plan', [
   ('Sections and completeness', 'Jump to any part of the plan. The bar shows how complete it is: summary fields filled, onboarding steps done, goals set and logos ready.'),
   ('Partnership summary', 'Why the partnership exists, the joint value proposition, target market, joint offerings, a sponsor on each side, and the plan period. Edits show <b>Unsaved</b> until you select <b>Save</b>.'),
   ('Onboarding and enablement', 'Sixteen standard steps across five phases: Recruit, Onboard, Enable, Activate and Grow. Each has an owner (vendor, partner or joint) and a due date counted from the day the partner joined. Tick steps as they finish; overdue steps turn red. Add your own steps at the bottom.'),
   ('Goals', 'Pick a measure and a target. Pipeline, closed-won revenue, deals, pipeline per MDF dollar, campaigns, published content and certified people all update themselves from the hub. Use <b>Custom goal</b> for anything else.'),
   ('Brand guide', 'The co-brand lockup preview, both brand colours (change the partner’s with the colour picker), typography, voice and tone, do’s and don’ts, and lockup rules.'),
   ('Logos and graphics', 'Light, dark and stacked co-brand lockups plus both monograms, drawn from the brand colours. Download any of them as SVG or PNG, upload the partner’s own logo, or select <b>Logo concept with AI</b>.'),
   ('Plan assistant', 'Chat about the plan. It can see the plan and the partner’s hub data. See <a href="#fig-planchat">the plan assistant</a> below.'),
 ]),
 'planchat': ('The plan assistant proposing changes for you to apply', 'plan', [
   ('Conversation', 'Your questions and the assistant’s answers, kept with the plan so anyone on the account can pick up the thread. <b>Clear</b> starts over.'),
   ('Proposed changes', 'When you ask the assistant to update the plan, it lists exactly what it would change. <b>Apply</b> saves them all; <b>Discard</b> drops them.'),
   ('Quick requests', 'One-click prompts: draft the summary, suggest goals, find overdue steps, write brand do’s and don’ts, or summarize an attached file.'),
   ('Message and attachments', 'Type a request and press <kbd>Enter</kbd> (<kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line). <b>Attach</b> adds files; they’re stored in the plan’s Files and, if readable, sent to the assistant with your message.'),
 ]),
 'academy': ('Academy: the course catalog', 'academy', [
   ('Academy numbers', 'Published courses, the share of assignments completed, active certifications (and how many expire within 45 days), and overdue assignments.'),
   ('Catalog, Learners, Certifications', 'Three views: every course, every person with training, and every certification awarded.'),
   ('Filters', 'Show one track (Sales, Technical, Marketing, Onboarding), drafts or published courses, or search by name.'),
   ('Course card', 'Track, whether it awards a certification, level, size and length, and how many of the people assigned have finished.'),
   ('Create a course', '<b>Build a course with AI</b> drafts modules, lessons and quizzes from a topic and optional source file. <b>New course</b> starts blank. <b>Assign training</b> sends a published course to partner contacts.'),
 ]),
 'course': ('A course: outline, results and the people taking it', 'crs-sales', [
   ('Course actions', '<b>Preview as learner</b> opens the course without saving progress. <b>Edit course</b> opens the editor. <b>Assign</b> sends it to more people; drafts must be published first.'),
   ('Course outline', 'Modules and lessons in order, with type and length. Quizzes show how many questions they hold.'),
   ('Course numbers', 'Lessons, people assigned (and overdue), completions, and the average quiz score against the pass mark.'),
   ('Certification', 'The certification it awards, how long it stays valid, and the business-plan step it counts toward.'),
   ('Learners', 'Each person assigned: progress, status, due date and score. <b>Open player</b> records progress; <b>Mark complete</b> records a course finished elsewhere; <b>✕</b> removes the assignment.'),
 ]),
 'learners': ('Learners: completion by partner and by person', 'academy-learners', [
   ('Completion by partner', 'For each partner and course, completed of assigned. Darker green means further along. Click a course name to open it.'),
   ('Learners', 'Everyone with training, sortable by any column. It opens sorted by overdue assignments so the people who need a nudge come first.'),
 ]),
 'player': ('The lesson player, recording progress for one learner', 'academy', [
   ('Lessons', 'Every lesson, grouped by module. A green tick means done; click any lesson to jump to it.'),
   ('Who and when', 'The learner whose progress you are recording, their partner, and the due date.'),
   ('Progress', 'Lessons completed out of the total.'),
   ('The lesson', 'Reading, a video or file link, or a quiz. Quizzes are graded on submit, show the right answers with explanations, and can be retaken.'),
   ('Next step', '<b>Mark complete and continue</b> saves the lesson. After the last lesson the course is complete and, if it awards one, the certification is issued.'),
 ]),
 'imp': ('Importing a partner contact list', 'map', [
   ('Choose the list', 'Upload a CSV or paste rows copied from a spreadsheet. <b>Copy a template header</b> gives you the column names to start from.'),
   ('Match columns', 'The hub guesses each column from its name. Fix any it got wrong. Full name, or first and last name, plus a partner are required.'),
   ('Rules', 'Choose a partner for rows whose partner name doesn’t match, and whether to skip or update contacts that already exist (matched by email, or by name and partner).'),
   ('Check every row', 'New, update, skip or the reason a row can’t be imported. Amber notes flag rows that will sit at the state centre because the city isn’t on the map.'),
   ('Import', 'Saves the contacts. They appear on the map and in the contact list straight away.'),
 ]),

 'search': ('Search: type a few letters, then pick a result', 'home', [
   ('Type to search', 'Matches names, partner names, products and stages. Here, “blue” finds the partner and every deal and MDF line tied to it.'),
   ('Results by type', 'The tag on the left says what each result is. Use <kbd>↑</kbd> <kbd>↓</kbd> to move, <kbd>Enter</kbd> to open, <kbd>Esc</kbd> to close.'),
 ]),
 'mobile': ('On a phone', 'home', [
   ('Views become a scrolling strip', 'Swipe sideways to reach every view. Everything else stacks into one column.'),
   ('Numbers stack two by two', 'Tables scroll sideways inside their own panel, so the page itself never does.'),
 ]),
 'partner': ('A partner page: Keystone Systems Integration', 'p-keystone', [
   ('Breadcrumbs', 'Shows where you are. Each step is a link back up. The browser Back button also works.'),
   ('Business plan and Edit partner', '<b>Edit partner</b> changes the name, type, tier, region, primary contact, MDF allocation, reported pipeline and notes. It also holds <b>Delete partner</b>; their deals, MDF and contacts stay on file.'),
   ('Partner numbers', 'MDF used against allocation, open pipeline, pipeline credited to marketing, and the pipeline the partner reported. When reported and actual deals differ by more than a quarter, the gap shows in amber.'),
   ('Lifecycle', 'Five stages with four checklist items each. See <a href="#lifecycle">Lifecycle</a> below.'),
   ('Campaigns and MDF', 'Every MDF request for this partner, the campaign it funds, its status and the pipeline it earned. <b>New campaign</b> and <b>Request MDF</b> start one with this partner already filled in. The Deals, Content and Events panels sit underneath; <b>Plan an event</b> is on the Events panel.'),
   ('Profile', 'Primary contact, MDF allocation and notes. Below it: contacts from the Portal and Desk, training progress, and the name this partner uses in the other tools.'),
 ]),
 'leadmap': ('Account mapping: where you and your partners overlap', 'leads', [
   ('Partner', 'Look at one partner’s overlaps, or all of them. Focusing the hub on a partner sets this for you.'),
   ('The numbers', 'Accounts with at least one partner mapped, overlaps worth working (introductions, co-sells and hand-ins), open leads, and open partner pipeline on mapped accounts.'),
   ('Overlap matrix', 'Rows are your relationship with the account, columns are the partner’s. Each cell counts account–partner pairs and is coloured by what to do about them. Click a cell to list its accounts below; click again to clear.'),
   ('What each overlap means', 'Partner can introduce, Active co-sell, Bring the partner in, Expand together, Joint prospect and Whitespace, with the move each one calls for.'),
   ('Best accounts to work', '<b>Suggest with AI</b> reads the overlaps, pipeline, leads and next steps and picks five pairs worth your time this week, each with a first move. It only uses the facts in the hub.'),
   ('Overlaps to work', 'Introductions, co-sells and hand-ins by default, or the cell you clicked. Sort by any column; overdue next steps are red.'),
 ]),
 'account': ('An account: who has the relationship, and the plan', 'ac-s001', [
   ('Account actions', '<b>Send to Notion</b> or <b>Send to Apollo</b> copies it to your CRM, <b>Add lead</b> adds a person here, <b>Edit account</b> changes the details or deletes it.'),
   ('Partner mapping', 'Each partner’s relationship with the account (customer, open opportunity, prospect or not engaged), their role and their rep. Changes save straight away and the overlap updates. Add another partner underneath.'),
   ('Co-sell plan', 'Stage, who leads, your own status and owner, and the next step with a due date. Saves as you change each field.'),
   ('Engagement brainstorm', 'Pick a partner and an optional angle, then <b>Brainstorm plays</b>. Each play says who leads, why, first steps with owners, an opener, who to reach and signs it’s working. Save the good ones, track their status, and draft an intro email from any play.'),
   ('People', 'Leads at this account with their status. Add one here and it’s linked automatically.'),
   ('Opportunities', 'Partner deals on this account. <b>Log opportunity</b> adds one straight into Pipeline.'),
 ]),
 'lead': ('A lead: routing it to a partner', 'ld-s007', [
   ('Where it is', 'New, assigned, accepted, working, qualified, converted. Declined and disqualified leads keep their reason in the history.'),
   ('Hand-off', 'The buttons change with the step: assign to a partner, record their answer, start working, mark qualified, then <b>Convert to opportunity</b>, which creates the pipeline deal. Next step and due date save as you type.'),
   ('Partner hand-off note', '<b>Draft with AI</b> writes a short note for the partner rep: who, why now, what you know, the suggested first move. Copy it into an email.'),
   ('History', 'Every routing step, with who did it and any reason given.'),
   ('Account', 'The lead’s account and how the assigned partner relates to it. If the partner isn’t mapped yet, map them in one click.'),
 ]),
 'leadimport': ('Importing accounts, leads or opportunities', 'leads-import', [
   ('What you’re importing', 'Accounts, leads or opportunities. The required fields, the fields needed to co-manage the account, and the optional ones are listed for each. Download a template to start from.'),
   ('Add the file', 'Choose a CSV, or paste rows from a spreadsheet. Salesforce and HubSpot export column names are recognized.'),
   ('Match the columns', 'Each hub field shows the column it was matched to; change any of them. Pick a default partner for rows without one, and whether existing records are updated or skipped.'),
   ('Check and import', 'Every row says New, Update, Skip or why it can’t be imported, with warnings such as a new account being created. Nothing is saved until you select <b>Import</b>.'),
 ]),
 'crm': ('CRM connections: Notion, Apollo.io, Salesforce and HubSpot', 'leads-crm', [
   ('Notion', 'Three Notion databases mirror the hub. <b>Push</b> sends new and changed records; <b>Pull</b> lists what changed in Notion and saves only what you tick. Rows added in Notion come in as new records.'),
   ('Apollo.io', 'Fetch contacts saved in Apollo as leads, or Apollo deals as opportunities, pick a partner and import. Send any lead or account to Apollo from its page. No Apollo credits are used.'),
   ('Salesforce and HubSpot', 'Not connected yet. Import their CSV exports meanwhile. Once a connector is added in claude.ai, ask Claude to switch on live sync.'),
   ('Sync history', 'Every push, pull and send, with when and who.'),
 ]),
 'regqueue': ('Deal registration: the review queue', 'dealreg', [
   ('Portal and manual entry', '<b>Open the partner portal</b> shows what partners see. <b>Register for a partner</b> enters one they sent by email or phone.'),
   ('Tabs', 'Review queue, Approved (under protection, soonest expiry first), every registration, and Lead acceptance.'),
   ('The numbers', 'Waiting on you, conflicts in the queue, registered pipeline under protection, and how quickly you decide.'),
   ('Registrations', 'Oldest first. The Check column flags conflicts at a glance.'),
 ]),
 'reg': ('A registration with a channel conflict', 'dr-s010', [
   ('Conflict check', 'Run automatically against accounts, partner deals, other registrations and leads, by name, website and contact email. Red is a real conflict, amber a flag, grey for information.'),
   ('Decision', '<b>Approve</b> protects the partner for the set number of days, maps them to the account and creates the pipeline deal. <b>Ask for more info</b> sends a question back through the portal. <b>Reject</b> needs a reason the partner will see. Approved ones can be extended or revoked.'),
   ('Opportunity', 'What the partner told you: product, amount, close date, their stage, the customer’s need and the competition.'),
   ('Submitted by', 'Who submitted it, when, and whether it came through the portal or from a lead.'),
 ]),
 'portal': ('The partner portal: leads waiting for an answer', 'portal', [
   ('Who’s using it', 'The partner picks their company and enters their name and email once; this browser remembers them.'),
   ('Sections', 'Leads for you, Register a deal, and My registrations with each one’s status.'),
   ('A lead to answer', '<b>Accept</b> takes it on; <b>Decline</b> asks for a short reason. The answer is due within the window you set.'),
   ('Leads they’re working', 'Accepted leads, each with <b>Register a deal</b> to start a registration already filled in.'),
 ]),
 'portalreg': ('The partner portal: registering a deal', 'portal', [
   ('Customer', 'Company name is required; the website makes conflict checks more accurate.'),
   ('Opportunity', 'Product, amount, expected close and the customer’s need are required. If you already have activity on the account, the partner sees a gentle heads-up before submitting.'),
   ('Submit', 'They get a reference number straight away and can follow the decision under My registrations.'),
 ]),
 'accept': ('Lead acceptance', 'dealreg-leads', [
   ('The numbers', 'Leads waiting on partners and how many are past the window, acceptance rate and median time to accept over 90 days, and new leads not yet routed.'),
   ('Waiting for an answer', 'Oldest first, with the due date. Record an answer the partner gave you by phone, or <b>Copy nudge</b> for a ready-made reminder.'),
   ('By partner', 'Sent, accepted, declined and waiting per partner, with acceptance rate and average time to accept.'),
 ]),
 'mdflist': ('MDF: every request and what it returned', 'mdf', [
   ('New MDF request and Program settings', '<b>New MDF request</b> records a partner’s ask: partner, activity, type, amount, run date, expected leads, and optionally the campaign and event it pays for. <b>Program settings</b> sets the pool size and fiscal year.'),
   ('MDF pool', 'How much of this year’s pool is paid, claimed, approved and requested, and what’s left. Red means over-committed.'),
   ('Filter', 'Show all requests, one status, or <b>No campaign</b> to find funds that aren’t tied to a campaign yet.'),
   ('Attributed', 'Pipeline credited to this request under the model chosen on the Attribution page.'),
   ('Return', 'Attributed pipeline divided by the amount. Green means at or above your target, amber means below. “Not run yet” marks requests that haven’t happened.'),
 ]),
 'lifecycle': ('Lifecycle: Bluebonnet is two items from Grow', 'p-bluebonnet', [
   ('Stages', 'Green stages are finished, the outlined one is current. Each shows items done out of four. Click any stage to see its checklist.'),
   ('Checklist', 'Tick an item when it’s done. It saves straight away; untick to undo.'),
   ('Advance', 'When every item in the current stage is ticked, <b>Advance to …</b> appears. <b>Move back</b> undoes a move. The date of the last move shows on the right.'),
 ]),
 'partners': ('Partners: lifecycle at a glance', 'partners', [
   ('Add partner', 'Name, type, tier, region, starting stage and MDF allocation. The new partner opens straight away.'),
   ('Stage counts', 'How many partners sit in each stage. Click one to filter the table; click it again to clear.'),
   ('Ready to advance', 'Partners whose current stage checklist is complete. They also appear on Home under Needs attention.'),
   ('Lifecycle column', 'Stage, a <b>ready</b> tag when they can advance, and a bar for how much of the 20-item journey is done.'),
 ]),
 'mdf': ('One MDF request: a claim waiting to be paid', 'm4', [
   ('The chain, left to right', 'What was funded, the leads it produced, the deals it touched, the pipeline it earned and the return per dollar.'),
   ('Workflow', 'Where the request sits: Requested, Approved, Claim submitted, Paid. The buttons change with the step. See <a href="#approvemdf">Decide, claim and pay</a>.'),
   ('Request history', 'Every step with its date, plus the reason for any rejection or returned claim. Proof of performance shows underneath once a claim is in.'),
   ('Pipeline credited to this request', 'Each deal it touched, the share of credit it earned on that deal, and the dollar value of that share.'),
   ('Funds this campaign', 'Pick the campaign this money pays for and select <b>Save</b>. The request’s touches then count toward that campaign too.'),
 ]),
 'campaign': ('A campaign: Ransomware readiness for Texas clinics', 'c1', [
   ('Campaign actions', '<b>Brainstorm content</b> opens the content studio, <b>Request MDF</b> starts a request already tied to this campaign, and <b>Edit brief</b> changes the name, partner, status, launch date, goal, audience, offer and buyer pain, or deletes the campaign.'),
   ('Campaign chain', 'Campaign spend is the total of the MDF requests linked to it. Pipeline and return follow from the deals its touches reached.'),
   ('Brief', 'What the campaign is for. Change its status from the menu in the corner.'),
   ('Joint messaging', 'Positioning, tagline, what each side brings, proof points and calls to action. <b>Draft with AI</b> writes it from the brief; <b>Edit</b> lets you change any line. AI never invents numbers: replace [X] placeholders before anything ships.'),
   ('Discussion', 'Decisions and hand-offs with the partner team, newest last. Type a note and select <b>Post note</b>.'),
   ('Funded by', 'The MDF requests behind the campaign, with amount and status. Content and Events panels sit underneath.'),
 ]),
 'event': ('An event: checking reported pipeline against real deals', 'e3', [
   ('Reconciliation warning', 'This shows when the pipeline claimed in the event recap and the deals actually linked to the event differ by more than 15%. Add an event touch to each missing deal, or correct the recap.'),
   ('Reported pipeline', 'The opportunities and pipeline the event recap claims, entered under Results.'),
   ('Linked deals', 'The total of the deals carrying a touch from this event.'),
   ('Results', 'Registrations, attendance, leads and reported pipeline. <b>Update results</b> changes them; show rate and cost per lead are worked out for you.'),
 ]),
 'runsheet': ('Planning an event: the run sheet', 'e1', [
   ('Edit event', 'Name, partner, format, date, time, venue, budget, status, campaign and MDF. Changing the date moves every run-sheet due date with it.'),
   ('Run sheet', 'Fourteen steps from six weeks out to two weeks after, grouped before, on the day and follow-up. Tick each one off. Red dates are overdue and also show on Home. Click the owner tag to switch between the partner and you.'),
   ('Add a task', 'Anything the standard list doesn’t cover: give it a name, a due date and an owner.'),
   ('Results', 'Registrations against target, show rate, leads and cost per lead, opportunities and reported pipeline.'),
   ('Budget and funding', 'The MDF request and campaign behind the event. If either is missing, <b>Request MDF for this event</b> or <b>Create promotion campaign</b> opens a form with the event’s details filled in.'),
   ('Agenda and promotion', 'The run of show, the promotion schedule and logistics notes. <b>Draft with AI</b> writes the first two; edit any box and click away to save. <b>Download plan</b> saves everything, run sheet included, as a Markdown file.'),
 ]),
 'newevent': ('New event: the form', 'events', [
   ('Event details', 'Name and partner are required. Format, time, venue, registration target and budget can be changed later.'),
   ('Date', 'The run sheet counts back from this date. Webinars get a platform test instead of catering.'),
   ('Campaign and MDF', 'Link existing ones for this partner now, or later from the event page.'),
   ('Create', 'Saves the event and opens it with the full run sheet ready.'),
 ]),
 'settings': ('Program settings', 'home', [
   ('MDF pool', 'This year’s total MDF budget. The MDF page shows how much is committed against it.'),
   ('Return target', 'Pipeline you expect per MDF dollar. Green and amber returns across the hub use it.'),
   ('Brand voice', 'How AI drafts sound: messaging, event plans, content. Vendor name and colors are used on every co-branded piece.'),
 ]),
 'deal': ('A deal: where its credit goes', 'DS038', [
   ('Status at a glance', 'Stage, plus whether marketing <b>sourced</b> the deal (the first touch came before the deal opened) or <b>influenced</b> it (every touch came later).'),
   ('Deal facts', 'Amount and weighted value, close date with days remaining, date created, and touch count.'),
   ('Marketing touches', 'Each row is one dated touch. It shows which campaign and MDF request the touch traces back to, and the share of credit it gets under each of the four models. The current model’s column is highlighted.'),
   ('Add a touch', 'Choose Event, Campaign or MDF activity, pick the specific record, set the date and add a short note. Only this deal’s partner’s records are listed.'),
   ('Open in the Pipeline Portal', 'Change the deal itself (amount, stage, next step) in the tool that owns it.'),
 ]),
 'attribution': ('Attribution: from MDF to pipeline', 'attribution', [
   ('Model', 'Choose how a deal’s value is shared between its touches. Your choice is remembered in this browser and applies everywhere in the hub.'),
   ('Program totals', 'MDF committed, pipeline credited to marketing, pipeline per MDF dollar (select <b>Change</b> to set the target), and pipeline with no marketing touch at all.'),
   ('Where the money went', 'Each band runs from an MDF request, through its campaign, to the deal outcome. Its width is credited deal value. Click any MDF or campaign node to open it. Untick the box to hide deals with no touch.'),
   ('By campaign', 'Sourced, influenced and won pipeline per campaign, with its return.'),
   ('By MDF request', 'Deals touched, pipeline, cost per deal and return for each request.'),
   ('Reported vs attributed', 'Pipeline partners and event recaps report, checked against the deals linked here. Large gaps are worth a conversation with the partner.'),
 ]),
 'board': ('Pipeline · Board', 'board', [
   ('Pipeline tabs', 'Deals, Board, Forecast and Engagement, rebuilt from the Pipeline Portal on the hub’s linked records.'),
   ('Partner filter', 'Select one or more partners. The filter carries across the pipeline tabs and the partner map. <b>All partners</b> clears it.'),
   ('Stage mix', 'Open pipeline value by stage, left to right.'),
   ('Deal card', 'Amount, partner, product, close date (red once it passes), sourced or influenced, and days in the current stage (amber after 30).'),
   ('Move a deal', 'Use the stage menu, or drag the card to another column.'),
 ]),
 'map': ('Partners · Map: contacts with filters', 'map', [
   ('List and Map', 'The Partners section has two tabs. The Map tab brings over the Pipeline Portal’s contact map.'),
   ('Filters', 'Search names, titles, deals and cities; type a partner name to find it; narrow by state, contact status, or whether the contact has open deals. Numbers in each list show what that choice would leave. <b>Clear filters</b> resets everything.'),
   ('Partner type', 'Each chip turns a type on or off. Pin colours match the chips.'),
   ('Moving around', 'Use <b>+</b> and <b>−</b>, scroll to zoom, drag to pan, and <b>⤢</b> to reset. Click a state to filter to it and zoom in; click it again to clear.'),
   ('Legend', 'Partner types with how many contacts of each are in view. Faded pins are contacts with no open deals.'),
   ('Contacts', 'The contacts in view, A–Z by last name, with open pipeline and city. Hover a row to light up its pin; click a row or a pin to open the contact record.'),
 ]),
 'maprec': ('Partners · Map: a contact record', 'map', [
   ('At a glance', 'Open pipeline, closed-won value and days since the last touch.'),
   ('Deals', 'Each deal this contact registered, by stage. Click one to open it. <b>+ New deal</b> opens the Pipeline Portal, where deals are created.'),
   ('Contact details', 'Email and phone with <b>Copy</b> buttons, and location.'),
   ('Account', 'The partner, its website and tier, and the partner’s other contacts. Click a name to switch to that contact.'),
   ('Recent activity', 'The latest calls, emails and meetings logged for this contact, including planned ones.'),
   ('Quick actions', '<b>Show on map</b> zooms to the contact. <b>View pipeline</b> filters the pipeline to this partner. <b>Log touchpoint</b> opens Engagement with the contact already chosen. <b>Full contact page</b> opens the contact’s own page.'),
   ('Territory', 'The states this contact covers, filled in the partner-type colour and labelled. If the contact is based outside their territory, their home state is hatched. The same states are shaded on the main map while the record is open. <b>Edit</b> to change them.'),
 ]),
 'forecast': ('Pipeline · Forecast', 'forecast', [
   ('Period', 'Q4 2026, Q1 2027, the next six months, or all dates. Open deals already past their close date count in the current period.'),
   ('Forecast numbers', '<b>Commit</b> is closed won plus Negotiation. <b>Best case</b> adds Proposal. <b>Weighted</b> applies each stage’s win rate to open deals. Set a quarterly target to see coverage.'),
   ('By close month', 'Stacked by category, so you can see when the commit lands.'),
   ('Categories', 'Deals and value per category, and the share with a marketing touch.'),
   ('Needs attention', 'Open deals past their close date or stuck more than 30 days in one stage.'),
   ('By partner', 'Won plus weighted open pipeline for each partner.'),
 ]),
 'engagement': ('Pipeline · Engagement', 'engagement', [
   ('Partner scorecard', 'Score out of 100, contacts, last touch, recent activity, deals registered and win rate. Select a partner’s name to see its detail on the right.'),
   ('Score breakdown', 'The five parts of the selected partner’s score and their weights.'),
   ('Log a touchpoint', 'Record a call, email or meeting. A future date saves it as planned and it won’t count toward the score until then.'),
   ('Weekly activity', 'Touchpoints per partner over the last 12 weeks. Darker means more.'),
   ('Engagement vs pipeline', 'Partners top-left carry pipeline but are going quiet. Re-engage them first.'),
 ]),
 'tools': ('Tools: every partner artifact in one place', 'tools', [
   ('Tool card', 'What the tool is for, and <b>Open</b> to launch it in a new tab.'),
   ('Jump links', 'Open the tool straight on a specific tab, such as the Forecast in the Pipeline Portal.'),
 ]),
}

def fig(fid, n):
    cap, anchor, items = FIGS[fid]
    b = BOX[fid]; W, H = b['w'], b['h']
    boxes = b['boxes']
    assert len(boxes) == len(items), fid
    marks = []
    for i, bx in enumerate(boxes):
        if not bx: continue
        L = bx['x'] / W * 100; T = bx['y'] / H * 100; BW = bx['w'] / W * 100; BH = min(bx['h'], H - bx['y'] - 4) / H * 100
        marks.append(f'<span class="hl" data-k="{i+1}" style="left:{L:.2f}%;top:{T:.2f}%;width:{BW:.2f}%;height:{BH:.2f}%"></span>'
                     f'<button type="button" class="pin{" out" if bx["x"] > 60 and bx["h"] < 80 else ""}" data-k="{i+1}" style="left:{L:.2f}%;top:{T:.2f}%" aria-label="Callout {i+1}: {e(items[i][0])}">{i+1}</button>')
    lst = ''.join(f'<li id="c-{fid}-{i+1}" data-k="{i+1}"><span class="num" aria-hidden="true">{i+1}</span><div><b>{t[0]}</b><p>{t[1]}</p></div></li>' for i, t in enumerate(items))
    pw, ph = (W * 2, H * 2) if W < 500 else (int(W * 1.5), int(H * 1.5))
    phone = ' phone' if W < 500 else ''
    return f'''<figure class="walk{phone}" id="fig-{fid}">
  <div class="shot-wrap"><div class="shot">
    <img src="shots/{fid}.webp" width="{pw}" height="{ph}" alt="Screenshot: {e(cap)}" loading="lazy" decoding="async">
    {''.join(marks)}
    <button type="button" class="zoom" data-src="shots/{fid}.webp" data-alt="{e(cap)}" aria-label="View larger: {e(cap)}"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 11a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM10 10l4 4M4.5 6.5h4M6.5 4.5v4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
  </div></div>
  <figcaption><span class="fn">Figure {n}</span> {e(cap)} <a class="open" href="{HUB}#{anchor}" target="_blank" rel="noopener">Open this view <span aria-hidden="true">↗</span></a></figcaption>
  <ol class="callouts">{lst}</ol>
</figure>'''

counter = [0]
def F(fid):
    counter[0] += 1
    return fig(fid, counter[0])

def steps(tid, title, items, anchor=None):
    li = ''.join(f'<li>{x}</li>' for x in items)
    link = f' <a class="open" href="{HUB}#{anchor}" target="_blank" rel="noopener">Go there <span aria-hidden="true">↗</span></a>' if anchor else ''
    return f'<div class="task" id="task-{tid}"><h4><span class="tag">How to</span> {title}{link}</h4><ol class="steps">{li}</ol></div>'

STEPS = {
'focus': steps('focus', 'Focus the hub on one partner account', [
   'Go to <b>Home</b> and click the <b>Partner account</b> box.',
   'Start typing the partner’s name, then pick it with a click or <kbd>Enter</kbd>.',
   'Every tab now shows only that partner. The chip at the top says who you’re viewing on every page.',
   'Select <b>✕</b> on the chip, or pick <b>All partners</b>, to see the whole program again. The hub remembers your choice in this browser.',
 ], 'home'),
 'import': steps('import', 'Import a contact list', [
   'Open <b>Partners → Map</b> and select <b>Import list</b> in the Contacts panel.',
   'Choose a CSV file, or paste rows from a spreadsheet and select <b>Read pasted rows</b>.',
   'Check the column matches. Pick a partner for unmatched rows, and choose whether existing contacts are skipped or updated.',
   'Read the row-by-row check, then select <b>Import</b>. A summary shows how many were added, updated and skipped.',
 ], 'map'),
 'territory': steps('territory', 'Assign a territory', [
   'Open the contact from the map or the contact list.',
   'In <b>Territory</b>, select <b>Assign</b> (or <b>Edit</b>).',
   'Click states on the small map to add or remove them, or add them from the list.',
   'Select <b>Save territory</b>. You can also import territories in a <b>Territory</b> column, with states separated by semicolons (TX;OK).',
 ], 'map'),
 'brainstorm': steps('brainstorm', 'Brainstorm ideas with AI', [
   'Open <b>Content → Brainstorm</b>.',
   'Pick the partner account, tick the campaigns, and optionally a format and an angle.',
   'Select <b>Brainstorm ideas</b>. The first time, you’ll be asked to allow Claude for this page.',
   'For each idea, select <b>Create draft</b>, <b>Save idea</b> or <b>Dismiss</b>.',
 ], 'brainstorm'),
 'create': steps('create', 'Write and design a piece with AI', [
   'Open the draft. Check the partner, campaigns and brief under <b>Assignment</b>.',
   'Select <b>Write with AI</b>, read the copy, and use <b>Rewrite</b> with a direction if needed.',
   'Pick a size and layout for the brand template, or select <b>Design with AI</b> and then <b>Refine</b>.',
   'Select <b>Save changes</b>. Claude never invents numbers; replace any [X] placeholders before review.',
 ], 'content'),
 'approve': steps('approve', 'Review, approve and publish', [
   'On a finished draft, select <b>Submit for review</b>. A partner and a headline or body are required.',
   'Each side selects <b>Approve as vendor</b> or <b>Approve as partner</b>. Or write what needs fixing and select <b>Request changes</b>.',
   'Once both approve, set a publish date and channel and select <b>Schedule</b>.',
   'After it goes out, select <b>Mark published</b>. Editing the copy or design after review resets both approvals.',
 ], 'content'),
 'plansteps': steps('plansteps', 'Track onboarding and enablement', [
   'Open <b>Business plan</b> and pick the partner (or focus the hub on them from Home).',
   'In <b>Onboarding &amp; enablement</b>, tick each step as it’s finished. The phase bar fills in and the date is recorded.',
   'Add a step with its phase, owner and due date at the bottom of the section. Select <b>✕</b> to remove one.',
   'For a partner with no plan yet, select <b>Save this plan</b> to start from the standard 16-step playbook.',
 ], 'plan'),
 'plangoal': steps('plangoal', 'Set a goal', [
   'In <b>Goals</b>, choose a measure such as Pipeline registered or Certified people.',
   'Enter the target (dollars for money goals), the period, and an optional label.',
   'Select <b>Add goal</b>. Progress is calculated from the hub’s data each time you open the plan.',
 ], 'plan'),
 'planchat': steps('planchat', 'Update the plan with the assistant', [
   'Type what you want, such as “Draft the partnership summary” or “Mark the kickoff meeting done”, or select a quick request.',
   'Read the answer. If it proposes changes, check the list in the <b>Proposed changes</b> card.',
   'Select <b>Apply</b> to save them, or <b>Discard</b>. Applied changes are noted under the assistant’s message.',
 ], 'plan'),
 'planupload': steps('planupload', 'Upload files and logos', [
   'In <b>Files</b>, select <b>Upload file</b> to store agreements, decks or price lists with the plan. In <b>Logos and graphics</b>, select <b>Upload logo</b> for the partner’s logo.',
   'To have the assistant read a file, select <b>Attach</b> in the plan assistant, add a message, and send it.',
   'Uploading needs edit access to the hub. Each file can be up to 20 MB; Word and Excel files can’t be stored, so save them as PDF or CSV first.',
 ], 'plan'),
 'buildcourse': steps('buildcourse', 'Build a course', [
   'On <b>Academy</b>, select <b>Build a course with AI</b>. Describe what partners should learn, pick the track, level and number of modules, and optionally attach a text or Markdown file to teach from. Or select <b>New course</b> to start blank.',
   'In the editor, rename modules and lessons, reorder them with the arrows, and add Reading, Video, File or Quiz lessons. <b>Write this lesson with AI</b> and <b>Write questions from this module with AI</b> fill in the content.',
   'For each quiz question, select the circle beside the correct answer and add a one-line explanation.',
   'Under <b>Course details</b>, set the pass mark, turn on a certification and its validity, and link a business-plan step if it applies.',
   'Select <b>Save course</b>, then <b>Publish</b>. Nothing is visible to assign until the course is published.',
 ], 'academy'),
 'assign': steps('assign', 'Assign training', [
   'Select <b>Assign</b> on a course, <b>Assign training</b> on the Academy, or <b>Assign</b> in the Training panel of a partner or contact.',
   'Choose the course, the partner and the people. People already assigned are greyed out. <b>Select all</b> picks everyone at that partner.',
   'Set a due date (30 days by default) and select <b>Assign</b>. Overdue assignments appear in <b>Needs attention</b> on Home and in red on the Academy.',
 ], 'academy-learners'),
 'certificates': steps('certificates', 'Record progress and issue a certificate', [
   'Open the assignment from the course\'s Learners table, the contact\'s Training panel, or the Academy.',
   'Work through each lesson with the learner and select <b>Mark complete and continue</b>. For quizzes, choose the answers and select <b>Submit answers</b>; below the pass mark, select <b>Retake</b>.',
   'After the last lesson the course is complete. If it awards a certification, the certificate appears with its ID and expiry date.',
   'Select <b>Download PNG</b> or <b>Download SVG</b> to send it to the learner. Every certificate is listed under <b>Academy → Certifications</b>, where expiring ones are flagged 45 days ahead.',
 ], 'academy-certs'),
 'linkmdf': steps('linkmdf', 'Link an MDF request to a campaign', [
   'Open <b>MDF</b> in the side rail and select the <b>No campaign</b> filter.',
   'Click the request’s name to open it.',
   'Under <b>Funds this campaign</b>, choose the campaign from the list.',
   'Select <b>Save</b>. A confirmation appears at the bottom of the screen, and the request’s touches now count toward that campaign.',
   'If the partner has no campaigns yet, select <b>Create one</b> right under the list.',
 ], 'mdf'),
 'advance': steps('advance', 'Move a partner to the next lifecycle stage', [
   'Open the partner. The <b>Lifecycle</b> panel shows the current stage’s checklist.',
   'Tick each item as it’s done. Each tick saves on its own.',
   'When all four are ticked, select <b>Advance to …</b>. The partner moves on and the next checklist appears.',
   'Moved too early? Select <b>Move back to …</b>.',
 ], 'partners'),
 'approvemdf': steps('approvemdf', 'Decide on an MDF request, then claim and pay it', [
   'Open the request from <b>MDF</b> or from <b>Needs attention</b> on Home. (Home also has an <b>Approve</b> button for quick yeses.)',
   'Select <b>Approve</b>, or <b>Reject…</b> and give a reason. The reason is kept in the request history.',
   'After the activity runs, select <b>Submit claim…</b> and enter the actual leads and what proof the partner sent. Both are required.',
   'Check the proof, then select <b>Mark paid</b>, or <b>Return claim…</b> with a note to send it back to Approved.',
 ], 'mdf'),
 'newcampaign': steps('newcampaign', 'Start a campaign and draft its joint messaging', [
   'Select <b>New campaign</b> on Campaigns, or on the partner’s page so the partner is filled in.',
   'Give it a name and partner. Add the goal, audience, offer and buyer pain; the AI uses all of them.',
   'Select <b>Create</b>. On the campaign page, select <b>Draft with AI</b> under Joint messaging.',
   'Select <b>Edit</b> to fix any line and replace [X] placeholders, then set the status from the Brief panel as work moves on.',
 ], 'campaigns'),
 'planevent': steps('planevent', 'Plan an event from start to finish', [
   'Select <b>New event</b> on Events (or <b>Plan an event</b> on a partner page). Fill in the name, partner and date, then <b>Create</b>.',
   'On the event page, select <b>Request MDF for this event</b> and <b>Create promotion campaign</b>. Both forms arrive filled in.',
   'Select <b>Draft with AI</b> for the agenda and promotion plan, and add logistics notes.',
   'Work the run sheet week by week. Overdue steps show in red here and on Home.',
   'Afterwards, select <b>Update results</b>, then link the deals it produced (see <a href="#reconcile">close a gap</a>).',
 ], 'events'),
 'mapaccount': steps('mapaccount', 'Map a partner to an account', [
   'Open the account from <b>Leads &amp; accounts → Accounts</b>, or create one with <b>New account</b>.',
   'Under <b>Partner mapping</b>, pick the partner and their status, then select <b>Map partner</b>.',
   'Set their role and the partner rep’s name. The overlap updates as you go.',
   'In <b>Co-sell plan</b>, decide who leads and set the next step with a date.',
 ], 'leads'),
 'routelead': steps('routelead', 'Route a lead to a partner and follow it through', [
   'Open the lead. Under <b>Hand-off</b>, choose the partner and select <b>Assign to partner</b>.',
   'Optionally select <b>Draft with AI</b> under Partner hand-off note and send it to the partner rep.',
   'The partner accepts or declines in the portal. If they tell you directly, record it with <b>Partner accepted</b> or <b>Partner declined</b>.',
   'Move it to <b>Working</b> and <b>Qualified</b>, then <b>Convert to opportunity</b> to create the pipeline deal.',
 ], 'leads-people'),
 'importlist': steps('importlist', 'Import a list from Salesforce, HubSpot or a spreadsheet', [
   'Open <b>Leads &amp; accounts → Import</b> and choose Accounts, Leads or Opportunities.',
   'Choose the CSV file, or paste the rows and select <b>Read pasted rows</b>.',
   'Check the column matches, pick a default partner if the file has no partner column, and choose update or skip for existing records.',
   'Read the row check, fix anything marked red in the file if needed, then select <b>Import</b>.',
 ], 'leads-import'),
 'syncnotion': steps('syncnotion', 'Sync with Notion', [
   'Open <b>Leads &amp; accounts → CRM connections</b>.',
   'Select <b>Push</b> next to Accounts, Leads or Opportunities to send new and changed records. The first time, choose Allow when claude.ai asks.',
   'After editing in Notion, select <b>Pull</b>. Review the list of changes and untick any you don’t want.',
   'Select <b>Apply</b>. Rows added in Notion become new hub records, and their Hub ID is written back.',
 ], 'leads-crm'),
 'pullapollo': steps('pullapollo', 'Bring Apollo contacts in as leads', [
   'On <b>CRM connections</b>, choose <b>Contacts → leads</b> and add keywords if you want to narrow it down.',
   'Select <b>Fetch from Apollo</b>. Contacts already in the hub are greyed out.',
   'Tick the ones to bring in and choose the partner to route them to (or leave them unassigned).',
   'Select <b>Import</b>. Their companies become accounts mapped to that partner.',
 ], 'leads-crm'),
 'reviewreg': steps('reviewreg', 'Review a deal registration', [
   'Open it from <b>Deal registration</b> or from <b>Needs attention</b> on Home.',
   'Read the <b>Conflict check</b>. Open anything red and talk to the other side first.',
   'Select <b>Approve</b>, <b>Ask for more info</b> or <b>Reject</b>. The partner sees your note in the portal.',
   'Before protection ends, select <b>Extend protection</b> if the deal is still moving.',
 ], 'dealreg'),
 'partnerportal': steps('partnerportal', 'Give partners the portal', [
   'Share the hub with the partner from its Share menu on claude.ai.',
   'Send them to the portal link (the hub address ending in <b>#portal</b>).',
   'They pick their company, add their name and email, then accept leads and register deals.',
   'Set the response window and protection period in <b>Program settings</b>.',
 ], 'portal'),
 'addtouch': steps('addtouch', 'Record that a deal was touched by an event, campaign or MDF activity', [
   'Open the deal from <b>Pipeline</b>, from search, or from any table where its name appears.',
   'Scroll to <b>Marketing touches</b>.',
   'In <b>Touch type</b>, pick Event, Campaign or MDF activity. The second list then shows that partner’s records of that type.',
   'Pick the record, set the date it happened, and add a short note such as “CFO attended”.',
   'Select <b>Add touch</b>. Credit is recalculated straight away across the deal, its campaign, the MDF behind it and the Attribution page.',
 ], 'pipeline'),
 'removetouch': steps('removetouch', 'Remove a touch added by mistake', [
   'On the deal page, find the touch in the <b>Marketing touches</b> table.',
   'Select <b>Remove</b>. The button turns red and reads <b>Confirm remove</b>.',
   'Select it again within four seconds to remove the touch. If you wait longer, nothing changes.',
 ]),
 'reconcile': steps('reconcile', 'Close a gap between reported and linked pipeline', [
   'On <b>Home</b>, look for an amber <b>Reported vs attributed gap</b> item, or open the Attribution page and scroll to <b>Reported vs attributed</b>.',
   'Open the event or partner. The warning banner states the gap in dollars and number of deals.',
   'Ask the partner which accounts came from the event. Find each deal with search.',
   'Add an <b>Event</b> touch to each deal, dated the day of the event.',
   'If the recap number itself is wrong, select <b>Update results</b> on the event and correct it.',
 ], 'events'),
 'qbr': steps('qbr', 'Prepare attribution numbers for a partner QBR', [
   'Open <b>Attribution</b> and compare <b>Linear</b> with <b>First touch</b>. First touch shows what started deals; Linear shows the steady contribution.',
   'Open the partner page and note MDF used, attributed pipeline and return per dollar.',
   'In <b>Pipeline · Forecast</b>, select only that partner in the filter to see their commit and best case.',
   'In <b>Pipeline · Engagement</b>, check the score breakdown to spot where the relationship needs attention.',
   'Copy the address bar on any page to share that exact view. The link only works for people the hub is shared with.',
 ], 'attribution'),
 'movestage': steps('movestage', 'Move a deal to a new stage', [
   'Open <b>Pipeline</b>, then the <b>Board</b> tab.',
   'Drag the card into the new column, or change the stage menu at the bottom of the card.',
   'The card moves and its days-in-stage count restarts. This changes the hub’s copy only. Update the Pipeline Portal too if you track deals there.',
 ], 'board'),
 'target': steps('target', 'Set targets', [
   '<b>Quarterly forecast target:</b> on <b>Pipeline · Forecast</b>, pick Q4 2026 or Q1 2027, select <b>Edit</b> (or <b>Set</b>) on the target tile, enter the dollar amount and select <b>Save</b>.',
   '<b>Return target (pipeline per MDF dollar):</b> on <b>Attribution</b>, select <b>Change</b> on the Pipeline per MDF $ tile, enter a multiple such as 10 and select <b>Save target</b>. Green and amber colouring across the hub follows this number.',
 ], 'forecast'),
 'logtouch': steps('logtouch', 'Log a partner touchpoint', [
   'Open <b>Pipeline · Engagement</b>.',
   'Select the partner’s name in the scorecard.',
   'Under <b>Log a touchpoint</b>, choose Call, Email or Meeting, the date, and optionally the contact.',
   'Write a one-line summary and select <b>Log touchpoint</b>. The score and weekly grid update straight away.',
 ], 'engagement'),
}

tmpl = (ROOT / 'template.html').read_text()
out = tmpl
import re
out = re.sub(r'\{\{FIG:(\w+)\}\}', lambda m: F(m.group(1)), out)
out = re.sub(r'\{\{STEPS:(\w+)\}\}', lambda m: STEPS[m.group(1)], out)
out = out.replace('{{HUB}}', HUB).replace('{{ALIGN}}', TOOLS['align']).replace('{{PORTAL}}', TOOLS['portal']).replace('{{DESK}}', TOOLS['desk'])
(ROOT / 'index.html').write_text(out)
print('figures', counter[0], 'bytes', len(out))
