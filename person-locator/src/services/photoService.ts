import { get } from './axiosInstance';
import type { PersonResult, PersonType, ServiceConfig } from '../types';

const photoUrlCache = new Map<string, string>();

const IDENTIFIER_FIELD: Record<PersonType, string> = {
  asir: 'prisonerNumber',
  soher: 'employeeNumber',
  ezrach: 'idNumber',
};

function cacheKey(personType: PersonType, identifier: string): string {
  return `${personType}:${identifier}`;
}

function resolveIdentifier(person: PersonResult): string {
  const value = person.data[IDENTIFIER_FIELD[person.personType]];
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function looksLikeBase64(value: string): boolean {
  if (!value) return false;
  const compact = value.replace(/\s+/g, '');
  if (compact.length < 40 || compact.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/=]+$/.test(compact);
}

function toImageSrc(raw: unknown, mimeType?: unknown): string | null {
  if (typeof raw !== 'string') return null;

  const value = raw.trim();
  if (!value) return null;

  if (value.startsWith('data:image/')) {
    return value;
  }

  if (/^https?:\/\//i.test(value) || value.startsWith('/')) {
    return value;
  }

  if (!looksLikeBase64(value)) {
    return null;
  }

  const normalizedMime = typeof mimeType === 'string' && mimeType.trim() !== ''
    ? mimeType.trim()
    : 'image/jpeg';

  return `data:${normalizedMime};base64,${value.replace(/\s+/g, '')}`;
}

function parseSinglePhotoUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as Record<string, unknown>;

  const direct =
    toImageSrc(obj['photoUrl'], obj['mimeType'] ?? obj['contentType']) ??
    toImageSrc(obj['url'], obj['mimeType'] ?? obj['contentType']) ??
    toImageSrc(obj['imageUrl'], obj['mimeType'] ?? obj['contentType']) ??
    toImageSrc(obj['imageBase64'], obj['mimeType'] ?? obj['contentType']) ??
    toImageSrc(obj['photoBase64'], obj['mimeType'] ?? obj['contentType']) ??
    toImageSrc(obj['base64'], obj['mimeType'] ?? obj['contentType']) ??
    toImageSrc(obj['image'], obj['mimeType'] ?? obj['contentType']);
  if (direct) return direct;

  const dataObj = obj['data'];
  if (dataObj && typeof dataObj === 'object') {
    const data = dataObj as Record<string, unknown>;
    const nested =
      toImageSrc(data['photoUrl'], data['mimeType'] ?? data['contentType']) ??
      toImageSrc(data['url'], data['mimeType'] ?? data['contentType']) ??
      toImageSrc(data['imageUrl'], data['mimeType'] ?? data['contentType']) ??
      toImageSrc(data['imageBase64'], data['mimeType'] ?? data['contentType']) ??
      toImageSrc(data['photoBase64'], data['mimeType'] ?? data['contentType']) ??
      toImageSrc(data['base64'], data['mimeType'] ?? data['contentType']) ??
      toImageSrc(data['image'], data['mimeType'] ?? data['contentType']);
    if (nested) return nested;
  }

  return null;
}

async function fetchPhotoUrlForPerson(params: {
  personType: PersonType;
  identifier: string;
  config: ServiceConfig;
  signal: AbortSignal;
}): Promise<string | null> {
  const { personType, identifier, config, signal } = params;
  if (!identifier) return null;

  const key = cacheKey(personType, identifier);
  const cached = photoUrlCache.get(key);
  if (cached) return cached;

  const baseUrl = config.photos?.baseUrl ?? config.online.baseUrl;
  const identifierParam = IDENTIFIER_FIELD[personType];
  const method =
    config.photos?.methods[personType] ??
    config.photos?.methods['byId'] ??
    config.photos?.methods['byIds'] ??
    config.photos?.methods['search'] ??
    '/photos';

  const url = new URL(`${baseUrl}${method}`);
  url.searchParams.set(identifierParam, identifier);

  try {
    const response = await get<unknown>(url.toString(), { signal });
    const photoUrl = parseSinglePhotoUrl(response.data);
    if (!photoUrl) return null;

    photoUrlCache.set(key, photoUrl);
    return photoUrl;
  } catch {
    // Best effort only: missing photos should not break search flow.
    return null;
  }
}

export async function enrichPersonsWithPhotoUrls(params: {
  persons: PersonResult[];
  config: ServiceConfig;
  signal: AbortSignal;
}): Promise<PersonResult[]> {
  const { persons, config, signal } = params;

  const uniquePersons = new Map<string, { personType: PersonType; identifier: string }>();
  for (const person of persons) {
    const identifier = resolveIdentifier(person);
    if (!identifier) continue;
    const key = cacheKey(person.personType, identifier);
    if (!uniquePersons.has(key)) {
      uniquePersons.set(key, { personType: person.personType, identifier });
    }
  }

  const photoEntries = await Promise.all(
    [...uniquePersons.values()].map(async ({ personType, identifier }) => {
      const photoUrl = await fetchPhotoUrlForPerson({
        personType,
        identifier,
        config,
        signal,
      });
      return [cacheKey(personType, identifier), photoUrl] as const;
    }),
  );

  const photoMap: Record<string, string> = {};
  for (const [key, url] of photoEntries) {
    if (url) photoMap[key] = url;
  }

  if (Object.keys(photoMap).length === 0) return persons;

  return persons.map((person) => {
    const current = person.data['photoUrl'];
    if (current) return person;

    const identifier = resolveIdentifier(person);
    if (!identifier) return person;

    const fetched = photoMap[cacheKey(person.personType, identifier)];
    if (!fetched) return person;

    return {
      ...person,
      data: {
        ...person.data,
        photoUrl: fetched,
      },
    };
  });
}
