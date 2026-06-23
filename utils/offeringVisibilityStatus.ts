import type { TFunction } from 'i18next';

export type OfferingVisibilityStatus =
  | 'privatesale'
  | 'presale'
  | 'whitelisting'
  | 'announcement'
  | 'presaleannouncement'
  | 'public'
  | 'finished'
  | 'draft';

type OfferingStatusColors = {
  status: {
    privateSale: string;
    preSale: string;
    whitelist: string;
    public: string;
    announcement: string;
    finished: string;
  };
  text: {
    secondary: string;
  };
};

export function getOfferingVisibilityStatusLabel(
  status: string,
  t: TFunction,
): string {
  switch (status) {
    case 'privatesale':
      return t('projects.privateSale');
    case 'presale':
      return t('projects.preSale');
    case 'whitelisting':
      return t('projects.whitelist');
    case 'public':
      return t('projects.public');
    case 'announcement':
      return t('projects.announcement');
    case 'presaleannouncement':
      return t('projects.presaleAnnouncement');
    case 'finished':
      return t('projects.finished');
    case 'draft':
      return t('projects.draft');
    default:
      return t('projects.unknown');
  }
}

export function getOfferingVisibilityStatusEmoji(status: string): string {
  switch (status) {
    case 'privatesale':
      return '🔒';
    case 'presale':
      return '⚡';
    case 'whitelisting':
      return '📝';
    case 'public':
      return '🚀';
    case 'announcement':
      return '📢';
    case 'presaleannouncement':
      return '🎯';
    case 'finished':
      return '✅';
    case 'draft':
      return '📝';
    default:
      return '❓';
  }
}

export function getOfferingVisibilityStatusColor(
  status: string,
  colors: OfferingStatusColors,
): string {
  switch (status) {
    case 'privatesale':
      return colors.status.privateSale;
    case 'presale':
    case 'presaleannouncement':
      return colors.status.preSale;
    case 'whitelisting':
      return colors.status.whitelist;
    case 'public':
      return colors.status.public;
    case 'announcement':
      return colors.status.announcement;
    case 'finished':
    case 'draft':
      return colors.status.finished;
    default:
      return colors.text.secondary;
  }
}
