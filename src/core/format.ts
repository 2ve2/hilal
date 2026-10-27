import { isValidHijri } from './convert';
import {
  defaultDigits,
  formatNumber,
  getMonthNames,
  type Digits,
  type Locale,
} from './locale';
import type { HijriDate } from './types';

export type FormatHijriOptions = {
  /** Default: 'ar'. */
  locale?: Locale;
  /** Default: 'arabic' when locale is 'ar', 'latin' otherwise. */
  digits?: Digits;
};

const ERA: Record<Locale, string> = { ar: 'هـ', en: 'AH' };

/**
 * Formats a Hijri date as "day month year era", for example
 * "١ رمضان ١٤٤٦ هـ" or "1 Ramadan 1446 AH".
 *
 * @throws {RangeError} if `hijri` is not a valid date in the supported
 * range.
 */
export function formatHijri(
  hijri: HijriDate,
  options: FormatHijriOptions = {}
): string {
  if (!isValidHijri(hijri)) {
    throw new RangeError(
      `formatHijri: ${hijri.year}-${hijri.month}-${hijri.day} is not a ` +
        'valid Hijri date in the supported range'
    );
  }
  const locale = options.locale ?? 'ar';
  const digits = options.digits ?? defaultDigits(locale);
  const month = getMonthNames('hijri', locale)[hijri.month - 1];
  return [
    formatNumber(hijri.day, digits),
    month,
    formatNumber(hijri.year, digits),
    ERA[locale],
  ].join(' ');
}
