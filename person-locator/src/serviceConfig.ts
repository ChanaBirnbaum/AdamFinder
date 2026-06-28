import type { Environment, ServiceConfig } from './types';

// ─── Endpoint paths — shared across all environments ──────────────────────────
// To add a new endpoint, add it here once and use it in the services.
const METHODS = {
  elasticsearch: {
    search: '/{index}/_search',
  },
  online: {
    search: '/search',
  },
  offline: {
    search: '/search',
  },
  photos: {
    asir: '/photos/asir',
    soher: '/photos/soher',
    ezrach: '/photos/ezrach',
    byId: '/photos',
  },
  asirWhitelist: {
    getWhitelist: '/whitelist',
  },
  asirPermission: {
    checkPermission: '/check',
  },
  fieldConfig: {
    getFieldConfig: '/fields',
  },
} as const;

// ─── Base URLs per environment ────────────────────────────────────────────────
const BASE_URLS: Record<Environment, { elasticsearch: string; online: string; offline: string; asirWhitelist: string; asirPermission: string; fieldConfig: string }> = {
  dev:  { elasticsearch: 'https://elastic-dev.internal',  online: 'https://online-dev.internal',  offline: 'https://offline-dev.internal',  asirWhitelist: 'https://whitelist-dev.internal',  asirPermission: 'https://auth-dev.internal',  fieldConfig: 'https://fields-dev.internal'  },
  test: { elasticsearch: 'https://elastic-test.internal', online: 'https://online-test.internal', offline: 'https://offline-test.internal', asirWhitelist: 'https://whitelist-test.internal', asirPermission: 'https://auth-test.internal', fieldConfig: 'https://fields-test.internal' },
  lrn:  { elasticsearch: 'https://elastic-lrn.internal',  online: 'https://online-lrn.internal',  offline: 'https://offline-lrn.internal',  asirWhitelist: 'https://whitelist-lrn.internal',  asirPermission: 'https://auth-lrn.internal',  fieldConfig: 'https://fields-lrn.internal'  },
  prod: { elasticsearch: 'https://elastic.prod.internal', online: 'https://online.prod.internal', offline: 'https://offline.prod.internal', asirWhitelist: 'https://whitelist.prod.internal', asirPermission: 'https://auth.prod.internal', fieldConfig: 'https://fields.prod.internal' },
};

const CONFIGS: Record<Environment, ServiceConfig> = Object.fromEntries(
  (Object.keys(BASE_URLS) as Environment[]).map((env) => [
    env,
    {
      elasticsearch: { baseUrl: BASE_URLS[env].elasticsearch, methods: METHODS.elasticsearch },
      online:        { baseUrl: BASE_URLS[env].online,        methods: METHODS.online        },
      offline:       { baseUrl: BASE_URLS[env].offline,       methods: METHODS.offline       },
      photos:        { baseUrl: BASE_URLS[env].online,        methods: METHODS.photos        },
      asirWhitelist: { baseUrl: BASE_URLS[env].asirWhitelist, methods: METHODS.asirWhitelist },
      asirPermission:{ baseUrl: BASE_URLS[env].asirPermission,methods: METHODS.asirPermission},
      fieldConfig:   { baseUrl: BASE_URLS[env].fieldConfig,   methods: METHODS.fieldConfig   },
      pageSize: 5,
      timeoutMs: 5000,
    } satisfies ServiceConfig,
  ])
) as unknown as Record<Environment, ServiceConfig>;

export function getConfig(env: Environment): ServiceConfig {
  return CONFIGS[env] ?? CONFIGS['dev'];
}
