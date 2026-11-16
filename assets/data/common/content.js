/* ============================================================
   Shared (all states): quiz, roadmap, profile-building guide, resources
   ============================================================ */

const DATA_UPDATED = "November 2026";
const SITE_REPO = "https://github.com/openpathfolio/pathfolio";

const SUBJECTS = {
  math: "Math", physics: "Physics", chem: "Chemistry", bio: "Biology", cs: "Computer Science",
  engr: "Engineering / Robotics / Shop", english: "English / Writing", history: "History / Government",
  econ: "Economics / Business", art: "Art / Design", music: "Music / Theatre", lang: "World Languages",
  psych: "Psychology / Social Studies", ag: "Agriculture / Environmental Sci.", health: "Health Science", media: "Journalism / Media / Film"
};

const VALUES = {
  money: "High income", help: "Helping people directly", create: "Creativity & self-expression",
  stable: "Job security", tech: "Working with technology", hands: "Hands-on, building things",
  lead: "Leading & being my own boss", discover: "Discovering new knowledge", balance: "Work-life balance",
  impact: "Making society better", outdoors: "Working outdoors / not at a desk"
};

const RIASEC = {
  R: { name: "Realistic (Doer)", desc: "Hands-on, practical; likes tools, machines, building, outdoors." },
  I: { name: "Investigative (Thinker)", desc: "Curious and analytical; likes science, math, research, solving puzzles." },
  A: { name: "Artistic (Creator)", desc: "Imaginative and expressive; likes art, design, music, writing." },
  S: { name: "Social (Helper)", desc: "Caring and cooperative; likes teaching, helping, healing, counseling." },
  E: { name: "Enterprising (Persuader)", desc: "Confident leader; likes starting things, persuading, managing, selling." },
  C: { name: "Conventional (Organizer)", desc: "Detail-oriented; likes order, data, systems, accuracy." }
};

/* Interest statements: rated 0 (not me) / 1 (maybe) / 2 (definitely me).
   Based on the public Holland RIASEC model (as used by O*NET's Interest Profiler). */
const QUIZ_ITEMS = [
  { t: "Build, fix or take apart things: bikes, electronics, engines, furniture", k: "R" },
  { t: "Work outdoors with plants, animals, or the land", k: "R" },
  { t: "Operate tools, machines, vehicles or drones", k: "R" },
  { t: "Do experiments to figure out how something works", k: "I" },
  { t: "Solve challenging math, logic or coding puzzles", k: "I" },
  { t: "Research a question deeply, e.g. why a disease spreads or how stars form", k: "I" },
  { t: "Draw, design, or create digital art, videos or games", k: "A" },
  { t: "Write stories, poems, scripts, songs or articles", k: "A" },
  { t: "Perform music, theatre or dance", k: "A" },
  { t: "Teach, tutor or coach someone younger", k: "S" },
  { t: "Help people who are sick, upset or struggling", k: "S" },
  { t: "Volunteer or organize community service", k: "S" },
  { t: "Lead a team, run a club or start a business", k: "E" },
  { t: "Persuade people, debate, or pitch an idea", k: "E" },
  { t: "Take risks and make big decisions for big results", k: "E" },
  { t: "Organize files, data or schedules so everything is in order", k: "C" },
  { t: "Track money, budgets or records carefully", k: "C" },
  { t: "Follow clear procedures to get accurate results", k: "C" }
];

/* Roadmap template. Offsets are relative to the graduation year G.
   start/end: [yearOffset, monthIndex 0-11] */
const ROADMAP_TEMPLATE = [
  { label: "9th grade", start: [-4, 7], end: [-3, 4], items: [
    "Take the most challenging courses you can succeed in. Every grade from 9th on counts toward class rank.",
    "Try 2–3 clubs or activities connected to possible interests (CTE, UIL, HOSA, robotics, debate, FFA, band, etc.).",
    "Take the free Career Quiz here and talk about the results as a family." ] },
  { label: "Summer after 9th", start: [-3, 5], end: [-3, 6], items: [
    "Explore: a camp, volunteering, a free online course (Khan Academy, CS50, Coursera), or a part-time job.",
    "Read widely and start a simple activity log (dates, hours, what you did)." ] },
  { label: "10th grade", start: [-3, 7], end: [-2, 4], items: [
    "Narrow interests to 1–2 career clusters. Go deeper in one activity and aim for responsibility or leadership.",
    "Take the PSAT 10 or PSAT/NMSQT for practice.",
    "Earn a first industry certification through CTE if available (often free in public high schools).",
    "Apply to selective summer programs (deadlines are often Jan–Mar). See the Opportunities page." ] },
  { label: "Summer after 10th", start: [-2, 5], end: [-2, 6], items: [
    "Do something substantial: a summer program, job, volunteering, or a self-started project with real output.",
    "Start a portfolio (GitHub, website, art portfolio, project photos)." ] },
  { label: "11th grade: fall", start: [-2, 7], end: [-2, 11], items: [
    "Take the PSAT/NMSQT in October. This is the National Merit qualifying test.",
    "Ask the counselor for the exact class-rank percentile and GPA. Some states (e.g., Texas) admit by class rank.",
    "Research universities and majors on this site. Attend college fairs and virtual info sessions.",
    "Plan senior-year courses that match the intended major." ] },
  { label: "11th grade: spring", start: [-1, 0], end: [-1, 4], items: [
    "Take the SAT or ACT (many selective universities require or recommend scores again). Plan a second attempt.",
    "Apply for summer programs, internships and research positions (Jan–Mar).",
    "Visit campuses during spring break.",
    "Ask two teachers for recommendation letters before summer, and give them a brag sheet.",
    "AP / IB exams in May." ] },
  { label: "Summer before 12th", start: [-1, 5], end: [-1, 6], items: [
    "Complete a meaningful internship, research project, job or program, and document the results.",
    "Draft essays: Common App (or state application) personal essay and school-specific supplements.",
    "Build a balanced list of 6–12 schools (reach / target / likely) and run each Net Price Calculator.",
    "Write an activities list and an expanded resume." ] },
  { label: "12th grade: fall", start: [-1, 7], end: [-1, 11], items: [
    "Common App and most state applications open around Aug 1. Submit early: many universities review on a rolling basis.",
    "Typical deadlines: Early Action/Decision Nov 1–15, Regular Jan 1–15. Public universities vary (check each school).",
    "FAFSA opens ~Oct 1. CSS Profile is needed for many private colleges.",
    "Apply for honors colleges and university scholarships (often earlier deadlines).",
    "Last SAT/ACT attempt by October." ] },
  { label: "12th grade: spring", start: [0, 0], end: [0, 4], items: [
    "Meet your state's financial-aid priority deadline and send any missing documents.",
    "Apply for local scholarships (community foundations, employers, churches, civic clubs).",
    "Compare financial-aid offers on total 4-year net cost, not sticker price.",
    "Decide by May 1, submit the deposit, and celebrate! 🎓" ] }
];

/* Profile-building guide ("Build Your Application") */
const PILLARS = [
  { icon: "📚", title: "Rigorous coursework", body: "Grades (and in some states, class rank) in challenging courses (AP, IB, dual credit) are the #1 factor at almost every university. Take advanced courses that match the intended major, e.g. calculus and physics for engineering, AP Bio and Chem for health.",
    tips: ["In some states (e.g., Texas), class rank drives automatic admission. Protect your GPA in core courses.", "Dual-credit courses can earn real college credit.", "A gap in key courses (e.g., no calculus for engineering) is a red flag."] },
  { icon: "🏅", title: "Industry certifications", body: "Public high schools in many states offer industry-based certifications through CTE pathways, often free: CNA, Pharmacy Tech, CompTIA, Adobe, Autodesk, AWS, Microsoft Office, Certified Vet Assistant, OSHA, welding and more.",
    tips: ["Pick certifications that support your story. Quality beats quantity.", "List them in the 'Honors/Certifications' section of applications.", "Many also qualify you for paid part-time jobs while in college."] },
  { icon: "🛠️", title: "Projects", body: "A self-driven project shows initiative better than almost anything: an app, robot, film, business, research study, community program or art portfolio.",
    tips: ["Solve a real problem for real people, and measure the result (users, dollars, hours, people served).", "Document it with photos, video, GitHub, a website or a write-up.", "Use the project as the story in your 'Why this major?' essay."] },
  { icon: "💼", title: "Internships & work", body: "Internships, shadowing, research assistant roles and regular jobs all count. Admissions officers value responsibility, and a part-time job is not a weakness.",
    tips: ["Ask your network: family friends, parents' coworkers, teachers, alumni.", "Search university lab pages, city youth programs, hospital volunteer programs, NASA OSTEM.", "Paid jobs and family responsibilities belong on the activity list."] },
  { icon: "🔬", title: "Research & publications", body: "Real research with a mentor (school science fair, university lab, or independent) can lead to science-fair awards and publication in legitimate student journals.",
    tips: ["Start with your school or regional science fair, which leads to the state fair and Regeneron ISEF.", "Publish in reputable student journals (JEI, NHSJS, Concord Review, etc.), not pay-to-publish outlets.", "Human-subject research (surveys, experiments on people) needs approval and consent under fair rules."] },
  { icon: "🏆", title: "Competitions & leadership", body: "State academic leagues (e.g., Texas UIL), HOSA, DECA, FBLA, SkillsUSA, TSA, FFA, Science Olympiad, debate, robotics and more. Depth and progression (member → officer → state) matter.",
    tips: ["Leadership means impact, not just a title: what changed because of you?", "State or national results are strong, but steady growth is valued too.", "Choose 2–4 core activities rather than 12 shallow ones."] },
  { icon: "🤝", title: "Service & community", body: "Sustained service connected to your interests (tutoring, health volunteering, environmental clean-ups, translating for families) shows character and purpose.",
    tips: ["Long-term commitment beats one-time hours.", "Connect service to your intended career where possible.", "Bilingual service is valuable. Many states offer a Seal of Biliteracy on the diploma."] }
];

const RED_FLAGS = [
  "Expensive \"prestigious\" summer programs that admit anyone who pays. They carry little admissions weight.",
  "Pay-to-publish journals or \"research mentorship\" companies charging thousands for a guaranteed paper.",
  "Vanity awards and directories (\"Who's Who\"-style) that you pay to be listed in.",
  "Long activity lists with no depth: colleges prefer real commitment and impact.",
  "Essays written or heavily edited by adults (or AI). Admissions readers notice, and authenticity matters."
];

const COLD_EMAIL = `Subject: High school student interested in your [topic] research

Dear Dr. [Last name],

My name is [Name], a [grade] student at [High School] in [City], [State]. I read your paper/lab page on [specific project], and I was especially interested in [one specific detail and why].

I have [relevant skills/courses: e.g., AP Biology, Python, CAD] and recently [one project you did]. I would be grateful for any opportunity to help in your lab this summer: data entry, literature review, or assisting graduate students. I can commit [X] hours per week from [dates].

I've attached a one-page resume. Thank you for your time and consideration.

Sincerely,
[Name] · [email] · [phone]`;


const PARENT_TIPS = [
  { icon: "🗣️", title: "Conversation starters", items: ["\"What do you lose track of time doing?\"", "\"What problem in the world bugs you most?\"", "\"Which class would you take even if it weren't required?\"", "\"What does a good workday look like to you at 30?\""], note: "Listen more than advise. Interests change. Revisit every few months." },
  { icon: "🧭", title: "Exploring is the goal", items: ["It's normal to be undecided in 10th–11th grade. Many students change majors in college.", "Use the quiz as a conversation starter, not a verdict.", "Try careers cheaply: job shadowing, free online courses, a summer program, volunteering.", "Choose universities that make switching majors realistic."] },
  { icon: "💰", title: "Money matters", items: ["Run every Net Price Calculator. Sticker price ≠ real price.", "Many public universities have free-tuition programs by family income.", "File FAFSA early (Oct). Add the CSS Profile for many privates.", "A great likely school with merit aid can beat a reach school with debt."] },
  { icon: "✅", title: "Helpful parent moves", items: ["Arrange job-shadowing with people in your network.", "Plan campus visits, including nearby schools you haven't considered.", "Help with calendars and deadlines, not with writing essays.", "Celebrate effort and curiosity, not only results."] },
  { icon: "⚠️", title: "Common pitfalls", items: ["Applying only to the most competitive majors (e.g., CS, nursing, engineering at flagship schools) with no backups.", "Choosing a career only for salary or prestige.", "Over-scheduling and burnout.", "Paying for pricey programs that promise admission advantages."] },
  { icon: "🤖", title: "Careers in the age of AI", items: ["AI is changing every field. Encourage AI fluency in any major.", "Human-centered skills (communication, empathy, leadership) and hands-on, physical work are hard to automate.", "Combining fields is powerful: AI + health, robotics + agriculture, data + business.", "Skilled trades and healthcare remain in very high demand nationwide."] },
  { icon: "❤️", title: "Well-being", items: ["Protect sleep, family time and hobbies.", "Watch for stress and anxiety. Talk to the school counselor early.", "There are many good paths. No single college decides a life."] }
];

/* Resources */
const yt = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);

const RESOURCES = {
  explore: [
    { title: "Career Explorations (day-in-the-life)", desc: "Real people describing their jobs.", url: yt("day in the life career explained high school students") },
    { title: "CareerOneStop videos (US Dept. of Labor)", desc: "Hundreds of short official career videos.", url: "https://www.careeronestop.org/Videos/CareerVideos/career-videos.aspx" },
    { title: "Crash Course: Study Skills & careers", desc: "Fun, fast explainers.", url: "https://www.youtube.com/@crashcourse" },
    { title: "Khan Academy", desc: "Free courses + official SAT practice.", url: "https://www.youtube.com/@khanacademy" },
    { title: "Harvard CS50", desc: "Famous free intro to computer science.", url: "https://www.youtube.com/@cs50" },
    { title: "MIT OpenCourseWare", desc: "Real university lectures in every subject.", url: "https://www.youtube.com/@mitocw" },
    { title: "How to choose a college major", desc: "Advice for undecided students.", url: yt("how to choose a college major undecided student advice") },
    { title: "College Essay Guy", desc: "Excellent free essay guidance.", url: yt("College Essay Guy personal statement") }
  ],
  parents: [
    { title: "Helping your teen choose a career", desc: "Support without pressure.", url: yt("how parents can help teen choose a career path") },
    { title: "How college admissions really work", desc: "Holistic review explained.", url: yt("how college admissions holistic review works explained") },
    { title: "FAFSA & CSS Profile walkthrough", desc: "Step-by-step financial-aid forms.", url: yt("FAFSA CSS profile walkthrough parents") },
    { title: "Net price vs. sticker price", desc: "Understanding real college cost.", url: yt("college net price calculator explained parents") },
    { title: "Is college worth it? Trades vs. degrees", desc: "Comparing paths honestly.", url: yt("skilled trades vs college degree pros cons") },
    { title: "Future of jobs and AI", desc: "What parents should know.", url: yt("future jobs AI careers advice for parents students") }
  ],
  official: [
    { title: "Common App", url: "https://www.commonapp.org" },
    { title: "FAFSA (studentaid.gov)", url: "https://studentaid.gov" },
    { title: "College Board (SAT, AP, CSS)", url: "https://www.collegeboard.org" },
    { title: "ACT", url: "https://www.act.org" },
    { title: "BLS Occupational Outlook Handbook", url: "https://www.bls.gov/ooh/" },
    { title: "O*NET Interest Profiler (My Next Move)", url: "https://www.mynextmove.org/explore/ip" },
    { title: "College Scorecard (costs & earnings)", url: "https://collegescorecard.ed.gov" }
  ],
  publish: [
    { title: "Journal of Emerging Investigators (JEI)", url: "https://emerginginvestigators.org" },
    { title: "National High School Journal of Science", url: "https://nhsjs.com" },
    { title: "Curieux Academic Journal", url: "https://www.curieuxacademicjournal.com" },
    { title: "The Concord Review (history)", url: "https://www.tcr.org" },
    { title: "John Locke Institute Essay Competition", url: "https://www.johnlockeinstitute.com/essay-competition" },
    { title: "Scholastic Art & Writing Awards", url: "https://www.artandwriting.org" },
    { title: "Regeneron ISEF / Society for Science", url: "https://www.societyforscience.org/isef/" },
    { title: "NYT Learning Network contests", url: "https://www.nytimes.com/section/learning" }
  ]
};
