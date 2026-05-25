import {
  EncodingType,
  getInfoAsync,
  readAsStringAsync,
} from 'expo-file-system/legacy';

export const PROFILE_PICTURE_MAX_BYTES = 512_000;

export type ProfilePictureContentType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp';

const EXTENSION_TO_MIME: Record<string, ProfilePictureContentType> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

const ALLOWED_CONTENT_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export type ProfilePicturePayload = {
  image: string;
  contentType: ProfilePictureContentType;
};

export type ProfilePicturePrepareError =
  | 'unsupported'
  | 'tooLarge'
  | 'readFailed';

function extensionFromUri(uri: string): string | null {
  const path = uri.split('?')[0];
  const lastDot = path.lastIndexOf('.');
  if (lastDot === -1) return null;
  return path.slice(lastDot + 1).toLowerCase();
}

export function contentTypeFromUri(uri: string): ProfilePictureContentType | null {
  const ext = extensionFromUri(uri);
  if (!ext) return null;
  return EXTENSION_TO_MIME[ext] ?? null;
}

export function contentTypeFromMimeType(
  mimeType: string | null | undefined,
): ProfilePictureContentType | null {
  if (!mimeType) return null;
  const normalized = mimeType.toLowerCase();
  if (normalized === 'image/jpg') return 'image/jpeg';
  if (ALLOWED_CONTENT_TYPES.has(normalized)) {
    return normalized as ProfilePictureContentType;
  }
  return null;
}

export function resolveProfilePictureContentType(
  uri: string,
  mimeType?: string | null,
): ProfilePictureContentType | null {
  return contentTypeFromMimeType(mimeType) ?? contentTypeFromUri(uri);
}

function stripDataUrlPrefix(base64: string): string {
  const match = base64.match(/^data:image\/[^;]+;base64,(.+)$/);
  return match ? match[1] : base64;
}

export async function prepareProfilePicturePayload(
  uri: string,
  mimeType?: string | null,
  fileSizeBytes?: number | null,
): Promise<
  | { ok: true; payload: ProfilePicturePayload }
  | { ok: false; error: ProfilePicturePrepareError }
> {
  const contentType = resolveProfilePictureContentType(uri, mimeType);
  if (!contentType) {
    return { ok: false, error: 'unsupported' };
  }

  let byteSize = fileSizeBytes ?? null;
  if (byteSize == null) {
    try {
      const info = await getInfoAsync(uri);
      if (!info.exists) {
        return { ok: false, error: 'readFailed' };
      }
      byteSize = typeof info.size === 'number' ? info.size : null;
    } catch {
      return { ok: false, error: 'readFailed' };
    }
  }

  if (byteSize == null || byteSize > PROFILE_PICTURE_MAX_BYTES) {
    return { ok: false, error: 'tooLarge' };
  }

  try {
    const raw = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });
    return {
      ok: true,
      payload: {
        image: stripDataUrlPrefix(raw),
        contentType,
      },
    };
  } catch {
    return { ok: false, error: 'readFailed' };
  }
}
