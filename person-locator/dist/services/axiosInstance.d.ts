import { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ServiceConfig } from '../types';
/** Thrown when ES / backend is unreachable or returns 5xx. */
export declare class OfflineError extends Error {
    constructor(message: string);
}
export interface HttpClientConfig extends AxiosRequestConfig {
    timeout?: number;
    getHeaders?: () => Record<string, string>;
    /** Hook שרץ על כל תגובה מוצלחת לפני שהיא מוחזרת לקורא */
    onResponse?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
    /** Hook שרץ על כל שגיאת רשת / HTTP לפני שהיא נזרקת */
    onResponseError?: (error: AxiosError) => unknown;
}
export interface InterceptorHandlers<V> {
    onFulfilled?: (value: V) => V | Promise<V>;
    onRejected?: (error: unknown) => unknown;
}
export declare function initHttpClient(config: HttpClientConfig, force?: boolean): void;
/** מחזיר את ה-instance הגולמי של axios לשימושים מתקדמים */
export declare function http(): AxiosInstance;
export declare function get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
export declare function post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
export declare function put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
export declare function patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
export declare function del<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
export declare function head<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
export declare function options<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
export declare function request<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
/** עדכון baseURL בזמן ריצה (שימושי לסביבות דינמיות) */
export declare function setBaseURL(url: string): void;
/** הוספה / עדכון של default header */
export declare function setDefaultHeader(key: string, value: string): void;
/** הסרת default header */
export declare function removeDefaultHeader(key: string): void;
/** מוסיף request interceptor בזמן ריצה, מחזיר id להסרה */
export declare function addRequestInterceptor(handlers: InterceptorHandlers<InternalAxiosRequestConfig>): number;
/** מוסיף response interceptor בזמן ריצה, מחזיר id להסרה */
export declare function addResponseInterceptor(handlers: InterceptorHandlers<AxiosResponse>): number;
/** מסיר request interceptor לפי id */
export declare function removeRequestInterceptor(id: number): void;
/** מסיר response interceptor לפי id */
export declare function removeResponseInterceptor(id: number): void;
/** יוצר AbortController – מועבר ל-config.signal של הבקשה */
export declare function createAbortController(): AbortController;
/** בדיקה האם שגיאה נגרמה מביטול מכוון */
export declare function isCancel(error: unknown): boolean;
export declare function isAxiosError(error: unknown): error is AxiosError;
/**
 * מאתחל את ה-httpClient מתוך ServiceConfig של הספריה.
 * נקרא אוטומטית ב-usePersonSearch כאשר הסביבה משתנה.
 */
export declare function initFromServiceConfig(config: ServiceConfig): void;
/** Re-export של הטיפוסים השכיחים כדי שהצרכנים לא יצטרכו לייבא מ-axios ישירות */
export type { AxiosResponse, AxiosError, AxiosRequestConfig, AxiosInstance, InternalAxiosRequestConfig, };
