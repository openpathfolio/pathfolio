/**
 * EXAMPLE adapter: copy this file to add a real source.
 * Disabled by default. Point FEED_URL at an official JSON feed/API whose
 * terms allow automated use, then map its fields to our schema.
 */
export const name = "example-json-feed";
export const enabled = false;

const FEED_URL = "https://example.org/programs.json";

export async function fetchOpportunities(ctx) {
  const res = await ctx.get(FEED_URL);
  const rows = await res.json();
  return rows.map(r => ({
    id: `example-${String(r.id).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: r.name,
    org: r.organization,
    type: "internship",
    states: [r.state || "US"],
    location: r.city || "Online",
    grades: [11, 12],
    minAge: r.min_age ?? null,
    cost: r.paid ? "paid" : "free",
    deadline: r.deadline || null,
    areas: ["cs"],
    url: r.url,
    description: String(r.summary || "").slice(0, 400),
    recurring: false
  }));
}
