function normalizedKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const countries = new Map([
  ["ca", "Canada"],
  ["can", "Canada"],
  ["canada", "Canada"],
  ["us", "United States"],
  ["usa", "United States"],
  ["unitedstates", "United States"],
  ["unitedstatesofamerica", "United States"],
  ["uk", "United Kingdom"],
  ["gb", "United Kingdom"],
  ["gbr", "United Kingdom"],
  ["greatbritain", "United Kingdom"],
  ["unitedkingdom", "United Kingdom"],
]);

const regions = new Map([
  ["ab", "Alberta"],
  ["alberta", "Alberta"],
  ["bc", "British Columbia"],
  ["britishcolumbia", "British Columbia"],
  ["mb", "Manitoba"],
  ["manitoba", "Manitoba"],
  ["nb", "New Brunswick"],
  ["newbrunswick", "New Brunswick"],
  ["nl", "Newfoundland and Labrador"],
  ["newfoundlandandlabrador", "Newfoundland and Labrador"],
  ["newfoundlandlabrador", "Newfoundland and Labrador"],
  ["nt", "Northwest Territories"],
  ["northwestterritories", "Northwest Territories"],
  ["ns", "Nova Scotia"],
  ["novascotia", "Nova Scotia"],
  ["nu", "Nunavut"],
  ["nunavut", "Nunavut"],
  ["on", "Ontario"],
  ["ontario", "Ontario"],
  ["pe", "Prince Edward Island"],
  ["pei", "Prince Edward Island"],
  ["princeedwardisland", "Prince Edward Island"],
  ["qc", "Quebec"],
  ["quebec", "Quebec"],
  ["sk", "Saskatchewan"],
  ["saskatchewan", "Saskatchewan"],
  ["yt", "Yukon"],
  ["yk", "Yukon"],
  ["yukon", "Yukon"],
]);

export function canonicalCountryName(value: string) {
  const trimmed = value.trim();
  return countries.get(normalizedKey(trimmed)) ?? trimmed;
}

export function canonicalRegionName(value: string) {
  const trimmed = value.trim();
  return regions.get(normalizedKey(trimmed)) ?? trimmed;
}

export const canadianRegionNames = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
] as const;
