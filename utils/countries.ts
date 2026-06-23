import countriesData from '@/constants/countries.json';

export type CountryRecord = {
  name: string;
  'alpha-2': string;
  'alpha-3': string;
};

const COUNTRIES = countriesData as CountryRecord[];

const byAlpha2 = new Map<string, CountryRecord>();
const byNameLower = new Map<string, CountryRecord>();

for (const country of COUNTRIES) {
  byAlpha2.set(country['alpha-2'].toUpperCase(), country);
  byNameLower.set(country.name.toLowerCase(), country);
}

/** Sorted country list for pickers (Germany, Austria, Switzerland first). */
export function getCountriesForPicker(): CountryRecord[] {
  const priority = ['DE', 'AT', 'CH'];
  const prioritySet = new Set(priority);
  const prioritized = priority
    .map((code) => byAlpha2.get(code))
    .filter((c): c is CountryRecord => Boolean(c));
  const rest = COUNTRIES.filter((c) => !prioritySet.has(c['alpha-2']))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...prioritized, ...rest];
}

export function getCountryNameByAlpha2(code: string | null | undefined): string {
  const trimmed = code?.trim();
  if (!trimmed) return '';
  const match = byAlpha2.get(trimmed.toUpperCase());
  return match?.name ?? trimmed;
}

/** Normalize API/storage value to ISO alpha-2 (handles legacy full names). */
export function resolveCountryAlpha2(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return '';

  const upper = trimmed.toUpperCase();
  if (byAlpha2.has(upper)) return upper;

  const byName = byNameLower.get(trimmed.toLowerCase());
  if (byName) return byName['alpha-2'];

  return trimmed;
}

export function filterCountries(query: string): CountryRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return getCountriesForPicker();
  return getCountriesForPicker().filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c['alpha-2'].toLowerCase().includes(q),
  );
}
