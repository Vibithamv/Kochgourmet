import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

const SENSITIVE_HEADER_KEYS = new Set([
  'authorization',
  'x-refresh-token',
  'api-key',
  'invest-key',
]);

const SENSITIVE_BODY_KEYS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'confirmationcode',
  'refreshtoken',
  'token',
  'filebase64',
]);

function redactHeaders(
  headers: InternalAxiosRequestConfig['headers'],
): Record<string, unknown> {
  if (!headers) return {};

  const normalized =
    typeof (headers as { toJSON?: () => Record<string, unknown> }).toJSON === 'function'
      ? (headers as { toJSON: () => Record<string, unknown> }).toJSON()
      : (headers as Record<string, unknown>);

  const result: Record<string, unknown> = {};
  Object.entries(normalized).forEach(([key, value]) => {
    result[key] = SENSITIVE_HEADER_KEYS.has(key.toLowerCase()) ? '***' : value;
  });
  return result;
}

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_BODY_KEYS.has(key.toLowerCase())) {
    return '***';
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return redactBody(value as Record<string, unknown>);
  }
  return value;
}

export function redactBody(body: unknown): unknown {
  if (body == null) return body;
  if (Array.isArray(body)) {
    return body.map((item) =>
      item && typeof item === 'object' ? redactBody(item as Record<string, unknown>) : item,
    );
  }
  if (typeof body !== 'object') return body;

  const result: Record<string, unknown> = {};
  Object.entries(body as Record<string, unknown>).forEach(([key, value]) => {
    result[key] = redactValue(key, value);
  });
  return result;
}

function buildRequestUrl(config: InternalAxiosRequestConfig): string {
  try {
    return axios.getUri(config);
  } catch {
    return `${config.baseURL ?? ''}${config.url ?? ''}`;
  }
}

export function logApiRequest(client: string, config: InternalAxiosRequestConfig): void {
  console.log(`[${client}] request`, {
    method: (config.method ?? 'GET').toUpperCase(),
    url: buildRequestUrl(config),
    headers: redactHeaders(config.headers),
    params: config.params,
    data: redactBody(config.data),
  });
}

export function logApiResponse(client: string, response: AxiosResponse): void {
  console.log(`[${client}] response`, {
    method: (response.config.method ?? 'GET').toUpperCase(),
    url: buildRequestUrl(response.config),
    status: response.status,
    data: response.data,
  });
}

export function logApiError(client: string, error: AxiosError): void {
  console.log(`[${client}] response error`, {
    method: (error.config?.method ?? 'GET').toUpperCase(),
    url: error.config ? buildRequestUrl(error.config) : undefined,
    status: error.response?.status,
    data: error.response?.data,
    message: error.message,
  });
}

export function attachApiLoggingInterceptors(
  api: ReturnType<typeof axios.create>,
  client: string,
): void {
  api.interceptors.request.use((config) => {
    logApiRequest(client, config);
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      logApiResponse(client, response);
      return response;
    },
    (error: AxiosError) => {
      logApiError(client, error);
      return Promise.reject(error);
    },
  );
}
