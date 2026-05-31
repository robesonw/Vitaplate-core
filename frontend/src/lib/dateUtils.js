import { format as dfFormat, formatDistanceToNow, parseISO } from 'date-fns';

// API timestamps arrive in camelCase (createdDate, entryDate, syncedAt) while some
// components were written against snake_case. These helpers tolerate either casing and
// never throw on a missing/invalid value — date-fns throws "Invalid time value" on an
// invalid Date, which otherwise crashes the surrounding page into the error boundary.

export function toValidDate(value) {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function safeFormat(value, fmt, fallback = '') {
  const date = toValidDate(value);
  return date ? dfFormat(date, fmt) : fallback;
}

export function safeFormatISO(value, fmt, fallback = '') {
  if (value == null || value === '') return fallback;
  try {
    const date = typeof value === 'string' ? parseISO(value) : toValidDate(value);
    if (!date || Number.isNaN(date.getTime())) return fallback;
    return dfFormat(date, fmt);
  } catch {
    return fallback;
  }
}

export function safeRelativeTime(value, fallback = '') {
  const date = toValidDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : fallback;
}
