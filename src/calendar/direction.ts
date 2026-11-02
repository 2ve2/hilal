import { I18nManager } from 'react-native';

import type { Locale } from '../core/locale';

/**
 * Whether the calendar reads right-to-left, and the flexDirection that
 * lays a row out in reading order. 'auto' reads right-to-left when the
 * app runs right-to-left or the locale is 'ar'.
 */
export function readingDirection(
  direction: 'rtl' | 'ltr' | 'auto',
  locale: Locale
): { rtl: boolean; row: 'row' | 'row-reverse' } {
  // React Native Web leaves I18nManager.isRTL undefined, not false.
  const appRTL = I18nManager.isRTL === true;
  const rtl =
    direction === 'rtl' ||
    (direction === 'auto' && (appRTL || locale === 'ar'));
  // React Native already mirrors 'row' when the whole app is RTL.
  return { rtl, row: rtl === appRTL ? 'row' : 'row-reverse' };
}
