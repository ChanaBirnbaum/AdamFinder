import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
  CanceledError,
} from 'axios';
import type { ServiceConfig } from '../types';

let instance: AxiosInstance | null = null;

// ─── Domain Errors ────────────────────────────────────────────────────────────

/** Thrown when ES / backend is unreachable or returns 5xx. */
export class OfflineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfflineError';
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HttpClientConfig extends AxiosRequestConfig {
  timeout?: number;
  getHeaders?: () => Record<string, string>;

  /** Hook שרץ על כל תגובה מוצלחת לפני שהיא מוחזרת לקורא */
  onResponse?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;

  /**
   * Hook שרץ על כל שגיאת רשת / HTTP לפני שהיא נזרקת.
   * ברירת המחדל ממיר שגיאות axios לשגיאות דומיין:
   *  - ביטול בקשה        → DOMException('Aborted', 'AbortError')
   *  - 5xx / אין תגובה   → OfflineError
   *  - שגיאת HTTP אחרת   → Error
   */
  onResponseError?: (error: AxiosError) => unknown;
}

export interface InterceptorHandlers<V> {
  onFulfilled?: (value: V) => V | Promise<V>;
  onRejected?: (error: unknown) => unknown;
}

// ─── Default error handler ────────────────────────────────────────────────────

function defaultResponseErrorHandler(error: AxiosError): never {
  const status = error.response?.status;
  if (!status || status >= 500) {
    throw new OfflineError(
      status ? `Server returned ${status}` : `Network error: ${error.message}`,
    );
  }
  throw new Error(`HTTP error: ${status}`);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initHttpClient(config: HttpClientConfig, force = false): void {
  if (instance && !force) {
    console.warn('httpClient already initialized. Pass force=true to reinitialize.');
    return;
  }

  instance = axios.create({ ...config });

  // ── Request interceptor ──────────────────────────────────────────────────
  instance.interceptors.request.use(
    (req: InternalAxiosRequestConfig) => {
      req.withCredentials = true;

      if (config.timeout !== undefined) {
        req.timeout = config.timeout;
      }

      const dynamicHeaders = config.getHeaders?.() ?? {};
      req.headers = {
        'Content-Type': 'application/json',
        ...dynamicHeaders,
        ...req.headers,
      } as AxiosRequestHeaders;

      return req;
    },
    (error) => Promise.reject(error),
  );

  // ── Response interceptor ─────────────────────────────────────────────────
  instance.interceptors.response.use(
    (response) => config.onResponse?.(response) ?? response,
    (error: unknown) => {
      if (isCancel(error)) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
      }
      if (axios.isAxiosError(error)) {
        const handler = config.onResponseError ?? defaultResponseErrorHandler;
        return Promise.reject(handler(error));
      }
      return Promise.reject(error);
    },
  );
}

// ─── Getters ──────────────────────────────────────────────────────────────────

/** מחזיר את ה-instance הגולמי של axios לשימושים מתקדמים */
export function http(): AxiosInstance {
  if (!instance) throw new Error('httpClient not initialized. Call initHttpClient first.');
  return instance;
}

// ─── Convenience methods ──────────────────────────────────────────────────────

export function get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return http().get<T>(url, config);
}

export function post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return http().post<T>(url, data, config);
}

export function put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return http().put<T>(url, data, config);
}

export function patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return http().patch<T>(url, data, config);
}

export function del<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return http().delete<T>(url, config);
}

export function head<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return http().head<T>(url, config);
}

export function options<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return http().options<T>(url, config);
}

export function request<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return http().request<T>(config);
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

/** עדכון baseURL בזמן ריצה (שימושי לסביבות דינמיות) */
export function setBaseURL(url: string): void {
  http().defaults.baseURL = url;
}

/** הוספה / עדכון של default header */
export function setDefaultHeader(key: string, value: string): void {
  http().defaults.headers.common[key] = value;
}

/** הסרת default header */
export function removeDefaultHeader(key: string): void {
  delete http().defaults.headers.common[key];
}

// ─── Dynamic interceptors ─────────────────────────────────────────────────────

/** מוסיף request interceptor בזמן ריצה, מחזיר id להסרה */
export function addRequestInterceptor(
  handlers: InterceptorHandlers<InternalAxiosRequestConfig>,
): number {
  return http().interceptors.request.use(handlers.onFulfilled, handlers.onRejected);
}

/** מוסיף response interceptor בזמן ריצה, מחזיר id להסרה */
export function addResponseInterceptor(
  handlers: InterceptorHandlers<AxiosResponse>,
): number {
  return http().interceptors.response.use(handlers.onFulfilled, handlers.onRejected);
}

/** מסיר request interceptor לפי id */
export function removeRequestInterceptor(id: number): void {
  http().interceptors.request.eject(id);
}

/** מסיר response interceptor לפי id */
export function removeResponseInterceptor(id: number): void {
  http().interceptors.response.eject(id);
}

// ─── Cancellation ─────────────────────────────────────────────────────────────

/** יוצר AbortController – מועבר ל-config.signal של הבקשה */
export function createAbortController(): AbortController {
  return new AbortController();
}

/** בדיקה האם שגיאה נגרמה מביטול מכוון */
export function isCancel(error: unknown): boolean {
  return axios.isCancel(error) || error instanceof CanceledError;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

export function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

// ─── Library adapter ──────────────────────────────────────────────────────────

/**
 * מאתחל את ה-httpClient מתוך ServiceConfig של הספריה.
 * נקרא אוטומטית ב-usePersonSearch כאשר הסביבה משתנה.
 */
export function initFromServiceConfig(config: ServiceConfig): void {
  initHttpClient(
    {
      timeout: config.timeoutMs ?? 5000,
      getHeaders: config.authToken
        ? () => ({ Authorization: `Bearer ${config.authToken!}` })
        : undefined,
    },
    true,
  );
}

/** Re-export של הטיפוסים השכיחים כדי שהצרכנים לא יצטרכו לייבא מ-axios ישירות */
export type {
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
  AxiosInstance,
  InternalAxiosRequestConfig,
};
