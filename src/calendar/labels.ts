import { useMemo } from 'react';

import type { Locale } from '../core/locale';
import type { HilalLabels } from './types';

/** The texts of each locale, and the separator of spoken labels. */
export const LABELS: Record<
  Locale,
  Required<HilalLabels> & { separator: string }
> = {
  ar: {
    hijri: 'هجري',
    gregorian: 'ميلادي',
    today: 'اليوم',
    rangeStart: 'بداية الفترة',
    rangeEnd: 'نهاية الفترة',
    thisMonth: 'هذا الشهر',
    thisYear: 'هذه السنة',
    previousMonth: 'الشهر السابق',
    nextMonth: 'الشهر التالي',
    previousYear: 'السنة السابقة',
    nextYear: 'السنة التالية',
    previousYears: 'السنوات السابقة',
    nextYears: 'السنوات التالية',
    chooseMonth: 'اختر الشهر والسنة',
    chooseYear: 'اختر السنة',
    done: 'تم',
    cancel: 'إلغاء',
    close: 'إغلاق',
    separator: '، ',
  },
  en: {
    hijri: 'Hijri',
    gregorian: 'Gregorian',
    today: 'Today',
    rangeStart: 'Start of range',
    rangeEnd: 'End of range',
    thisMonth: 'This month',
    thisYear: 'This year',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    previousYear: 'Previous year',
    nextYear: 'Next year',
    previousYears: 'Previous years',
    nextYears: 'Next years',
    chooseMonth: 'Choose month and year',
    chooseYear: 'Choose year',
    done: 'Done',
    cancel: 'Cancel',
    close: 'Close',
    separator: ', ',
  },
};

/**
 * The locale's texts with `labels` merged over them. A label left
 * undefined keeps the default. An inline `labels` object is compared by
 * value, so it doesn't recompute every day.
 */
export function useLabels(locale: Locale, labels: HilalLabels | undefined) {
  const key = JSON.stringify(labels);
  return useMemo(
    () => {
      const merged = { ...LABELS[locale] };
      for (const [name, text] of Object.entries(labels ?? {})) {
        if (text !== undefined) {
          merged[name as keyof HilalLabels] = text;
        }
      }
      return merged;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, key]
  );
}
