/* ============================================================
   Texas universities
   ------------------------------------------------------------
   ALL figures are approximate. Verify on official pages, and refresh
   each August when new rankings and tuition are released.
   rankSort : numeric value used only for sorting (lower = higher ranked)
   rankLabel: what is displayed (≈ means approximate)
   tuition  : yearly tuition + required fees, Texas resident (private: same for all)
   coa      : rough total yearly cost incl. housing & food, before aid
   sel      : "highly" | "selective" | "moderate" | "accessible"
   autoPct  : Texas automatic-admission class-rank cutoff (public only)
   areas    : study-area keys (see AREAS below)
   ============================================================ */

registerState("TX", {
  name: "Texas",
  abbr: "TX",
  /* Shown in the "automatic admission check" on the home page */
  rankRules: [
    { label: "UT Austin", pct: 5, yes: "Automatic admission to the university (top 5%). Competitive majors (CS, engineering, business, nursing) are still reviewed holistically.", no: "Not automatic. Holistic review, so essays, activities, test scores and rigor matter a lot." },
    { label: "Texas A&M, UTD, UH, Texas Tech, UNT, UTSA and all other Texas public universities", pct: 10, yes: "Automatic admission (top 10%), provided Distinguished Level or SAT/ACT benchmarks are met. Major placement may still be competitive.", no: "Holistic review. Many still admit strong students outside the top 10%." },
    { label: "Universities with extra assured-admission tiers (e.g., top 25% + test scores)", pct: 25, yes: "Likely eligible for assured admission at several universities. Check each school's current rules.", no: "Standard holistic review. Strong grades in rigorous courses help." }
  ],
  essentials: [
    { t: "Top 10% automatic admission", d: "Students in the top 10% of their Texas high school class get automatic admission to any Texas public university. UT Austin limits it to the top 5% (Fall 2026+). Students must also complete the Distinguished Level of Achievement or meet SAT/ACT college-readiness benchmarks. Admission to a specific major is NOT guaranteed." },
    { t: "Endorsements & graduation plan", d: "Texas students choose an endorsement (STEM, Business & Industry, Public Services, Arts & Humanities, Multidisciplinary). The Distinguished Level (with Algebra II) is required for top-10% automatic admission." },
    { t: "ApplyTexas vs. Common App", d: "Texas public universities accept ApplyTexas; many also accept Common App. UT Austin and Texas A&M accept both. Private colleges like Rice, SMU and Baylor use Common App." },
    { t: "FAFSA/TASFA required to graduate", d: "Texas seniors must complete the FAFSA, the TASFA, or an opt-out form to graduate. File as early as possible after it opens (~Oct 1)." },
    { t: "Tuition freeze & aid promises", d: "Texas public tuition is frozen through 2026-27. Many universities cover tuition for lower- and middle-income families (UT Austin ≤ ~$100k, Rice ≤ ~$200k, plus UH, UTSA, A&M, Texas State, UTEP and others)." },
    { t: "Save on college", d: "Dual credit, OnRamps, AP/IB credit, the Texas Tuition Promise Fund (prepaid 529), TEXAS Grant, and the Hazlewood Act for veterans' families can cut costs dramatically." },
    { t: "National Merit", d: "The October PSAT/NMSQT in 11th grade determines National Merit. Several Texas universities (UTD, UH, Texas Tech, Texas A&M) offer large packages, sometimes full rides." },
    { t: "UIL & Texas-specific activities", d: "UIL Academics (CS, Science, Math, Journalism, Debate, Accounting and more), Texas Youth & Government, TXSEF, Texas FFA, HOSA and SkillsUSA are well known to Texas admissions offices." }
  ],
  /* Extra roadmap items, keyed by roadmap phase label */
  roadmapExtras: {
    "9th grade": ["Texas: choose a graduation endorsement (STEM, Business & Industry, Public Services, Arts & Humanities, Multidisciplinary) and aim for the Distinguished Level of Achievement, which is needed for top-10% automatic admission."],
    "10th grade": ["Texas: advanced math/science students can apply to TAMS at UNT (complete 11th–12th grade as college students)."],
    "11th grade: fall": ["Texas: UT Austin auto-admit is top 5%; other Texas public universities are top 10%."],
    "12th grade: fall": ["Texas: ApplyTexas opens ~Aug 1. Typical deadlines: UT Austin Early Action ~Oct 15 / Regular ~Dec 1; Texas A&M ~Dec 1; Rice Early Decision ~Nov 1 (verify each).", "Texas: FAFSA, TASFA or an opt-out form is required to graduate."],
    "12th grade: spring": ["Texas: state-aid priority deadline is ~Jan 15 (check THECB)."]
  },
  officialLinks: [
    { title: "ApplyTexas", url: "https://www.applytexas.org" },
    { title: "My Texas Future (THECB)", url: "https://www.mytexasfuture.org" },
    { title: "Texas Higher Ed Coordinating Board", url: "https://www.highered.texas.gov" },
    { title: "Texas Education Agency: CTE & endorsements", url: "https://tea.texas.gov/academics/college-career-and-military-prep" },
    { title: "College for All Texans (TASFA, TEXAS Grant)", url: "https://www.collegeforalltexans.com" },
    { title: "Texas Tuition Promise Fund", url: "https://www.texastuitionpromisefund.com" },
    { title: "US News: Best Colleges in Texas", url: "https://www.usnews.com/best-colleges/tx" },
    { title: "UIL Academics", url: "https://www.uiltexas.org/academics" },
    { title: "Texas Science & Engineering Fair", url: "https://txsef.org" }
  ],
  regions: ["Central Texas", "Dallas–Fort Worth", "Houston & Gulf Coast", "San Antonio & South Texas", "West Texas & El Paso", "East Texas", "Rio Grande Valley"],

  universities: [
  { id: "rice", name: "Rice University", city: "Houston", region: "Houston & Gulf Coast", type: "Private",
    rankSort: 17, rankLabel: "#17 National (US News 2026)", acceptance: "~8%", tuition: 71140, coa: 93000, sel: "highly", autoPct: null,
    areas: ["eng", "cs", "sci", "health", "business", "arch", "arts", "psych", "law"],
    notable: "Engineering, CS, natural sciences, Architecture, Shepherd School of Music; strong pre-med. Small classes and lots of undergrad research.",
    aid: "Rice Investment: free tuition for families earning up to ~$200k (2026); loan-free need-based aid.",
    links: { home: "https://www.rice.edu", admissions: "https://admission.rice.edu", aid: "https://financialaid.rice.edu" } },

  { id: "utaustin", name: "University of Texas at Austin", city: "Austin", region: "Central Texas", type: "Public",
    rankSort: 30, rankLabel: "#30 National, #8 public (US News 2026)", acceptance: "~27% overall; CS, engineering, business and nursing far lower", tuition: 12000, coa: 32000, sel: "highly", autoPct: 5,
    areas: ["eng", "cs", "business", "health", "nursing", "law", "psych", "education", "arts", "design", "media", "arch", "sci", "env"],
    notable: "Top-10 engineering, CS and business (McCombs) programs. Moody College of Communication, Architecture, Natural Sciences, Dell Medical School.",
    aid: "Texas Advance Commitment: tuition covered for Texas families with income up to ~$100k.",
    links: { home: "https://www.utexas.edu", admissions: "https://admissions.utexas.edu", aid: "https://finaid.utexas.edu" } },

  { id: "tamu", name: "Texas A&M University", city: "College Station", region: "Central Texas", type: "Public",
    rankSort: 51, rankLabel: "#51 National (US News 2026)", acceptance: "~63% overall; engineering and business lower", tuition: 13200, coa: 32000, sel: "selective", autoPct: 10,
    areas: ["eng", "cs", "business", "ag", "health", "nursing", "education", "arch", "sci", "env", "law", "psych", "media"],
    notable: "One of the largest engineering colleges in the US. Nationally top agriculture, veterinary medicine, Mays Business, Bush School of Government, Architecture.",
    aid: "Aggie Assurance for lower-income families; large National Merit awards.",
    links: { home: "https://www.tamu.edu", admissions: "https://admissions.tamu.edu", aid: "https://aggie.tamu.edu/financial-aid" } },

  { id: "smu", name: "Southern Methodist University", city: "Dallas", region: "Dallas–Fort Worth", type: "Private",
    rankSort: 91, rankLabel: "≈ top 100 National", acceptance: "~50%", tuition: 68000, coa: 90000, sel: "selective", autoPct: null,
    areas: ["business", "cs", "eng", "arts", "media", "law", "psych", "sci", "health"],
    notable: "Cox School of Business, Lyle Engineering, Meadows School of the Arts. Big merit scholarships.",
    aid: "Large merit awards; use the Net Price Calculator.",
    links: { home: "https://www.smu.edu", admissions: "https://www.smu.edu/admission", aid: "https://www.smu.edu/enrollmentservices/financialaid" } },

  { id: "tcu", name: "Texas Christian University", city: "Fort Worth", region: "Dallas–Fort Worth", type: "Private",
    rankSort: 98, rankLabel: "≈ top 100 National", acceptance: "~45–55%", tuition: 60000, coa: 80000, sel: "selective", autoPct: null,
    areas: ["business", "nursing", "media", "eng", "cs", "education", "health", "psych", "arts", "sci", "ag"],
    notable: "Neeley Business, Harris College of Nursing, Schieffer Journalism, Ranch Management program.",
    aid: "Merit scholarships; Net Price Calculator.",
    links: { home: "https://www.tcu.edu", admissions: "https://admissions.tcu.edu", aid: "https://financialaid.tcu.edu" } },

  { id: "trinity", name: "Trinity University", city: "San Antonio", region: "San Antonio & South Texas", type: "Private",
    rankSort: 100, rankLabel: "Top Regional University (West), US News", acceptance: "~30–35%", tuition: 54000, coa: 72000, sel: "selective", autoPct: null,
    areas: ["eng", "cs", "sci", "business", "health", "psych", "media", "education", "arts"],
    notable: "Small classes, ABET-accredited engineering science, CS, neuroscience, strong pre-med outcomes.",
    aid: "Generous merit and need-based aid.",
    links: { home: "https://www.trinity.edu", admissions: "https://www.trinity.edu/admissions", aid: "https://www.trinity.edu/admissions-aid/financial-aid" } },

  { id: "utd", name: "University of Texas at Dallas", city: "Richardson", region: "Dallas–Fort Worth", type: "Public",
    rankSort: 105, rankLabel: "≈ top 110 National", acceptance: "~65–85%", tuition: 15000, coa: 33000, sel: "moderate", autoPct: 10,
    areas: ["cs", "eng", "business", "sci", "psych", "design", "arts", "health"],
    notable: "Highly rated CS and engineering. ATEC (game design, animation), Jindal Business. Locked 4-year tuition.",
    aid: "Strong merit scholarships (Academic Excellence, National Merit).",
    links: { home: "https://www.utdallas.edu", admissions: "https://enroll.utdallas.edu", aid: "https://bursar.utdallas.edu/tuition/tuition-estimates/" } },

  { id: "baylor", name: "Baylor University", city: "Waco", region: "Central Texas", type: "Private",
    rankSort: 110, rankLabel: "≈ #100–115 National", acceptance: "~50–60%", tuition: 58000, coa: 78000, sel: "selective", autoPct: null,
    areas: ["health", "nursing", "business", "eng", "cs", "education", "media", "law", "sci", "arts", "psych", "aviation"],
    notable: "Strong pre-med/health sciences, Louise Herrington Nursing, Hankamer Business, Aviation Sciences.",
    aid: "Automatic academic merit scholarships based on scores and GPA.",
    links: { home: "https://www.baylor.edu", admissions: "https://www.baylor.edu/admissions", aid: "https://www.baylor.edu/sfs" } },

  { id: "uh", name: "University of Houston", city: "Houston", region: "Houston & Gulf Coast", type: "Public",
    rankSort: 130, rankLabel: "≈ #125–135 National", acceptance: "~70%", tuition: 12000, coa: 30000, sel: "moderate", autoPct: 10,
    areas: ["eng", "cs", "business", "health", "nursing", "arch", "arts", "law", "education", "sci", "media", "psych", "env", "design"],
    notable: "Bauer Business, Hines Architecture, Moores School of Music, Pharmacy, energy engineering, Honors College.",
    aid: "Cougar Promise for lower-income families; merit aid.",
    links: { home: "https://www.uh.edu", admissions: "https://www.uh.edu/admissions", aid: "https://www.uh.edu/financial" } },

  { id: "southwestern", name: "Southwestern University", city: "Georgetown", region: "Central Texas", type: "Private",
    rankSort: 140, rankLabel: "≈ top 100 National Liberal Arts", acceptance: "~50–60%", tuition: 54000, coa: 70000, sel: "moderate", autoPct: null,
    areas: ["sci", "cs", "business", "psych", "arts", "education", "law", "media"],
    notable: "Oldest university in Texas, 30 min from Austin. Small liberal-arts college with close faculty research.",
    aid: "Most students receive merit or need aid.",
    links: { home: "https://www.southwestern.edu", admissions: "https://www.southwestern.edu/admission", aid: "https://www.southwestern.edu/financial-aid" } },

  { id: "stedwards", name: "St. Edward's University", city: "Austin", region: "Central Texas", type: "Private",
    rankSort: 150, rankLabel: "≈ top 20 Regional (West)", acceptance: "~80–90%", tuition: 53000, coa: 70000, sel: "moderate", autoPct: null,
    areas: ["cs", "business", "psych", "media", "sci", "law", "arts", "education", "design"],
    notable: "Small Austin campus. Business, CS, behavioral sciences, global studies, internships in Austin.",
    aid: "Merit scholarships for most admits.",
    links: { home: "https://www.stedwards.edu", admissions: "https://www.stedwards.edu/admission", aid: "https://www.stedwards.edu/financial-aid" } },

  { id: "ttu", name: "Texas Tech University", city: "Lubbock", region: "West Texas & El Paso", type: "Public",
    rankSort: 210, rankLabel: "≈ #200–220 National", acceptance: "~70%", tuition: 12000, coa: 29000, sel: "moderate", autoPct: 10,
    areas: ["eng", "cs", "business", "ag", "arch", "education", "media", "health", "nursing", "arts", "design", "psych", "sci", "env"],
    notable: "Engineering, wind energy research, Architecture, Agriculture, Media & Communication. Health Sciences Center. Clark Scholars program.",
    aid: "Generous merit and National Merit aid; Red Raider Guarantee.",
    links: { home: "https://www.ttu.edu", admissions: "https://www.depts.ttu.edu/admissions", aid: "https://www.depts.ttu.edu/financialaid" } },

  { id: "unt", name: "University of North Texas", city: "Denton", region: "Dallas–Fort Worth", type: "Public",
    rankSort: 230, rankLabel: "≈ #200–250 National", acceptance: "~70–75%", tuition: 12000, coa: 29000, sel: "accessible", autoPct: 10,
    areas: ["arts", "media", "design", "eng", "cs", "business", "education", "psych", "sci", "env", "health", "aviation"],
    notable: "College of Music (internationally known), Mayborn School of Journalism, Visual Arts & Design. Home of TAMS (early-college for juniors and seniors).",
    aid: "Eagle Express Tuition Plan for lower-income families; merit aid.",
    links: { home: "https://www.unt.edu", admissions: "https://admissions.unt.edu", aid: "https://financialaid.unt.edu" } },

  { id: "uta", name: "University of Texas at Arlington", city: "Arlington", region: "Dallas–Fort Worth", type: "Public",
    rankSort: 240, rankLabel: "≈ #230–260 National", acceptance: "~85%", tuition: 11500, coa: 28000, sel: "accessible", autoPct: 10,
    areas: ["eng", "cs", "nursing", "business", "arch", "education", "sci", "psych", "media", "design"],
    notable: "One of the largest nursing programs in the US. Large engineering college, Architecture, research institute (UTARI).",
    aid: "Maverick Promise; merit scholarships.",
    links: { home: "https://www.uta.edu", admissions: "https://www.uta.edu/admissions", aid: "https://www.uta.edu/administration/fao" } },

  { id: "utsa", name: "University of Texas at San Antonio", city: "San Antonio", region: "San Antonio & South Texas", type: "Public",
    rankSort: 300, rankLabel: "≈ #280–320 National", acceptance: "~85–90%", tuition: 10500, coa: 27000, sel: "accessible", autoPct: 10,
    areas: ["cs", "eng", "business", "arch", "health", "education", "sci", "psych", "media", "env"],
    notable: "Nationally known cybersecurity program, B.S. in Artificial Intelligence, School of Data Science, Architecture, Kinesiology.",
    aid: "Bold Promise for lower-income families.",
    links: { home: "https://www.utsa.edu", admissions: "https://future.utsa.edu", aid: "https://www.utsa.edu/financialaid" } },

  { id: "txstate", name: "Texas State University", city: "San Marcos & Round Rock", region: "Central Texas", type: "Public",
    rankSort: 320, rankLabel: "≈ #300+ National", acceptance: "~85–90%", tuition: 12000, coa: 28000, sel: "accessible", autoPct: 10,
    areas: ["education", "health", "nursing", "business", "media", "eng", "cs", "ag", "env", "arts", "design", "psych", "sci"],
    notable: "Round Rock health campus (nursing, physical therapy, respiratory care). Strong education, geography, Ingram Engineering.",
    aid: "Bobcat Promise.",
    links: { home: "https://www.txst.edu", admissions: "https://www.txst.edu/admissions", aid: "https://www.finaid.txst.edu" } },

  { id: "utep", name: "University of Texas at El Paso", city: "El Paso", region: "West Texas & El Paso", type: "Public",
    rankSort: 330, rankLabel: "≈ #300+ National (R1 research)", acceptance: "~95–100% (open access)", tuition: 9500, coa: 24000, sel: "accessible", autoPct: 10,
    areas: ["eng", "cs", "health", "nursing", "business", "education", "sci", "psych"],
    notable: "R1 research university with strong engineering and borderland health programs. Very affordable.",
    aid: "UTEP Promise for lower-income families.",
    links: { home: "https://www.utep.edu", admissions: "https://www.utep.edu/admissions", aid: "https://www.utep.edu/student-affairs/financial-aid" } },

  { id: "utrgv", name: "University of Texas Rio Grande Valley", city: "Edinburg & Brownsville", region: "Rio Grande Valley", type: "Public",
    rankSort: 340, rankLabel: "≈ #300+ National", acceptance: "~90%", tuition: 9500, coa: 24000, sel: "accessible", autoPct: 10,
    areas: ["health", "nursing", "eng", "cs", "business", "education", "sci", "psych"],
    notable: "School of Medicine and B.S./M.D. early-assurance pathway. Bilingual and bicultural focus. Very affordable.",
    aid: "UTRGV Tuition Advantage for lower-income families.",
    links: { home: "https://www.utrgv.edu", admissions: "https://www.utrgv.edu/admissions", aid: "https://www.utrgv.edu/financial-aid" } },

  { id: "shsu", name: "Sam Houston State University", city: "Huntsville", region: "Houston & Gulf Coast", type: "Public",
    rankSort: 350, rankLabel: "≈ #300+ National", acceptance: "~85%", tuition: 11000, coa: 26000, sel: "accessible", autoPct: 10,
    areas: ["law", "education", "ag", "business", "health", "nursing", "media", "arts", "psych", "cs"],
    notable: "Nationally known Criminal Justice college. Agriculture, Education, Osteopathic Medicine.",
    aid: "Merit and need-based scholarships.",
    links: { home: "https://www.shsu.edu", admissions: "https://www.shsu.edu/admissions", aid: "https://www.shsu.edu/dept/financial-aid" } },

  { id: "twu", name: "Texas Woman's University", city: "Denton · Dallas · Houston", region: "Dallas–Fort Worth", type: "Public",
    rankSort: 360, rankLabel: "≈ #300+ National", acceptance: "~90%+", tuition: 10000, coa: 26000, sel: "accessible", autoPct: 10,
    areas: ["nursing", "health", "education", "psych", "business", "arts", "sci"],
    notable: "Largest public university primarily for women (open to all). Leader in nursing, occupational therapy, physical therapy, nutrition.",
    aid: "Merit and need-based aid.",
    links: { home: "https://twu.edu", admissions: "https://twu.edu/admissions", aid: "https://twu.edu/finaid" } },

  { id: "pvamu", name: "Prairie View A&M University (HBCU)", city: "Prairie View", region: "Houston & Gulf Coast", type: "Public",
    rankSort: 370, rankLabel: "Top public HBCU (US News HBCU list)", acceptance: "~75–85%", tuition: 11000, coa: 27000, sel: "accessible", autoPct: 10,
    areas: ["eng", "cs", "ag", "nursing", "business", "arch", "education", "psych", "law"],
    notable: "Historic HBCU in the Texas A&M System. Engineering, nursing, architecture, agriculture.",
    aid: "Scholarships and Texas A&M System programs.",
    links: { home: "https://www.pvamu.edu", admissions: "https://www.pvamu.edu/admissions", aid: "https://www.pvamu.edu/faid" } },

  { id: "tsu", name: "Texas Southern University (HBCU)", city: "Houston", region: "Houston & Gulf Coast", type: "Public",
    rankSort: 380, rankLabel: "Ranked HBCU (US News HBCU list)", acceptance: "~85–90%", tuition: 10000, coa: 26000, sel: "accessible", autoPct: 10,
    areas: ["aviation", "health", "law", "business", "media", "cs", "eng", "education", "psych"],
    notable: "One of the largest HBCUs. Aviation science, Pharmacy, Thurgood Marshall School of Law, Barbara Jordan–Mickey Leland School of Public Affairs.",
    aid: "Scholarships and need-based aid.",
    links: { home: "https://www.tsu.edu", admissions: "https://www.tsu.edu/admissions", aid: "https://www.tsu.edu/financial-aid" } },

  { id: "tarleton", name: "Tarleton State University", city: "Stephenville & Fort Worth", region: "Dallas–Fort Worth", type: "Public",
    rankSort: 390, rankLabel: "≈ #300+ National", acceptance: "~65–75%", tuition: 10500, coa: 25000, sel: "accessible", autoPct: 10,
    areas: ["ag", "education", "business", "nursing", "eng", "cs", "env", "psych", "law"],
    notable: "Texas A&M System. Agriculture, Education, growing engineering, Fort Worth campus.",
    aid: "Merit scholarships.",
    links: { home: "https://www.tarleton.edu", admissions: "https://www.tarleton.edu/admissions", aid: "https://www.tarleton.edu/finaid" } },

  { id: "sfa", name: "Stephen F. Austin State University", city: "Nacogdoches", region: "East Texas", type: "Public",
    rankSort: 400, rankLabel: "Regional (UT System)", acceptance: "~85%", tuition: 11000, coa: 25000, sel: "accessible", autoPct: 10,
    areas: ["env", "ag", "education", "nursing", "business", "arts", "sci", "psych"],
    notable: "Arthur Temple College of Forestry & Agriculture, Nursing, Education. Pine-forest campus.",
    aid: "Merit scholarships.",
    links: { home: "https://www.sfasu.edu", admissions: "https://www.sfasu.edu/admissions", aid: "https://www.sfasu.edu/financialaid" } },

  { id: "lamar", name: "Lamar University", city: "Beaumont", region: "Houston & Gulf Coast", type: "Public",
    rankSort: 410, rankLabel: "≈ National (unranked tier)", acceptance: "~85%", tuition: 11000, coa: 25000, sel: "accessible", autoPct: 10,
    areas: ["eng", "nursing", "education", "business", "cs", "sci", "env"],
    notable: "Engineering connected to the Gulf Coast petrochemical and energy industry (chemical and industrial engineering).",
    aid: "Merit scholarships.",
    links: { home: "https://www.lamar.edu", admissions: "https://www.lamar.edu/admissions", aid: "https://www.lamar.edu/financial-aid" } }
],

  /* Lower-cost and alternative pathways (shown below the university list) */
  pathways: [
  { name: "Dual credit (high school + college)", desc: "Earn college credit tuition-free or at low cost in many Texas districts through local community colleges. Check transferability for the target major.", url: "https://www.texasgateway.org" },
  { name: "Community college → university transfer", desc: "Austin CC, Dallas College, Houston CC, Lone Star, Alamo Colleges, San Jacinto and others. Save $15–30k with guaranteed transfer agreements.", url: "https://www.mytexasfuture.org" },
  { name: "UT Austin PACE program", desc: "Path to Admission through Co-Enrollment: take classes at UT and Austin Community College in year 1, then transfer to UT.", url: "https://pace.utexas.edu" },
  { name: "Texas A&M Engineering Academies", desc: "Start at a partner community college (e.g., Blinn, Austin CC, Houston CC) while taking A&M engineering courses, then transfer.", url: "https://engineering.tamu.edu/academies" },
  { name: "TSTC (Texas State Technical College)", desc: "Pay-for-performance technical degrees: aviation maintenance, welding, HVAC, electrical, IT, robotics/automation.", url: "https://www.tstc.edu" },
  { name: "JAMP (Joint Admission Medical Program)", desc: "Texas program for economically disadvantaged pre-med students: guaranteed medical-school admission if they meet the requirements. Apply in the 2nd year of college.", url: "https://www.texasjamp.org" },
  { name: "TAMS at UNT", desc: "Texas Academy of Mathematics & Science: talented 10th graders apply to complete 11th–12th grade as full-time UNT students.", url: "https://tams.unt.edu" },
  { name: "Registered apprenticeships", desc: "Earn while you learn in electrical, plumbing, HVAC and IT. Many are tuition-free with a paycheck.", url: "https://www.apprenticeship.gov" }
],
});
