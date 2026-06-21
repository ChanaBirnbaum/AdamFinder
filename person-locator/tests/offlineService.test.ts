import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { searchOffline } from '../src/services/offlineService';
import * as axiosInstance from '../src/services/axiosInstance';
import type { ServiceConfig } from '../src/types';

vi.mock('../src/services/axiosInstance');

const mockGet = axiosInstance.get as MockedFunction<typeof axiosInstance.get>;

const config: ServiceConfig = {
  elasticsearch: { baseUrl: 'https://es', methods: {} },
  online: { baseUrl: 'https://online', methods: {} },
  offline: { baseUrl: 'https://offline', methods: { search: '/search' } },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockResolvedValue({ data: { results: [{ id: '1', personType: 'asir' }] } } as never);
});

describe('searchOffline', () => {
  it('does NOT call the offline endpoint for a free-text (non-numeric) query', async () => {
    const results = await searchOffline({
      query: 'אבי כהן',
      config,
      signal: new AbortController().signal,
    });

    expect(mockGet).not.toHaveBeenCalled();
    expect(results).toEqual([]);
  });

  it('calls the offline endpoint for an exact numeric identifier, regardless of length', async () => {
    await searchOffline({ query: '12345', config, signal: new AbortController().signal });
    expect(mockGet).toHaveBeenCalledTimes(1);

    await searchOffline({ query: '123456789012', config, signal: new AbortController().signal });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('rejects a numeric query with non-digit characters mixed in', async () => {
    const results = await searchOffline({
      query: '123-456',
      config,
      signal: new AbortController().signal,
    });

    expect(mockGet).not.toHaveBeenCalled();
    expect(results).toEqual([]);
  });

  it('trims whitespace before validating the identifier', async () => {
    await searchOffline({ query: '  9876  ', config, signal: new AbortController().signal });
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
