import React from 'react';

/**
 * Return an array of React nodes with the matched substring bolded.
 * Case-insensitive match.
 */
export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part)
      ? React.createElement('strong', { key: i, className: 'font-semibold' }, part)
      : part
  );
}
