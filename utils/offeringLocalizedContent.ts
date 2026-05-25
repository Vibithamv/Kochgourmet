export type VisibilityProjectStatus =
  | 'privatesale'
  | 'presale'
  | 'whitelisting'
  | 'announcement'
  | 'presaleannouncement'
  | 'public'
  | 'finished'
  | 'draft';

/** Fields needed to resolve phase-localized media (dashboard vs detail hero). */
export interface OfferingDashboardImageSource {
  status: VisibilityProjectStatus;
  privatesale_content?: unknown;
  publicsale_content?: unknown;
  presale_content?: unknown;
  announcement_content?: unknown;
  finished_content?: unknown;
  whitelisting_content?: unknown;
}

type LocalizedMediaField =
  | 'faq'
  | 'offering_description'
  | 'dashboard_image'
  | 'detail_page_image'
  /** Short marketing blurb per locale (e.g. under `publicsale_content.de.description`). */
  | 'description';

/** API may return localized blobs as JSON strings. */
function unwrapLocalizedContentBlock(raw: unknown): unknown {
  if (raw == null || typeof raw !== 'string') return raw;
  const t = raw.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return raw;
  try {
    return JSON.parse(t) as unknown;
  } catch {
    return raw;
  }
}

export function pickLocalizedHtmlField(
  raw: unknown,
  field: LocalizedMediaField,
  language: string
): string {
  const unwrapped = unwrapLocalizedContentBlock(raw);
  if (unwrapped == null) return '';
  if (typeof unwrapped === 'string') {
    if (field === 'dashboard_image' || field === 'detail_page_image') return '';
    return unwrapped;
  }
  if (typeof unwrapped !== 'object' || Array.isArray(unwrapped)) return '';
  const block = unwrapped as Record<string, Record<string, unknown>>;

  const tryGet = (loc: string): string => {
    const entry = block[loc];
    if (!entry || typeof entry !== 'object') return '';
    const v = entry[field];
    return typeof v === 'string' ? v : '';
  };

  const primary = language.split('-')[0]?.toLowerCase() ?? 'en';
  const fromPreferred =
    tryGet(primary) ||
    tryGet(language.toLowerCase()) ||
    tryGet('en');
  if (fromPreferred) return fromPreferred;

  for (const loc of Object.keys(block)) {
    const s = tryGet(loc);
    if (s) return s;
  }
  return '';
}

function projectLocalizedField(
  project: OfferingDashboardImageSource,
  field: LocalizedMediaField,
  language: string
): string {
  switch (project.status) {
    case 'public':
      return pickLocalizedHtmlField(
        project.publicsale_content,
        field,
        language
      );
    case 'presale':
    case 'presaleannouncement':
      return pickLocalizedHtmlField(project.presale_content, field, language);
    case 'whitelisting':
      return pickLocalizedHtmlField(
        project.whitelisting_content,
        field,
        language
      );
    case 'privatesale':
      return pickLocalizedHtmlField(
        project.privatesale_content,
        field,
        language
      );
    case 'announcement':
      return pickLocalizedHtmlField(
        project.announcement_content,
        field,
        language
      );
    case 'finished':
      return pickLocalizedHtmlField(
        project.finished_content,
        field,
        language
      );
    default:
      return '';
  }
}

/** List / dashboard cards: visibility-specific `dashboard_image`. */
export function projectDashboardImage(
  project: OfferingDashboardImageSource,
  language: string
): string {
  return projectLocalizedField(project, 'dashboard_image', language);
}

/** Project detail hero: visibility-specific `detail_page_image`, then API fallbacks. */
export function projectDetailPageImage(
  project: OfferingDashboardImageSource,
  language: string
): string {
  return projectLocalizedField(project, 'detail_page_image', language);
}

/** Card / list: visibility-specific short `description` for current locale, else ''. */
export function projectLocalizedDescription(
  project: OfferingDashboardImageSource,
  language: string
): string {
  return projectLocalizedField(project, 'description', language);
}
