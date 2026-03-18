import { renderHook, act, waitFor } from '@testing-library/react';
import { usePersonSearch } from '../src/hooks/usePersonSearch';
import * as esService from '../src/services/elasticSearchService';
import * as onlineService from '../src/services/onlineService';
import * as offlineService from '../src/services/offlineService';
import type { PersonLocatorProps, PersonResult } from '../src/types';
import { jest } from '@jest/globals';

jest.mock('../src/services/elasticSearchService');
jest.mock('../src/services/onlineService');
jest.mock('../src/services/offlineService');

const mockSearchPersons = esService.searchPersons as jest.MockedFunction<typeof esService.searchPersons>;
const mockFetchSinglePerson = esService.fetchSinglePerson as jest.MockedFunction<typeof esService.fetchSinglePerson>;
const mockFetchOnlinePersons = onlineService.fetchOnlinePersons as jest.MockedFunction<typeof onlineService.fetchOnlinePersons>;
const mockSearchOffline = offlineService.searchOffline as jest.MockedFunction<typeof offlineService.searchOffline>;

const makeResult = (id: string, personType: PersonResult['personType'] = 'ezrach'): PersonResult => ({
  id,
  personType,
  fullName: `Person ${id}`,
  isActive: true,
  source: 'elasticsearch',
});

const baseConfig: PersonLocatorProps = {};

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchPersons.mockResolvedValue({ results: [], hasMore: false });
  mockFetchOnlinePersons.mockResolvedValue([]);
  mockSearchOffline.mockResolvedValue([]);
  mockFetchSinglePerson.mockResolvedValue(null);
});

describe('usePersonSearch', () => {
  it('does NOT fire search before 300ms debounce', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => usePersonSearch(baseConfig));

    act(() => {
      result.current.setInputValue('abc');
    });

    // Before debounce settles
    expect(mockSearchPersons).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('fires exactly 3 ES calls + 2 online calls (asir + soher) in default mode (all types)', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => usePersonSearch({ ...baseConfig, minChars: 3 }));

    act(() => {
      result.current.setInputValue('abc');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockSearchPersons).toHaveBeenCalledTimes(3);
      expect(mockFetchOnlinePersons).toHaveBeenCalledTimes(2);
    });

    const calledTypes = mockSearchPersons.mock.calls.map((c) => c[0].personType);
    expect(calledTypes).toContain('asir');
    expect(calledTypes).toContain('soher');
    expect(calledTypes).toContain('ezrach');

    const onlineCalledTypes = mockFetchOnlinePersons.mock.calls.map((c) => c[0].personType);
    expect(onlineCalledTypes).toContain('asir');
    expect(onlineCalledTypes).toContain('soher');
    expect(onlineCalledTypes).not.toContain('ezrach');

    jest.useRealTimers();
  });

  it('fires 1 ES call + 1 online call when type prop is asir', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() =>
      usePersonSearch({ ...baseConfig, type: 'asir', minChars: 3 })
    );

    act(() => {
      result.current.setInputValue('abc');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockSearchPersons).toHaveBeenCalledTimes(1);
      expect(mockFetchOnlinePersons).toHaveBeenCalledTimes(1);
    });

    expect(mockSearchPersons.mock.calls[0][0].personType).toBe('asir');

    jest.useRealTimers();
  });

  it('calls offline service and sets isOffline on OfflineError + enableOfflineSearch', async () => {
    jest.useFakeTimers();
    mockSearchPersons.mockRejectedValue(new esService.OfflineError('ES down'));
    const offlineResult = makeResult('offline-1');
    offlineResult.source = 'offline';
    mockSearchOffline.mockResolvedValue([offlineResult]);

    const { result } = renderHook(() =>
      usePersonSearch({ ...baseConfig, enableOfflineSearch: true, minChars: 3 })
    );

    act(() => {
      result.current.setInputValue('abc');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isOffline).toBe(true);
    });

    expect(mockSearchOffline).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
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

  it('clearSelection resets state and calls clearData', async () => {
    const clearData = jest.fn();
    const { result } = renderHook(() =>
      usePersonSearch({ ...baseConfig, clearData })
    );

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
