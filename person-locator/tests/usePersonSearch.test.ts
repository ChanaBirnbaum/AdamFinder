import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { usePersonSearch } from '../src/hooks/usePersonSearch';
import { eq } from '../src/filters';
import * as esService from '../src/services/elasticSearchService';
import * as onlineService from '../src/services/onlineService';
import * as offlineService from '../src/services/offlineService';
import * as asirAuthService from '../src/services/asirAuthService';
import * as fieldConfigService from '../src/services/fieldConfigService';
import type { PersonLocatorProps, PersonResult } from '../src/types';

vi.mock('../src/services/elasticSearchService');
vi.mock('../src/services/onlineService');
vi.mock('../src/services/offlineService');
vi.mock('../src/services/asirAuthService');
vi.mock('../src/services/fieldConfigService');

const mockSearchPersons = esService.searchPersons as MockedFunction<typeof esService.searchPersons>;
const mockFetchSinglePerson = esService.fetchSinglePerson as MockedFunction<typeof esService.fetchSinglePerson>;
const mockFetchOnlinePersons = onlineService.fetchOnlinePersons as MockedFunction<typeof onlineService.fetchOnlinePersons>;
const mockSearchOffline = offlineService.searchOffline as MockedFunction<typeof offlineService.searchOffline>;
const mockCheckPersonPermission = asirAuthService.checkPersonPermission as MockedFunction<typeof asirAuthService.checkPersonPermission>;
const mockFetchAsirWhitelist = asirAuthService.fetchAsirWhitelist as MockedFunction<typeof asirAuthService.fetchAsirWhitelist>;
const mockFetchFieldConfig = fieldConfigService.fetchFieldConfig as MockedFunction<typeof fieldConfigService.fetchFieldConfig>;

const makeResult = (id: string, personType: PersonResult['personType'] = 'ezrach'): PersonResult => ({
  id,
  personType,
  isActive: true,
  source: 'elasticsearch',
  data: { fullName: `Person ${id}` },
});

const baseConfig: PersonLocatorProps = { env: 'dev' };

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchPersons.mockResolvedValue({ results: [], hasMore: false });
  mockFetchOnlinePersons.mockResolvedValue([]);
  mockSearchOffline.mockResolvedValue([]);
  mockFetchSinglePerson.mockResolvedValue(null);
  mockCheckPersonPermission.mockResolvedValue(null);
  mockFetchAsirWhitelist.mockResolvedValue(null);
  mockFetchFieldConfig.mockResolvedValue(null);
});

describe('usePersonSearch', () => {
  it('does NOT fire search before 300ms debounce', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePersonSearch(baseConfig));

    act(() => {
      result.current.setInputValue('abc');
    });

    // Before debounce settles
    expect(mockSearchPersons).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('fires exactly 3 ES calls + 2 online calls (asir + soher) in default mode (all types)', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePersonSearch({ ...baseConfig, minChars: 3 }));

    act(() => {
      result.current.setInputValue('abc');
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockSearchPersons).toHaveBeenCalledTimes(3);
    expect(mockFetchOnlinePersons).toHaveBeenCalledTimes(2);

    const calledTypes = mockSearchPersons.mock.calls.map((c) => c[0].personType);
    expect(calledTypes).toContain('asir');
    expect(calledTypes).toContain('soher');
    expect(calledTypes).toContain('ezrach');

    const onlineCalledTypes = mockFetchOnlinePersons.mock.calls.map((c) => c[0].personType);
    expect(onlineCalledTypes).toContain('asir');
    expect(onlineCalledTypes).toContain('soher');
    expect(onlineCalledTypes).not.toContain('ezrach');

    vi.useRealTimers();
  });

  it('fires 1 ES call + 1 online call when type prop is asir', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      usePersonSearch({ ...baseConfig, type: 'asir', minChars: 3 })
    );

    act(() => {
      result.current.setInputValue('abc');
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockSearchPersons).toHaveBeenCalledTimes(1);
    expect(mockFetchOnlinePersons).toHaveBeenCalledTimes(1);
    expect(mockSearchPersons.mock.calls[0][0].personType).toBe('asir');

    vi.useRealTimers();
  });

  it('calls offline service and sets isOffline on any ES failure', async () => {
    vi.useFakeTimers();
    mockSearchPersons.mockRejectedValue(new Error('Server returned 404'));
    const offlineResult = makeResult('offline-1');
    offlineResult.source = 'offline';
    mockSearchOffline.mockResolvedValue([offlineResult]);

    const { result } = renderHook(() =>
      usePersonSearch({ ...baseConfig, minChars: 3 })
    );

    act(() => {
      result.current.setInputValue('abc');
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isOffline).toBe(true);
    // No `type` restriction in baseConfig → all 3 person types fail ES and each falls back to offline.
    expect(mockSearchOffline).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it('singleSearch fires fetchSinglePerson on mount', async () => {
    const person = makeResult('single-1');
    mockFetchSinglePerson.mockResolvedValue(person);

    const { result } = renderHook(() =>
      usePersonSearch({
        ...baseConfig,
        singleSearch: { key: 'prisonerNumber', value: '12345' },
      })
    );

    await waitFor(() => {
      expect(result.current.selectedPerson).not.toBeNull();
    });

    expect(mockFetchSinglePerson).toHaveBeenCalledTimes(1);
    expect(mockFetchSinglePerson.mock.calls[0][0]).toMatchObject({
      key: 'prisonerNumber',
      value: '12345',
    });
  });

  it('singleSearch excludes an ES match that fails baseFilter', async () => {
    const inactivePerson = { ...makeResult('single-1'), isActive: false };
    mockFetchSinglePerson.mockResolvedValue(inactivePerson);

    const { result } = renderHook(() =>
      usePersonSearch({
        ...baseConfig,
        baseFilter: eq('isActive', true),
        singleSearch: { key: 'prisonerNumber', value: '12345' },
      })
    );

    await waitFor(() => {
      expect(mockFetchSinglePerson).toHaveBeenCalledTimes(1);
    });

    expect(result.current.selectedPerson).toBeNull();
  });

  it('singleSearch excludes an online match that fails baseFilter, falling back to the ES match', async () => {
    const esPerson = { ...makeResult('es-1'), isActive: true };
    const inactiveOnlinePerson = { ...makeResult('online-1'), isActive: false, source: 'online' as const };
    mockFetchSinglePerson.mockResolvedValue(esPerson);
    mockFetchOnlinePersons.mockResolvedValue([inactiveOnlinePerson]);

    const { result } = renderHook(() =>
      usePersonSearch({
        ...baseConfig,
        type: 'asir',
        baseFilter: eq('isActive', true),
        singleSearch: { key: 'prisonerNumber', value: '12345' },
      })
    );

    await waitFor(() => {
      expect(result.current.selectedPerson).toEqual(esPerson);
    });
  });

  it('singleSearch applies the asir whitelist (מידור) as an ES allowedList filter', async () => {
    const person = makeResult('single-1', 'asir');
    mockFetchSinglePerson.mockResolvedValue(person);
    mockFetchAsirWhitelist.mockResolvedValue({ field: 'idnt', values: [123, 456] });

    renderHook(() =>
      usePersonSearch({
        ...baseConfig,
        type: 'asir',
        serviceConfig: { asirWhitelist: { baseUrl: 'http://x', methods: {} } },
        singleSearch: { key: 'prisonerNumber', value: '12345' },
      })
    );

    await waitFor(() => {
      expect(mockFetchSinglePerson).toHaveBeenCalledTimes(1);
    });

    const calledConfig = mockFetchSinglePerson.mock.calls[0][0].config;
    expect(calledConfig.querySettings?.asir?.allowedList).toEqual({ field: 'idnt', values: [123, 456] });
  });

  it('runSearch uses the remote field config searchFields/sourceFields instead of DEFAULT_QUERY_SETTINGS', async () => {
    vi.useFakeTimers();
    mockFetchFieldConfig.mockResolvedValue({
      asir: { searchFields: ['customSearch'], sourceFields: ['customSource'] },
    });

    const { result } = renderHook(() =>
      usePersonSearch({ ...baseConfig, type: 'asir', minChars: 3 })
    );

    act(() => {
      result.current.setInputValue('abc');
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockSearchPersons).toHaveBeenCalledTimes(1);
    const calledConfig = mockSearchPersons.mock.calls[0][0].config;
    expect(calledConfig.querySettings?.asir?.searchFields).toEqual(['customSearch']);
    expect(calledConfig.querySettings?.asir?.sourceFields).toEqual(['customSource']);

    vi.useRealTimers();
  });

  it('displayFields reflects the remote field config once it resolves', async () => {
    mockFetchFieldConfig.mockResolvedValue({
      asir: { searchFields: ['customSearch'], sourceFields: ['customSource'] },
    });

    const { result } = renderHook(() =>
      usePersonSearch({ ...baseConfig, type: 'asir' })
    );

    await waitFor(() => {
      expect(result.current.displayFields).toEqual(['customSource']);
    });
  });

  it('singleSearch also queries the online service, and prefers the online result when both find a match', async () => {
    const esPerson = makeResult('es-1');
    const onlinePerson = makeResult('online-1');
    onlinePerson.source = 'online';
    mockFetchSinglePerson.mockResolvedValue(esPerson);
    mockFetchOnlinePersons.mockResolvedValue([onlinePerson]);

    const { result } = renderHook(() =>
      usePersonSearch({
        ...baseConfig,
        type: 'asir',
        singleSearch: { key: 'prisonerNumber', value: '12345' },
      })
    );

    await waitFor(() => {
      expect(result.current.selectedPerson).not.toBeNull();
    });

    expect(mockFetchOnlinePersons).toHaveBeenCalledTimes(1);
    expect(mockFetchOnlinePersons.mock.calls[0][0]).toMatchObject({
      query: '12345',
      personType: 'asir',
    });
    expect(result.current.selectedPerson).toEqual(onlinePerson);
  });

  it('singleSearch falls back to the online result when ES finds nothing', async () => {
    const onlinePerson = makeResult('online-1');
    onlinePerson.source = 'online';
    mockFetchSinglePerson.mockResolvedValue(null);
    mockFetchOnlinePersons.mockResolvedValue([onlinePerson]);

    const { result } = renderHook(() =>
      usePersonSearch({
        ...baseConfig,
        type: 'asir',
        singleSearch: { key: 'prisonerNumber', value: '12345' },
      })
    );

    await waitFor(() => {
      expect(result.current.selectedPerson).toEqual(onlinePerson);
    });
  });

  it('singleSearch does NOT fall back to offline when fallbackToOfflineIfNoAuth is off and nothing is found', async () => {
    mockFetchSinglePerson.mockResolvedValue(null);
    mockFetchOnlinePersons.mockResolvedValue([]);

    const { result } = renderHook(() =>
      usePersonSearch({
        ...baseConfig,
        type: 'asir',
        singleSearch: { key: 'prisonerNumber', value: '12345' },
      })
    );

    await waitFor(() => {
      expect(mockFetchSinglePerson).toHaveBeenCalledTimes(1);
    });

    expect(mockSearchOffline).not.toHaveBeenCalled();
    expect(result.current.selectedPerson).toBeNull();
  });

  it('singleSearch falls back to offline when ES+online find nothing and fallbackToOfflineIfNoAuth is on', async () => {
    const offlinePerson = makeResult('offline-1');
    offlinePerson.source = 'offline';
    mockFetchSinglePerson.mockResolvedValue(null);
    mockFetchOnlinePersons.mockResolvedValue([]);
    mockSearchOffline.mockResolvedValue([offlinePerson]);

    const { result } = renderHook(() =>
      usePersonSearch({
        ...baseConfig,
        type: 'asir',
        fallbackToOfflineIfNoAuth: true,
        singleSearch: { key: 'prisonerNumber', value: '12345' },
      })
    );

    await waitFor(() => {
      expect(result.current.selectedPerson).toEqual(offlinePerson);
    });

    expect(mockSearchOffline.mock.calls[0][0]).toMatchObject({
      query: '12345',
      personType: 'asir',
    });
  });

  it('singleSearch skips ES and falls back to offline when the user has no permission for the type', async () => {
    const offlinePerson = makeResult('offline-1');
    offlinePerson.source = 'offline';
    mockCheckPersonPermission.mockResolvedValue([{ type: 'asir', authorizedIds: [] }]);
    mockFetchOnlinePersons.mockResolvedValue([]);
    mockSearchOffline.mockResolvedValue([offlinePerson]);

    const { result } = renderHook(() =>
      usePersonSearch({
        ...baseConfig,
        type: 'asir',
        fallbackToOfflineIfNoAuth: true,
        serviceConfig: { asirPermission: { baseUrl: 'http://x', methods: {} } },
        singleSearch: { key: 'prisonerNumber', value: '12345' },
      })
    );

    await waitFor(() => {
      expect(result.current.selectedPerson).toEqual(offlinePerson);
    });

    expect(mockFetchSinglePerson).not.toHaveBeenCalled();
  });

  it('clearSelection resets state and calls clearData', async () => {
    const clearData = vi.fn();
    const { result } = renderHook(() =>
      usePersonSearch({ ...baseConfig, clearData })
    );

    // Let the mount-time fetches (e.g. remote field config) settle inside act() before asserting.
    await act(async () => {});

    act(() => {
      result.current.setInputValue('abc');
    });

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.inputValue).toBe('');
    expect(result.current.selectedPerson).toBeNull();
    expect(clearData).toHaveBeenCalledTimes(1);
  });
});
