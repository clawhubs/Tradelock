const REGION_CODES = [
  "AD", "AE", "AF", "AG", "AL", "AM", "AO", "AR", "AT", "AU", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH",
  "BI", "BJ", "BN", "BO", "BR", "BS", "BT", "BW", "BY", "BZ", "CA", "CD", "CF", "CG", "CH", "CI", "CL", "CM",
  "CN", "CO", "CR", "CU", "CV", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "ER", "ES",
  "ET", "FI", "FJ", "FM", "FR", "GA", "GB", "GD", "GE", "GH", "GM", "GN", "GQ", "GR", "GT", "GW", "GY", "HN",
  "HR", "HT", "HU", "ID", "IE", "IL", "IN", "IQ", "IR", "IS", "IT", "JM", "JO", "JP", "KE", "KG", "KH", "KI",
  "KM", "KN", "KP", "KR", "KW", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA",
  "MC", "MD", "ME", "MG", "MH", "MK", "ML", "MM", "MN", "MR", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NE", "NG", "NI", "NL", "NO", "NP", "NR", "NZ", "OM", "PA", "PE", "PG", "PH", "PK", "PL", "PT", "PW", "PY",
  "QA", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SI", "SK", "SL", "SM", "SN", "SO", "SR",
  "SS", "ST", "SV", "SY", "SZ", "TD", "TG", "TH", "TJ", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
  "UA", "UG", "US", "UY", "UZ", "VA", "VC", "VE", "VN", "VU", "WS", "YE", "ZA", "ZM", "ZW",
] as const;

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const LOCATION_FLAGS = new Map<string, string>(
  REGION_CODES.flatMap((countryCode) => {
    const countryName = regionNames.of(countryCode);
    return countryName ? [[countryName.toLowerCase(), countryCode]] : [];
  }),
);

const LOCATION_ALIASES: Array<[string, string]> = [
  ["uae", "AE"],
  ["united arab emirates", "AE"],
  ["dubai", "AE"],
  ["abu dhabi", "AE"],
  ["uk", "GB"],
  ["united kingdom", "GB"],
  ["great britain", "GB"],
  ["england", "GB"],
  ["london", "GB"],
  ["usa", "US"],
  ["u s a", "US"],
  ["united states", "US"],
  ["united states of america", "US"],
  ["new york", "US"],
  ["south korea", "KR"],
  ["seoul", "KR"],
  ["north korea", "KP"],
  ["vietnam", "VN"],
  ["taiwan", "TW"],
  ["hong kong", "HK"],
  ["macau", "MO"],
  ["russia", "RU"],
  ["turkey", "TR"],
  ["türkiye", "TR"],
  ["istanbul", "TR"],
  ["ankara", "TR"],
  ["czech republic", "CZ"],
  ["bolivia", "BO"],
  ["venezuela", "VE"],
  ["iran", "IR"],
  ["syria", "SY"],
  ["tanzania", "TZ"],
  ["laos", "LA"],
  ["moldova", "MD"],
  ["brunei", "BN"],
  ["palestine", "PS"],
  ["kosovo", "XK"],
  ["singapore", "SG"],
  ["shenzhen", "CN"],
  ["ningbo", "CN"],
  ["guangzhou", "CN"],
  ["shanghai", "CN"],
  ["beijing", "CN"],
  ["frankfurt", "DE"],
  ["berlin", "DE"],
  ["munich", "DE"],
  ["zurich", "CH"],
  ["geneva", "CH"],
  ["globalimport", "SG"],
  ["dubai trade", "AE"],
  ["quality works", "DE"],
  ["shenzhen parts", "CN"],
  ["ningbo tech", "CN"],
];

function normalize(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toFlagEmoji(countryCode: string) {
  if (!/^[A-Z]{2}$/.test(countryCode)) return "🌐";
  return countryCode
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

export function getCountryCode(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = normalize(value);
    if (!normalized) continue;
    if (/^[a-z]{2}$/.test(normalized)) return normalized.toUpperCase();
    for (const [alias, countryCode] of LOCATION_ALIASES) {
      if (normalized.includes(alias)) return countryCode;
    }
    const exact = LOCATION_FLAGS.get(normalized);
    if (exact) return exact;
    for (const [countryName, countryCode] of LOCATION_FLAGS.entries()) {
      if (normalized.includes(countryName)) return countryCode;
    }
  }
  return null;
}

export function getCountryFlag(...values: Array<string | null | undefined>) {
  const countryCode = getCountryCode(...values);
  return countryCode ? toFlagEmoji(countryCode) : "🌐";
}
