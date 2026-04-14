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
} as const;

// ─── Base URLs per environment ────────────────────────────────────────────────
const BASE_URLS: Record<Environment, { elasticsearch: string; online: string; offline: string }> = {
  dev:  { elasticsearch: 'https://elastic-dev.internal',  online: 'https://online-dev.internal',  offline: 'https://offline-dev.internal'  },
  test: { elasticsearch: 'https://elastic-test.internal', online: 'https://online-test.internal', offline: 'https://offline-test.internal' },
  lrn:  { elasticsearch: 'https://elastic-lrn.internal',  online: 'https://online-lrn.internal',  offline: 'https://offline-lrn.internal'  },
  prod: { elasticsearch: 'https://elastic.prod.internal', online: 'https://online.prod.internal', offline: 'https://offline.prod.internal' },
};

const CONFIGS: Record<Environment, ServiceConfig> = Object.fromEntries(
  (Object.keys(BASE_URLS) as Environment[]).map((env) => [
    env,
    {
      elasticsearch: { baseUrl: BASE_URLS[env].elasticsearch, methods: METHODS.elasticsearch },
      online:        { baseUrl: BASE_URLS[env].online,        methods: METHODS.online        },
      offline:       { baseUrl: BASE_URLS[env].offline,       methods: METHODS.offline       },
      pageSize:  3,
      timeoutMs: 5000,
    } satisfies ServiceConfig,
  ])
) as unknown as Record<Environment, ServiceConfig>;

export function getConfig(env: Environment): ServiceConfig {
  return CONFIGS[env] ?? CONFIGS['dev'];
}
