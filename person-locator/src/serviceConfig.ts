import type { Environment, ServiceConfig } from './types';

const CONFIGS: Record<Environment, ServiceConfig> = {
  dev: {
    elasticsearchUrl: 'https://elastic-dev.internal',
    onlineServiceUrl: 'https://online-dev.internal',
    offlineServiceUrl: 'https://offline-dev.internal',
    pageSize: 3,
    timeoutMs: 5000,
  },
  test: {
    elasticsearchUrl: 'https://elastic-test.internal',
    onlineServiceUrl: 'https://online-test.internal',
    offlineServiceUrl: 'https://offline-test.internal',
    pageSize: 3,
    timeoutMs: 5000,
  },
  lrn: {
    elasticsearchUrl: 'https://elastic-lrn.internal',
    onlineServiceUrl: 'https://online-lrn.internal',
    offlineServiceUrl: 'https://offline-lrn.internal',
    pageSize: 3,
    timeoutMs: 5000,
  },
  prod: {
    elasticsearchUrl: 'https://elastic.prod.internal',
    onlineServiceUrl: 'https://online.prod.internal',
    offlineServiceUrl: 'https://offline.prod.internal',
    pageSize: 3,
    timeoutMs: 5000,
  },
};

export function getConfig(env: Environment): ServiceConfig {
  return CONFIGS[env] ?? CONFIGS['dev'];
}
