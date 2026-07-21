export type AddressChoiceKind = "country" | "region" | "generic";

function normalizedKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(?:province|territory|state)\s+of\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function aliasMap(groups: Array<[string, ...string[]]>) {
  const aliases = new Map<string, string>();
  groups.forEach(([canonical, ...values]) => {
    [canonical, ...values].forEach((value) =>
      aliases.set(normalizedKey(value), canonical),
    );
  });
  return aliases;
}

const countryAliases = aliasMap([
  ["Canada", "CA", "CAN"],
  ["United States", "US", "USA", "U.S.", "U.S.A.", "United States of America"],
  ["United Kingdom", "UK", "GB", "GBR", "Great Britain"],
]);

const canadianRegionAliases = aliasMap([
  ["Alberta", "AB"],
  ["British Columbia", "BC", "B.C."],
  ["Manitoba", "MB"],
  ["New Brunswick", "NB"],
  ["Newfoundland and Labrador", "NL", "Newfoundland & Labrador"],
  ["Northwest Territories", "NT"],
  ["Nova Scotia", "NS"],
  ["Nunavut", "NU"],
  ["Ontario", "ON"],
  ["Prince Edward Island", "PE", "PEI"],
  ["Quebec", "QC", "Québec"],
  ["Saskatchewan", "SK"],
  ["Yukon", "YT", "YK"],
]);

function canonicalValue(value: string, kind: AddressChoiceKind) {
  const key = normalizedKey(value);
  if (kind === "country") return countryAliases.get(key) ?? key;
  if (kind === "region") return canadianRegionAliases.get(key) ?? key;
  return key;
}

export function addressChoiceMatches(
  option: string,
  requested: string,
  kind: AddressChoiceKind,
) {
  return canonicalValue(option, kind) === canonicalValue(requested, kind);
}
