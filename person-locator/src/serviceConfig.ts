import type { ServiceConfig } from './types';

const serviceConfig: ServiceConfig = {
  elasticsearchUrl: 'https://your-elasticsearch-url',
  onlineServiceUrl: 'https://your-online-service-url',
  offlineServiceUrl: 'https://your-offline-service-url',
  authToken: undefined,
  pageSize: 3,
  timeoutMs: 5000,
};

export default serviceConfig;
