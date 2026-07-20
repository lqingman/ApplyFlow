export type ParsedResume = {
  firstName?: string;
  lastName?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  portfolio?: string;
  school?: string;
  degree?: string;
  graduationDate?: string;
  evidence: string[];
};

const sectionHeadingPattern =
  /^(?:summary|profile|experience|work experience|education|projects?|skills?|certifications?|awards?)$/i;
const rolePattern =
  /\b(?:software|frontend|front-end|backend|back-end|full-stack|developer|engineer|designer|analyst|manager|student|researcher)\b/i;
const actionPattern =
  /\b(?:built|created|developed|designed|implemented|shipped|improved|led|managed|tested|automated|delivered|launched|maintained|collaborated|worked|uses?|skilled|experienced)\b/i;

function cleanLine(value: string) {
  return value
    .replace(/^[\s•●▪◦‣⁃*-]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function linesFrom(text: string) {
  return text.replace(/\r/g, "").split("\n").map(cleanLine).filter(Boolean);
}

function firstMatch(lines: string[], pattern: RegExp) {
  return lines.map((line) => line.match(pattern)?.[0]).find(Boolean);
}

function normalizeUrl(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.replace(/[),.;]+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function findPortfolio(lines: string[]) {
  const pattern =
    /(?:https?:\/\/)?(?:www\.)?(?:github\.com|gitlab\.com|linkedin\.com\/in|[\w-]+\.(?:dev|io|me|com|ca))(?:\/[\w./?=#%-]*)?/gi;
  const candidates = lines.flatMap((line) =>
    Array.from(line.matchAll(pattern))
      .filter((match) => match.index === 0 || line[match.index - 1] !== "@")
      .map((match) => match[0]),
  );
  return normalizeUrl(
    candidates.find((value) =>
      /(?:github|gitlab|linkedin\.com\/in)/i.test(value),
    ) ?? candidates[0],
  );
}

function likelyName(lines: string[]) {
  return lines.slice(0, 8).find((line) => {
    if (line.length > 70 || /[@|:/\d]/.test(line)) return false;
    if (sectionHeadingPattern.test(line) || rolePattern.test(line))
      return false;
    const parts = line.split(/\s+/);
    return (
      parts.length >= 2 &&
      parts.length <= 4 &&
      parts.every((part) => /^[\p{L}][\p{L}'.-]*$/u.test(part))
    );
  });
}

function parseMonthYear(value: string) {
  const match = value.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i,
  );
  if (!match) return undefined;
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const month = String(months.indexOf(match[1].toLowerCase()) + 1).padStart(
    2,
    "0",
  );
  return `${match[2]}-${month}-01`;
}

function usefulEvidence(lines: string[], excluded: Set<string>) {
  return lines
    .filter(
      (line) =>
        !excluded.has(line) &&
        !sectionHeadingPattern.test(line) &&
        line.length >= 24 &&
        line.length <= 300 &&
        (actionPattern.test(line) ||
          /\b(?:React|TypeScript|Python|Java|C\+\+|SQL|AWS|Git)\b/i.test(line)),
    )
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, 12);
}

export function parseResumeText(text: string): ParsedResume {
  const lines = linesFrom(text);
  if (!lines.length) {
    throw new Error("No readable text was found in this resume.");
  }

  const email = firstMatch(lines, /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
  const phone = firstMatch(
    lines,
    /(?:\+?\d{1,3}[\s().-]*)?(?:\d[\s().-]*){9,14}\d/,
  )?.trim();
  const portfolio = findPortfolio(lines);
  const name = likelyName(lines);
  const nameParts = name?.split(/\s+/) ?? [];
  const headline = lines
    .slice(0, 12)
    .find(
      (line) => line !== name && rolePattern.test(line) && line.length <= 100,
    );
  const locationLine = lines.find((line) =>
    /^(?:location\s*:\s*)?[A-Za-z .'-]+,\s*(?:[A-Z]{2}|[A-Za-z .'-]{3,})$/i.test(
      line,
    ),
  );
  const location = locationLine?.replace(/^location\s*:\s*/i, "");
  const school = lines.find((line) =>
    /\b(?:university|college|institute|polytechnic)\b/i.test(line),
  );
  const degree = lines.find((line) =>
    /\b(?:Bachelor|Master|Doctor|B\.?Sc\.?|M\.?Sc\.?|B\.?A\.?|M\.?A\.?|BEng|MEng|Diploma|Degree)\b/i.test(
      line,
    ),
  );
  const educationIndex = Math.max(
    school ? lines.indexOf(school) : -1,
    degree ? lines.indexOf(degree) : -1,
  );
  const graduationDate = lines
    .slice(Math.max(0, educationIndex - 2), educationIndex + 4)
    .map(parseMonthYear)
    .find(Boolean);
  const excluded = new Set(
    [
      name,
      headline,
      email,
      phone,
      portfolio,
      locationLine,
      school,
      degree,
    ].filter((value): value is string => Boolean(value)),
  );

  return {
    ...(nameParts[0] ? { firstName: nameParts[0] } : {}),
    ...(nameParts.length > 1 ? { lastName: nameParts.slice(1).join(" ") } : {}),
    ...(headline ? { headline } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(location ? { location } : {}),
    ...(portfolio ? { portfolio } : {}),
    ...(school ? { school } : {}),
    ...(degree ? { degree } : {}),
    ...(graduationDate ? { graduationDate } : {}),
    evidence: usefulEvidence(lines, excluded),
  };
}
