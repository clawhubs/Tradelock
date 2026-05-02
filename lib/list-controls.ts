export type DateRangeKey = "all" | "24h" | "7d" | "30d";

export const dateRangeLabels: Record<DateRangeKey, string> = {
  all: "All Time",
  "24h": "Last 24h",
  "7d": "Last 7d",
  "30d": "Last 30d",
};

const orderedRanges: DateRangeKey[] = ["all", "24h", "7d", "30d"];

export function nextDateRange(range: DateRangeKey): DateRangeKey {
  const currentIndex = orderedRanges.indexOf(range);
  return orderedRanges[(currentIndex + 1) % orderedRanges.length] ?? "all";
}

export function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

export function matchesQuery(values: Array<string | number | null | undefined>, query: string) {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return true;
  }

  return values.some((value) => String(value ?? "").toLowerCase().includes(normalized));
}

export function parseDisplayDate(value: string | null | undefined) {
  if (!value || value === "N/A") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isWithinDateRange(value: string | null | undefined, range: DateRangeKey) {
  if (range === "all") {
    return true;
  }

  const parsed = parseDisplayDate(value);

  if (!parsed) {
    return false;
  }

  const now = Date.now();
  const ageMs = now - parsed.getTime();
  const limitMs =
    range === "24h" ? 24 * 60 * 60 * 1000 : range === "7d" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

  return ageMs <= limitMs;
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    page: safePage,
    totalPages,
    totalItems: items.length,
    startIndex,
    endIndex: Math.min(endIndex, items.length),
    items: items.slice(startIndex, endIndex),
  };
}

export function buildPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((left, right) => left - right);
}
