export type Locale = 'ar' | 'en';
export type Digits = 'arabic' | 'latin';
export type CalendarType = 'hijri' | 'gregorian';
export type WeekdayFormat = 'short' | 'long';

const HIJRI_MONTHS: Record<Locale, readonly string[]> = {
  ar: [
    'محرم',
    'صفر',
    'ربيع الأول',
    'ربيع الآخر',
    'جمادى الأولى',
    'جمادى الآخرة',
    'رجب',
    'شعبان',
    'رمضان',
    'شوال',
    'ذو القعدة',
    'ذو الحجة',
  ],
  en: [
    'Muharram',
    'Safar',
    "Rabi' al-Awwal",
    "Rabi' al-Thani",
    'Jumada al-Ula',
    'Jumada al-Akhirah',
    'Rajab',
    "Sha'ban",
    'Ramadan',
    'Shawwal',
    "Dhu al-Qi'dah",
    'Dhu al-Hijjah',
  ],
};

// Saudi/Gulf style month names (يناير، فبراير ...), not the Levantine
// names (كانون الثاني، شباط ...).
const GREGORIAN_MONTHS: Record<Locale, readonly string[]> = {
  ar: [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

// Sunday first, matching Date#getDay().
const WEEKDAYS: Record<Locale, Record<WeekdayFormat, readonly string[]>> = {
  ar: {
    long: [
      'الأحد',
      'الاثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الجمعة',
      'السبت',
    ],
    short: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  },
  en: {
    long: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ],
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
};

/**
 * The 12 month names of a calendar, January / Muharram first. Returns a
 * new array on every call.
 */
export function getMonthNames(
  calendar: CalendarType,
  locale: Locale
): string[] {
  const names = calendar === 'hijri' ? HIJRI_MONTHS : GREGORIAN_MONTHS;
  return [...names[locale]];
}

/**
 * The 7 weekday names, Sunday first (index matches `Date#getDay()`).
 * Returns a new array on every call.
 */
export function getWeekdayNames(
  locale: Locale,
  format: WeekdayFormat = 'long'
): string[] {
  return [...WEEKDAYS[locale][format]];
}

const ARABIC_INDIC_ZERO = 0x0660; // ٠

/** Replaces the Latin digits 0-9 with Arabic-Indic digits (٠-٩). */
export function toArabicDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (digit) =>
    String.fromCharCode(ARABIC_INDIC_ZERO + Number(digit))
  );
}

/** The default digits for a locale: Arabic-Indic for 'ar', Latin otherwise. */
export function defaultDigits(locale: Locale): Digits {
  return locale === 'ar' ? 'arabic' : 'latin';
}

/** Formats a number with the requested digits. */
export function formatNumber(value: number, digits: Digits): string {
  return digits === 'arabic' ? toArabicDigits(value) : String(value);
}
