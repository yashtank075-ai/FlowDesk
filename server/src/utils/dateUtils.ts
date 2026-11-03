/**
 * Safely normalizes date-only ("YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY") or ISO DateTime strings into a valid JavaScript Date.
 * Handles null, undefined, Date instances, and validates against invalid calendar days (e.g. 2026-99-99, 2026-02-31).
 * Returns null if input is null or undefined (or empty string when allowEmpty is true).
 * Throws an Error with a descriptive message if the input cannot be parsed as a valid calendar date.
 */
export function normalizeDate(input: unknown, fieldName = 'date', allowEmpty = true): Date | null {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      if (allowEmpty) return null;
      throw new Error(`Field '${fieldName}' cannot be empty.`);
    }

    // Match YYYY-MM-DD date-only strings
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnlyMatch) {
      const year = parseInt(dateOnlyMatch[1], 10);
      const month = parseInt(dateOnlyMatch[2], 10);
      const day = parseInt(dateOnlyMatch[3], 10);

      // Validate month range
      if (month < 1 || month > 12) {
        throw new Error(`Field '${fieldName}' has an invalid month (${month}). Expected YYYY-MM-DD.`);
      }

      // Construct UTC Date at midnight
      const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

      // Strict calendar check: verify roundtrip year, month, and day match
      if (
        utcDate.getUTCFullYear() !== year ||
        utcDate.getUTCMonth() !== month - 1 ||
        utcDate.getUTCDate() !== day
      ) {
        throw new Error(`Field '${fieldName}' represents an invalid calendar date (${trimmed}).`);
      }

      return utcDate;
    }

    // Match DD-MM-YYYY or DD/MM/YYYY international/regional date strings
    const dmyMatch = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(trimmed);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10);
      const year = parseInt(dmyMatch[3], 10);

      if (month < 1 || month > 12) {
        throw new Error(`Field '${fieldName}' has an invalid month (${month}).`);
      }

      const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      if (
        utcDate.getUTCFullYear() !== year ||
        utcDate.getUTCMonth() !== month - 1 ||
        utcDate.getUTCDate() !== day
      ) {
        throw new Error(`Field '${fieldName}' represents an invalid calendar date (${trimmed}).`);
      }

      return utcDate;
    }

    // Attempt generic ISO DateTime parse
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Field '${fieldName}' must be a valid ISO-8601 date string (e.g. 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss.sssZ'). Received: '${input}'`);
    }

    return parsed;
  }

  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      throw new Error(`Field '${fieldName}' contains an invalid Date object.`);
    }
    return input;
  }

  throw new Error(`Field '${fieldName}' must be a valid date string or Date object.`);
}

export function isValidISODate(dateString: string): boolean {
  try {
    const d = normalizeDate(dateString, 'date', true);
    return d !== null && !isNaN(d.getTime());
  } catch {
    return false;
  }
}
