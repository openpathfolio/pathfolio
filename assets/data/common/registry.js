/* ============================================================
   Pathfolio: shared registry
   ------------------------------------------------------------
   Each state lives in assets/data/states/<code>.js and calls
   registerState("<CODE>", {...}). See docs/ADDING_A_STATE.md.
   ============================================================ */

const STATES = {};
function registerState(code, data) {
  (data.universities || []).forEach(u => { if (!u.state) u.state = code; });   /* residency-aware costs & rules (spec 003) */
  STATES[code] = Object.assign({ code }, data);
}

/* States shown in the picker. available:false = "coming soon" */
const STATE_LIST = [
  { code: "TX", name: "Texas", available: true },
  { code: "CA", name: "California", available: false },
  { code: "FL", name: "Florida", available: false },
  { code: "NY", name: "New York", available: false },
  { code: "GA", name: "Georgia", available: false },
  { code: "IL", name: "Illinois", available: false },
  { code: "WA", name: "Washington", available: false }
];

/* Study areas shared by universities, career paths and opportunities */
const AREAS = {
  eng: "Engineering",
  cs: "Computer Science & IT",
  health: "Health & Pre-Med",
  nursing: "Nursing",
  business: "Business & Finance",
  law: "Law, Government & Public Service",
  psych: "Psychology & Social Sciences",
  education: "Education",
  arts: "Music & Performing Arts",
  design: "Design, Animation & Games",
  media: "Journalism, Media & Film",
  arch: "Architecture & Construction",
  ag: "Agriculture & Animal Science",
  env: "Environment & Energy",
  sci: "Natural Sciences & Math",
  aviation: "Aviation & Aerospace Ops",
  trades: "Skilled Trades & Technology"
};
