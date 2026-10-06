import type {
  AppNotification, AuditEvent, Campaign, Commitment, HelpRequest, ItemListing, ItemNeed, LedgerEntry,
  ModItem, Organization, Passage, Person, Prasad, Reflection,
} from '@/types';

/** Every person, organization and campaign below is FICTIONAL demo data. */

const v = (over: Partial<Person['verification']> = {}): Person['verification'] => ({
  phone: true, college: true, identity: 'completed', orientation: true, skills: [], ...over,
});

export const PEOPLE: Person[] = [
  {
    id: 'p-aarav', displayName: 'Aarav', roles: ['sevak', 'sahabhagi', 'donor'], languages: ['English', 'Hindi'],
    skills: ['mathematics', 'resume review', 'digital literacy'], interests: ['Education', 'Digital assistance'],
    availability: ['saturday', 'weekends', 'remote'], area: 'Kothrud, Pune', bio: 'Third-year engineering student who likes explaining things slowly.',
    affiliation: 'Sahyadri College of Engineering (fictional)', trustTags: ['Patient', 'Clear', 'Good listener'],
    verification: v({ skills: ['Mathematics (tutor-reviewed)'] }), fictional: true,
  },
  {
    id: 'p-meera', displayName: 'Meera', roles: ['sahabhagi', 'sevak'], languages: ['English', 'Hindi', 'Marathi'],
    skills: ['spoken english practice'], interests: ['Education', 'Environment'], availability: ['saturday', 'sunday', 'remote'],
    area: 'Kothrud, Pune', bio: 'First-year student building confidence in college mathematics.',
    affiliation: 'Sahyadri College of Engineering (fictional)', trustTags: ['Respectful'],
    verification: v({ orientation: false }), fictional: true,
  },
  {
    id: 'p-kavya', displayName: 'Kavya (Moderator)', roles: ['moderator'], languages: ['English', 'Hindi'], skills: [], interests: [],
    availability: [], area: 'SevaSetu Trust & Safety', bio: 'Reviews flags with the people involved in mind.', trustTags: [],
    verification: v({ skills: ['Trust & safety training'] }), fictional: true,
  },
  {
    id: 'p-rohan', displayName: 'Rohan', roles: ['sevak'], languages: ['English', 'Marathi'], skills: ['mathematics', 'physics'],
    interests: ['Education'], availability: ['sunday', 'weekends'], area: 'Karve Nagar, Pune', bio: 'Postgraduate student, enjoys problem-solving sessions.',
    affiliation: 'Sahyadri College of Engineering (fictional)', trustTags: ['Reliable', 'Patient'], verification: v(), fictional: true,
  },
  {
    id: 'p-sunita', displayName: 'Sunita-ji', roles: ['sahabhagi'], languages: ['Hindi', 'Marathi'], skills: ['storytelling', 'cooking'],
    interests: [], availability: ['weekdays'], area: 'Warje, Pune', bio: 'Retired schoolteacher. Happy to share stories in return for patience with screens.',
    trustTags: [], verification: v({ college: false, identity: 'completed' }), anchorVerified: true, fictional: true,
  },
  {
    id: 'p-neha', displayName: 'Neha', roles: ['sahabhagi'], languages: ['English', 'Hindi'], skills: [], interests: [], availability: ['remote'],
    area: 'Pune (remote)', bio: 'Recent graduate preparing first job applications.', trustTags: [], verification: v({ orientation: false }), fictional: true,
  },
  {
    id: 'p-ishaan', displayName: 'Ishaan', roles: ['sahabhagi'], languages: ['Hindi', 'English'], skills: ['chess'], interests: [], availability: ['remote', 'weekends'],
    area: 'Pune (remote)', bio: 'Wants to practise spoken English before interviews.', trustTags: [], verification: v({ college: false }), fictional: true,
  },
  {
    id: 'p-lata', displayName: 'Lata Tai (Anchor)', roles: ['anchor'], languages: ['Marathi', 'Hindi'], skills: [], interests: ['Health awareness'],
    availability: ['weekdays'], area: 'Warje, Pune', bio: 'ASHA worker connecting neighbours with trusted help.', trustTags: ['Reliable', 'Respectful'],
    verification: v({ college: false }), anchorVerified: true, fictional: true,
  },
];

export const ORGS: Organization[] = [
  {
    id: 'o-shiksha', name: 'Shiksha Setu Collective (fictional)', kind: 'Registered education non-profit', verifiedOn: '2026-06-14',
    dossier: [
      { label: 'Registration certificate checked', status: 'verified' },
      { label: 'Office address visited by SevaSetu partner', status: 'verified' },
      { label: 'Two trustee identities confirmed (stored as results only)', status: 'verified' },
      { label: 'Child-safeguarding policy on file', status: 'verified' },
      { label: 'Annual financial statement', status: 'pending' },
    ],
    contactLabel: 'Contact through the campaign room (no personal numbers shown)',
  },
  {
    id: 'o-asha', name: 'Gram Swasthya Mitra Samiti (fictional)', kind: 'ASHA-led community health group', verifiedOn: '2026-04-02',
    dossier: [
      { label: 'Registration certificate checked', status: 'verified' },
      { label: 'ASHA worker roster confirmed by local health office', status: 'verified' },
      { label: 'Health-information review by a clinician', status: 'verified' },
    ],
    contactLabel: 'Contact through Anchor Lata Tai',
  },
  {
    id: 'o-blood', name: 'Sanjeevani Institute Blood Centre (fictional)', kind: 'Licensed blood centre',
    verifiedOn: '2026-01-20',
    dossier: [
      { label: 'Blood-bank licence verified', status: 'verified' },
      { label: 'Medical director confirmed', status: 'verified' },
      { label: 'Donor eligibility decided only by the centre\'s clinicians', status: 'verified' },
    ],
    contactLabel: 'Bookings handled by the centre, not by SevaSetu',
  },
  {
    id: 'o-green', name: 'Mulamutha Riverbank Friends (fictional)', kind: 'Resident-run environment group', verifiedOn: '2026-08-09',
    dossier: [
      { label: 'Society registration checked', status: 'verified' },
      { label: 'Municipal clean-up permission on file', status: 'verified' },
    ],
    contactLabel: 'Contact through the campaign room',
  },
];

const ev = (d: string, text: string) => ({ at: d, text, consentConfirmed: true });

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'c-lamps', title: 'Evening Learning Lamps', category: 'Education', orgId: 'o-shiksha',
    story: 'Twice a week, volunteers sit with older school students at a community hall near Warje to work through mathematics and science together. Students choose the topics. The hall is lit by donated lamps so sessions can run after sunset.',
    objective: 'Run 24 evening study sessions at the Warje community hall before December.', area: 'Warje, Pune', distanceKm: 3.4,
    timeline: '12 Oct – 18 Dec 2026', commitment: '2 hours, Tue & Thu evenings', skillsNeeded: ['mathematics', 'science', 'teaching'], interests: ['Education'],
    roles: [
      { id: 'r-teach', title: 'Teaching volunteer', slots: 8, filled: 5, training: 'Child-safeguarding orientation (45 min)', risk: 'high' },
      { id: 'r-setup', title: 'Hall set-up and welcome', slots: 4, filled: 2, risk: 'low' },
    ],
    budget: [
      { label: 'Notebooks and stationery', planned: 12000 }, { label: 'Lighting', planned: 9000 },
      { label: 'Hall contribution', planned: 6000 }, { label: 'Snacks (water and fruit)', planned: 3000 },
    ],
    goal: 30000, status: 'active',
    statusHistory: [{ at: '2026-09-01', status: 'active', note: 'Campaign opened after dossier review.', by: 'Moderator Kavya' }],
    updates: [ev('2026-09-28', 'Hall repainted by residents. Lamps installed. First session this Tuesday.')],
    fictional: true,
  },
  {
    id: 'c-asha', title: 'Monsoon Health Awareness Walks', category: 'ASHA-worker initiatives', orgId: 'o-asha',
    story: 'ASHA workers lead short neighbourhood walks to share clinician-reviewed information on water safety and mosquito prevention. Volunteers help with translation and carry information leaflets. Volunteers never give medical advice.',
    objective: 'Reach 400 households with reviewed health information in Hindi and Marathi.', area: 'Warje, Pune', distanceKm: 4.1,
    timeline: '5 Oct – 30 Nov 2026', commitment: '90 minutes, Sunday mornings', skillsNeeded: ['Marathi', 'Hindi', 'communication'], interests: ['Health awareness', 'Community service'],
    roles: [{ id: 'r-walk', title: 'Walk companion and translator', slots: 12, filled: 7, training: 'Short briefing on what not to advise', risk: 'medium' }],
    budget: [{ label: 'Printing leaflets', planned: 4000 }, { label: 'Tea and water for walkers', planned: 1500 }],
    goal: 5500, status: 'active',
    statusHistory: [{ at: '2026-08-20', status: 'active', note: 'Campaign opened.', by: 'Moderator Kavya' }],
    updates: [ev('2026-09-30', 'First walk reached 38 households. Leaflets reprinted with a clearer Marathi translation.')],
    fictional: true,
  },
  {
    id: 'c-blood', title: 'Community Blood Donation Camp', category: 'Blood-donation camps', orgId: 'o-blood',
    story: 'A one-day camp run entirely by a licensed blood centre. Volunteers help with registration queues and water points. Whether someone can donate is decided only by the centre\'s clinicians.',
    objective: 'Support a safe, well-organised camp. Donors are screened by the centre on the day.', area: 'Karve Road, Pune', distanceKm: 2.2,
    timeline: 'Saturday 24 Oct 2026, 9 AM – 2 PM', commitment: '4 hours, one day', skillsNeeded: ['crowd support', 'registration'], interests: ['Health awareness', 'Community service'],
    roles: [{ id: 'r-reg', title: 'Registration and queue helper', slots: 10, filled: 4, training: 'Centre briefing on the day', risk: 'medium' }],
    budget: [], status: 'active', externalBooking: true,
    statusHistory: [{ at: '2026-09-15', status: 'active', note: 'Licence re-verified.', by: 'Moderator Kavya' }],
    updates: [], fictional: true,
  },
  {
    id: 'c-river', title: 'Riverbank Saturday Clean-up', category: 'Environment', orgId: 'o-green', story: 'Neighbours gather along the Mulamutha riverbank with gloves and bags, then sort what is recyclable. Tea is shared afterwards.',
    objective: 'Clear and sort waste along one kilometre of riverbank each month.', area: 'Baner, Pune', distanceKm: 6.8, timeline: 'Every 2nd Saturday', commitment: '2 hours, monthly',
    skillsNeeded: [], interests: ['Environment', 'Community service'], roles: [{ id: 'r-clean', title: 'Clean-up volunteer', slots: 40, filled: 22, risk: 'low' }],
    budget: [{ label: 'Gloves and bags', planned: 2500 }, { label: 'Tea', planned: 800 }], goal: 3300, status: 'active',
    statusHistory: [{ at: '2026-08-12', status: 'active', note: 'Campaign opened.', by: 'Moderator Kavya' }],
    updates: [], fictional: true,
  },
];

export const LEDGER: LedgerEntry[] = [
  { id: 'l-1', campaignId: 'c-lamps', date: '2026-09-02', kind: 'in', amount: 25000, category: 'Donations', purpose: 'Donations received (19 donors, some anonymous)', receipt: 'verified', human: 'reviewed', redacted: true },
  { id: 'l-2', campaignId: 'c-lamps', date: '2026-09-12', kind: 'out', amount: 7800, category: 'Lighting', purpose: 'Eight LED lamps and cabling', vendor: 'Shree Electricals', receipt: 'verified', human: 'reviewed', redacted: true },
  { id: 'l-3', campaignId: 'c-lamps', date: '2026-09-22', kind: 'out', amount: 4150, category: 'Notebooks and stationery', purpose: '100 notebooks, pencils, chalk', vendor: 'Gupta Stationers', receipt: 'verified', human: 'reviewed', redacted: true },
  { id: 'l-4', campaignId: 'c-lamps', date: '2026-09-23', kind: 'out', amount: 4150, category: 'Notebooks and stationery', purpose: 'Notebooks and stationery (second entry)', vendor: 'Gupta Stationers', receipt: 'duplicate', human: 'pending', redacted: true, note: 'Same vendor, date within one day and identical amount as the previous entry. May be a genuine second purchase.' },
  { id: 'l-5', campaignId: 'c-lamps', date: '2026-09-27', kind: 'out', amount: 3000, category: 'Hall contribution', purpose: 'Projector rental for demo evening', vendor: 'Pune AV Hire', receipt: 'pending', human: 'pending', redacted: true },
  { id: 'l-6', campaignId: 'c-asha', date: '2026-08-25', kind: 'in', amount: 5500, category: 'Donations', purpose: 'Donations received', receipt: 'verified', human: 'reviewed', redacted: true },
  { id: 'l-7', campaignId: 'c-asha', date: '2026-09-03', kind: 'out', amount: 3900, category: 'Printing leaflets', purpose: '2,000 two-sided leaflets, Hindi and Marathi', vendor: 'Om Print House', receipt: 'verified', human: 'reviewed', redacted: true },
  { id: 'l-8', campaignId: 'c-asha', date: '2026-09-20', kind: 'out', amount: 1200, category: 'Tea and water for walkers', purpose: 'Tea, water, paper cups for three walks', vendor: 'Local tea stall', receipt: 'corrected', human: 'reviewed', redacted: true, note: 'Original entry said Rs 1,500. Corrected to Rs 1,200 after the vendor re-issued the bill. History preserved.' },
  { id: 'l-9', campaignId: 'c-river', date: '2026-09-10', kind: 'in', amount: 3300, category: 'Donations', purpose: 'Donations received', receipt: 'verified', human: 'reviewed', redacted: true },
  { id: 'l-10', campaignId: 'c-river', date: '2026-09-13', kind: 'out', amount: 2400, category: 'Gloves and bags', purpose: '60 pairs of gloves, 200 bags', vendor: 'Hardware Mart', receipt: 'verified', human: 'reviewed', redacted: true },
];

export const REQUESTS: HelpRequest[] = [
  {
    id: 'h-sunita', requesterId: 'p-sunita', originalText: 'Mujhe bijli ke bill ka message samajh nahi aa raha, koi dhire dhire samjha de.',
    title: 'Understanding an electricity bill message', story: 'Sunita-ji received a digital notice about her electricity bill and would like someone to read it with her, slowly, and explain what it asks of her.',
    category: 'forms', outcome: 'Understand the notice and know what, if anything, to do next.', language: 'Hindi', mode: 'in-person', area: 'Warje, Pune (approximate)',
    days: ['weekdays', 'saturday'], whenLabel: 'Weekday afternoons or Saturday', minutes: 45, accessibility: ['Large print', 'Speak slowly'], skillsNeeded: ['digital literacy'],
    offer: 'Stories from forty years of teaching, and tea.', visibility: 'circle', risk: 'medium', riskReasons: ['In-person at a private home is medium risk'],
    status: 'open', boundaries: ['No money or bank details are handled', 'Anchor Lata Tai will be present'], distanceKm: 3.8, urgency: 'soon', createdAt: '2026-10-03T09:00:00.000Z',
  },
  {
    id: 'h-neha', requesterId: 'p-neha', originalText: 'I would like feedback on my resume before I apply for my first job.',
    title: 'Resume review for a first job', story: 'Neha is applying for her first jobs and wants honest, kind feedback on her one-page resume.',
    category: 'remote', outcome: 'A resume she feels confident sending.', language: 'English', mode: 'remote', area: 'Remote',
    days: ['remote', 'saturday', 'weekends'], whenLabel: 'Any evening this week', minutes: 30, accessibility: [], skillsNeeded: ['resume review'],
    visibility: 'public', risk: 'low', riskReasons: [], status: 'open', boundaries: ['Chat only; no personal documents beyond the resume'], distanceKm: 0, urgency: 'normal', createdAt: '2026-10-04T12:00:00.000Z',
  },
  {
    id: 'h-ishaan', requesterId: 'p-ishaan', originalText: 'Mujhe interview ke liye English bolne ki practice karni hai.',
    title: 'Spoken English practice before interviews', story: 'Ishaan reads English well but would like a patient partner for relaxed conversation practice.',
    category: 'learning', outcome: 'Feel more at ease speaking English in an interview.', language: 'Hindi', mode: 'remote', area: 'Remote',
    days: ['weekends', 'remote'], whenLabel: 'Weekend mornings', minutes: 30, accessibility: ['Speak slowly'], skillsNeeded: ['spoken english practice'],
    offer: 'Chess games, happy to teach.', visibility: 'circle', risk: 'low', riskReasons: [], status: 'open', boundaries: ['Voice or video call inside the app only'], distanceKm: 0, urgency: 'low', createdAt: '2026-10-05T07:00:00.000Z',
  },
];

export const ITEMS: ItemListing[] = [
  { id: 'i-cycle', donorId: 'p-rohan', title: 'Hero Sprint cycle, 24 inch', category: 'Cycles', description: 'Used for two years. Brakes feel soft on the rear wheel.', condition: 'Good', conditionConfirmed: false, age: '2 years', quantity: 1, area: 'Karve Nagar, Pune (approximate)', pickup: 'drop-point', availability: 'Weekends', audience: 'individual', status: 'available', emoji: '🚲', createdAt: '2026-10-02T10:00:00.000Z' },
  { id: 'i-sci9', donorId: 'p-meera', title: 'Class 9 Science and Maths books', category: 'School books', description: 'Complete set, minimal highlighting.', condition: 'Good', conditionConfirmed: true, age: '1 year', quantity: 6, area: 'Kothrud, Pune (approximate)', pickup: 'drop-point', availability: 'Evenings', audience: 'organization', status: 'available', emoji: '📚', createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'i-bags', donorId: 'p-rohan', title: 'School bags (4)', category: 'School bags', description: 'Washed. Zips working.', condition: 'Like new', conditionConfirmed: true, age: '6 months', quantity: 4, area: 'Karve Nagar, Pune (approximate)', pickup: 'partner', availability: 'Weekdays', audience: 'organization', status: 'available', emoji: '🎒', createdAt: '2026-09-30T10:00:00.000Z' },
];

export const NEEDS: ItemNeed[] = [
  { id: 'n-books', requesterLabel: 'Verified student, Class 10 (name withheld)', verified: true, org: false, category: 'School books', text: 'Looking for Class 10 Maths, Science and Social Science textbooks (Maharashtra board).', area: 'Kothrud, Pune', distanceKm: 1.6, keywords: ['class 10', 'maths', 'science', 'textbook', 'books', 'school books'] },
  { id: 'n-library', requesterLabel: 'Savitri Community Library (verified)', verified: true, org: true, category: 'School books', text: 'Our evening study room needs Class 10 revision books for 20 students.', area: 'Warje, Pune', distanceKm: 3.1, keywords: ['class 10', 'books', 'school books', 'revision'] },
  { id: 'n-stationery', requesterLabel: 'Z.P. Primary School, Mulshi (verified)', verified: true, org: true, category: 'Stationery', text: 'Notebooks, pencils and geometry boxes for 60 children.', area: 'Mulshi', distanceKm: 18, keywords: ['stationery', 'notebook', 'pencil', 'pens', 'geometry'] },
  { id: 'n-cycle', requesterLabel: 'Verified student, college commuter', verified: true, org: false, category: 'Cycles', text: 'A cycle to travel 5 km to college each day.', area: 'Karve Nagar, Pune', distanceKm: 1.2, keywords: ['cycle', 'bicycle'] },
];

export const PASSAGES: Passage[] = [
  {
    id: 'ps-1', work: 'Karma-Yoga', chapter: 'Attitude toward giving', location: 'Complete Works, Vol. 1 (exact page to be verified)',
    text: 'Do not stand on a high pedestal and take five cents in your hand and say, "Here, my poor man", but be grateful that the poor man is there, so that by making a gift to him you are able to help yourself. It is not the receiver that is blessed, but it is the giver.',
    kind: 'direct-quote', tags: ['humility', 'giving', 'service', 'pride', 'gratitude', 'serve'], editorialStatus: 'demo-pending-verification',
  },
  {
    id: 'ps-2', work: 'Karma-Yoga', chapter: 'Non-attachment in work', location: 'Complete Works, Vol. 1 (summary, page to be verified)',
    text: 'Swami Vivekananda taught that we have the right to the work itself, not to its results. Give your full attention to what is in front of you, and let the outcome be what it will.',
    kind: 'paraphrase', tags: ['unmotivated', 'results', 'attachment', 'effort', 'work', 'failure', 'tired', 'unmotivated', 'doubt'], editorialStatus: 'demo-pending-verification',
  },
  {
    id: 'ps-3', work: 'Katha Upanishad, as used by Swami Vivekananda', chapter: 'Lectures from Colombo to Almora', location: 'Widely cited call to action (exact lecture to be verified)',
    text: 'Arise, awake, and stop not till the goal is reached.',
    kind: 'direct-quote', tags: ['unmotivated', 'courage', 'start', 'begin', 'energy', 'stuck', 'lazy', 'tired'], editorialStatus: 'demo-pending-verification',
  },
  {
    id: 'ps-4', work: 'Karma-Yoga', chapter: 'Service as worship', location: 'Complete Works, Vol. 1 (summary, page to be verified)',
    text: 'In paraphrase: Vivekananda encouraged seeing the person in front of us as someone to be served with respect, not pitied, and as someone who gives us the chance to grow.',
    kind: 'paraphrase', tags: ['service', 'respect', 'volunteer', 'dignity', 'pity', 'help'], editorialStatus: 'demo-pending-verification',
  },
  {
    id: 'ps-5', work: 'Letters and talks (compiled)', chapter: 'On living for others', location: 'Frequently cited line, source to be verified before launch',
    text: 'They alone live who live for others; the rest are more dead than alive.',
    kind: 'direct-quote', tags: ['purpose', 'meaning', 'lonely', 'others', 'community'], editorialStatus: 'demo-pending-verification',
  },
];

export const REFLECTIONS: Reflection[] = [
  { id: 'rf-1', personId: 'p-aarav', at: '2026-09-14T18:00:00.000Z', taught: 'Neha showed me that asking one clear question beats giving five tips.', listenedWell: 'I let her finish before suggesting changes.', assumedQuickly: 'I assumed she wanted a design overhaul.', nextTime: 'Ask what she is most worried about first.', qualities: ['Listening', 'Patience'] },
  { id: 'rf-2', personId: 'p-aarav', at: '2026-09-21T18:30:00.000Z', taught: 'A student can understand algebra and still be afraid of the exam. Both need care.', listenedWell: 'I noticed her hesitation and slowed down.', assumedQuickly: 'I thought silence meant understanding.', nextTime: 'Check understanding with a small example.', qualities: ['Patience', 'Humility'] },
  { id: 'rf-3', personId: 'p-aarav', at: '2026-09-29T17:15:00.000Z', taught: 'Showing up on time matters more than I thought.', listenedWell: 'I kept the phone away.', assumedQuickly: 'I assumed the room would be set up.', nextTime: 'Arrive ten minutes early.', qualities: ['Steadiness', 'Humility'] },
];

export const COMMITMENTS: Commitment[] = [
  { id: 'cm-1', personId: 'p-aarav', text: 'Join an evening session at Evening Learning Lamps', at: '2026-10-01T09:00:00.000Z', done: false },
  { id: 'cm-2', personId: 'p-aarav', text: 'Complete the child-safeguarding orientation', at: '2026-10-02T09:00:00.000Z', done: false },
];

export const PRASAD: Prasad[] = [
  { id: 'pr-1', toId: 'p-aarav', fromLabel: 'A past act of service', kind: 'voice', text: 'Voice note (placeholder, 0:24). Transcript: "I passed my practical paper. You were patient when I forgot things. Thank you for not making me feel small."', at: '2026-10-04T08:00:00.000Z', opened: false },
];

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'nt-1', toId: 'p-aarav', at: '2026-10-05T16:00:00.000Z', title: 'A private Prasad has arrived', body: 'You received a private message from a past act of service.', read: false, href: '/prasad' },
  { id: 'nt-2', toId: 'p-aarav', at: '2026-10-05T10:00:00.000Z', title: 'A role needs a short orientation', body: 'The teaching role at Evening Learning Lamps asks for a 45-minute safeguarding orientation.', read: false, href: '/abhiyan/c-lamps' },
  { id: 'nt-3', toId: 'p-aarav', at: '2026-10-04T11:00:00.000Z', title: 'A book request near you may match', body: 'A verified student near Kothrud is looking for Class 10 books.', read: true, href: '/daan' },
];

export const MOD_ITEMS: ModItem[] = [
  { id: 'm-1', kind: 'bill', title: 'Possible duplicate ledger entry: Evening Learning Lamps', why: 'Two stationery entries from the same vendor within one day with the same amount (Rs 4,150).', confidence: 'medium', evidence: ['Ledger l-3 dated 22 Sep', 'Ledger l-4 dated 23 Sep', 'Both list Gupta Stationers'], recommended: 'Ask the organizer whether this was a second purchase and request the second bill.', status: 'open', link: { campaignId: 'c-lamps', ledgerId: 'l-4' } },
  { id: 'm-2', kind: 'message', title: 'Message asked to move chat off-platform', why: 'Phrase pattern: "give me your number so we can talk outside the app".', confidence: 'medium', evidence: ['One message, 2 minutes ago', 'No prior reports on this account'], recommended: 'Send a gentle reminder about masked contact; no restriction.', status: 'open' },
  { id: 'm-3', kind: 'request', title: 'High-risk request needs organization approval', why: 'Request mentions tutoring a child at a private home.', confidence: 'high', evidence: ['Keywords: child, at home', 'No verified organization linked'], recommended: 'Route to a verified organization with a trained role, or decline.', status: 'open' },
  { id: 'm-4', kind: 'profile', title: 'New Sevak profile pending review', why: 'Orientation completed, identity check pending.', confidence: 'low', evidence: ['Phone verified', 'College affiliation verified'], recommended: 'Approve for low-risk work only until identity result arrives.', status: 'open' },
  { id: 'm-5', kind: 'organization', title: 'Organization annual statement pending', why: 'Shiksha Setu Collective has one dossier item pending.', confidence: 'low', evidence: ['Annual financial statement not uploaded'], recommended: 'Send a reminder with a 14-day window; do not pause.', status: 'open' },
  { id: 'm-6', kind: 'consent', title: 'Photo published without separate consent flag', why: 'An impact update has a photograph but no consent confirmation.', confidence: 'high', evidence: ['Update dated 2 Oct', 'consentConfirmed = false'], recommended: 'Hide the photo until consent is recorded.', status: 'open' },
  { id: 'm-7', kind: 'appeal', title: 'Appeal against a paused listing', why: 'A donor says a cycle listing was paused by mistake.', confidence: 'medium', evidence: ['Listing flagged for "recalled product" keyword'], recommended: 'Human review of listing text, then restore if safe.', status: 'open' },
  { id: 'm-8', kind: 'crisis', title: 'Seva Guide routed a user to crisis support', why: 'Risk phrases were detected; the user was shown audited helplines. No chat content is stored here.', confidence: 'high', evidence: ['Safety routing displayed', 'No automatic contact with authorities was made'], recommended: 'No action on the person. Review routing wording quarterly.', status: 'open' },
];

export const AUDIT: AuditEvent[] = [
  { id: 'a-1', at: '2026-09-28T10:00:00.000Z', actor: 'Moderator Kavya', action: 'Verified organization Mulamutha Riverbank Friends' },
  { id: 'a-2', at: '2026-09-29T10:00:00.000Z', actor: 'Moderator Kavya', action: 'Approved correction of ledger entry l-8 (Rs 1,500 to Rs 1,200)' },
];

export const DEMO_ACCOUNTS = [
  { personId: 'p-aarav', label: 'Aarav, a Sevak (also Sahabhagi)', hint: 'Offers help, sees Seva Journal and Prasad' },
  { personId: 'p-meera', label: 'Meera, a student Sahabhagi', hint: 'Asks for algebra help (Journey A)' },
  { personId: 'p-kavya', label: 'Kavya, Moderator', hint: 'Reviews the queue (Journey B)' },
];

export const SAFE_PLACES = ['Campus library entrance', 'Community hall (daytime)', 'Public cafe near campus', 'Online call inside SevaSetu'];
export const INTERESTS = ['Education', 'Digital assistance', 'Elder support', 'Health awareness', 'Environment', 'Accessibility', 'Community service', 'Material reuse'];
