<div align="center">

<img src="docs/assets/banner.png" alt="Hilal هلال" width="720" />

**A Hijri (Umm al-Qura) and Gregorian date picker for React Native.**
iOS, Android, web and Expo Go. Zero dependencies. Arabic-first.

[![npm version](https://img.shields.io/npm/v/react-native-hilal.svg)](https://www.npmjs.com/package/react-native-hilal)
[![CI](https://github.com/2ve2/hilal/actions/workflows/ci.yml/badge.svg)](https://github.com/2ve2/hilal/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<img src="docs/assets/demo.gif" alt="Hilal in action: switching between Hijri and Gregorian, picking a day, the month picker, English and a dark custom theme" width="380" />

</div>

## Features

- **Umm al-Qura**, the official calendar of Saudi Arabia, tested against ICU on every day from 1937 to 2077.
- **Hijri and Gregorian together**: switch the grid between them, and every day also shows its date in the other calendar.
- **Arabic-first**: Arabic month and day names, Arabic-Indic digits (`١٢٣`), proper right-to-left layout. English with Latin digits is one prop away.
- **Cross-platform**: pure TypeScript and React Native core components. The same code runs on iOS, Android, the web and in Expo Go, with no native modules.
- **Zero runtime dependencies**: no moment, no dayjs, no `Intl` calendars at runtime.
- **Customizable**: light, dark, follow the system, or your own colors and fonts; styles for every part and your own button texts.
- **Accessible**: every day is a button with a full spoken date, its selected and disabled state, and "today". Text follows the phone's text size within limits that keep the layout intact, and animations respect reduce motion.
- **The engine is public**: convert and format Hijri dates without using the UI.

## Installation

```sh
npm install react-native-hilal
# or
yarn add react-native-hilal
# or
npx expo install react-native-hilal
```

`react` and `react-native` are the only peer dependencies. There is nothing to link and no native build step.

Hilal is designed for phones first. On the web (React Native Web) it works the same, but text is drawn with the browser's fonts, so it can look slightly different.

## Quick start

```tsx
import { useState } from 'react';
import { Text, View } from 'react-native';
import { HilalCalendar, type SelectedDate } from 'react-native-hilal';

export default function Screen() {
  const [date, setDate] = useState<SelectedDate>();

  return (
    <View>
      <HilalCalendar value={date?.gregorian} onChange={setDate} />
      {date && (
        <Text>
          {date.formatted.hijri} · {date.formatted.gregorian}
        </Text>
      )}
    </View>
  );
}
```

`onChange` gives you both calendars at once. For 1 Ramadan 1446 with `locale="en"`:

```ts
{
  gregorian: Date,                       // Sat Mar 01 2025, local midnight
  hijri: { year: 1446, month: 9, day: 1 },
  formatted: { gregorian: '1 March 2025', hijri: '1 Ramadan 1446 AH' },
}
```

With the default `locale="ar"`, `formatted.hijri` is `'١ رمضان ١٤٤٦ هـ'` and `formatted.gregorian` is `'١ مارس ٢٠٢٥'`, in Arabic-Indic digits.

## Examples

```tsx
// English, Latin digits, left-to-right
<HilalCalendar locale="en" />

// Gregorian grid, week starting on Saturday
<HilalCalendar calendar="gregorian" firstDayOfWeek={6} />

// Only the next 30 days, no Fridays
<HilalCalendar
  minDate={today}
  maxDate={in30Days}
  isDateDisabled={({ gregorian }) => gregorian.getDay() === 5}
/>

// Dark theme, or your own colors on top of the light/dark default
<HilalCalendar theme="dark" />
<HilalCalendar theme={{ primary: '#B45309', radius: 24 }} />
```

The [example app](example) shows every feature side by side. Run it with `yarn example start` and open it in Expo Go.

## `<HilalCalendar />` props

| Prop                    | Type                                                 | Default                             | Description                                                                                                                                                             |
| ----------------------- | ---------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                 | `Date`                                               |                                     | Selected day (controlled). Only the local calendar day is used.                                                                                                         |
| `defaultValue`          | `Date`                                               |                                     | Initially selected day (uncontrolled).                                                                                                                                  |
| `onChange`              | `(date: SelectedDate) => void`                       |                                     | Called when the user picks a day.                                                                                                                                       |
| `calendar`              | `'hijri' \| 'gregorian'`                             | `'hijri'`                           | Calendar of the month grid. The grid follows this prop when it changes.                                                                                                 |
| `onCalendarChange`      | `(calendar) => void`                                 |                                     | Called when the user switches calendars with the toggle.                                                                                                                |
| `showCalendarToggle`    | `boolean`                                            | `true`                              | Show the Hijri / Gregorian toggle.                                                                                                                                      |
| `showSecondaryDate`     | `boolean`                                            | `true`                              | Show the other calendar's day under each day.                                                                                                                           |
| `locale`                | `'ar' \| 'en'`                                       | `'ar'`                              | Language of month names, weekdays and labels.                                                                                                                           |
| `digits`                | `'arabic' \| 'latin'`                                | `'arabic'` for `ar`, else `'latin'` | Arabic-Indic (`١٢٣`) or Latin (`123`) digits.                                                                                                                           |
| `direction`             | `'rtl' \| 'ltr' \| 'auto'`                           | `'auto'`                            | `auto` is right-to-left when the app is RTL (`I18nManager.isRTL`) or the locale is `ar`.                                                                                |
| `firstDayOfWeek`        | `0 \| 1 \| 6`                                        | `0`                                 | `0` Sunday, `1` Monday, `6` Saturday.                                                                                                                                   |
| `weekdayFormat`         | `'short' \| 'narrow'`                                | `'short'`                           | Weekday names above the days: `'أحد'` / `'Sun'`, or `'ح'` / `'S'`.                                                                                                      |
| `minDate`               | `Date`                                               |                                     | Earliest selectable day. Navigation stops at its month.                                                                                                                 |
| `maxDate`               | `Date`                                               |                                     | Latest selectable day. Navigation stops at its month.                                                                                                                   |
| `isDateDisabled`        | `(date: SelectedDate) => boolean`                    |                                     | Return `true` to disable a day.                                                                                                                                         |
| `hijriAdjustment`       | `number`                                             | `0`                                 | Shift Hijri dates by whole days, from `-2` to `2`. `1` makes every Hijri date one day later. See [Adjusting to local moon sighting](#adjusting-to-local-moon-sighting). |
| `showMonthYearPicker`   | `boolean`                                            | `true`                              | Pressing the month title opens a grid of months, and from there a grid of years.                                                                                        |
| `theme`                 | `'light' \| 'dark' \| 'auto' \| Partial<HilalTheme>` | `'auto'`                            | `auto` follows `useColorScheme()`. A partial theme is merged over the `auto` theme.                                                                                     |
| `styles`                | `HilalStyles`                                        |                                     | Styles for parts of the calendar. See [Customization](#customization).                                                                                                  |
| `labels`                | `HilalLabels`                                        |                                     | Texts of the toggle and buttons. See [Customization](#customization).                                                                                                   |
| `style`                 | `StyleProp<ViewStyle>`                               |                                     | Style of the outer container.                                                                                                                                           |
| `dayStyle`              | `StyleProp<ViewStyle>`                               |                                     | Style of every day cell. Unlike `styles.day`, it also wins over the selected and today styles.                                                                          |
| `maxFontSizeMultiplier` | `number`                                             | `1.3` in cells, `2` in the header   | How far the phone's text size setting may grow the text. `1` turns it off, `0` removes the limit.                                                                       |

Navigation never goes past `minDate`/`maxDate` or the edges of the supported range (1356–1500 AH), so the calendar can't show a broken month.

To jump far, for example to a date of birth, press the month title: it opens the 12 months of that year, the arrows change the year, and pressing the year opens a page of 12 years. Months and years with no selectable day are disabled. The grids fade in, keeping the calendar the same height, and switch without animation when the system asks to reduce motion. Turn the picker off with `showMonthYearPicker={false}`.

### Theme

```ts
type HilalTheme = {
  background: string; // calendar background
  text: string; // day numbers, month title
  textSecondary: string; // secondary dates, weekday names
  primary: string; // selected day, active toggle
  onPrimary: string; // text on primary
  today: string; // ring around today
  disabled: string; // disabled days and arrows
  border: string; // toggle outline
  radius: number; // corner radius of a day cell
  arrow?: string; // month arrows, default: text
  fontFamily?: string; // all text, default: the system font
  fontFamilyBold?: string; // bold text: title, selected day, today, weekdays, toggle, picker
  fontScale?: number; // multiplies every font size, default 1
};
```

`lightTheme` and `darkTheme` are exported if you want to build a full theme from one of them.

### Customization

Fonts go in the theme. Load them first (for example with `expo-font`) and pass their names. With `fontFamilyBold`, the bold text uses that font as it is, without a bold weight on top. `fontScale` makes all text larger or smaller, and day cells grow with larger text. Weekday names and the month and year names in the picker never grow, so they still fit their columns on small phones.

```tsx
<HilalCalendar
  theme={{
    fontFamily: 'Cairo-Regular',
    fontFamilyBold: 'Cairo-Bold',
    fontScale: 1.1,
    arrow: '#0F766E',
  }}
/>
```

For anything else, `styles` takes a style for each part, merged over the theme's styles:

```tsx
<HilalCalendar
  styles={{
    title: { fontSize: 20 },
    selectedDay: { borderRadius: 8 },
    weekdayText: { color: '#6B7280' },
  }}
/>
```

| Part                     | Slots                                                                        |
| ------------------------ | ---------------------------------------------------------------------------- |
| Container                | `container`                                                                  |
| Hijri / Gregorian toggle | `toggle`, `toggleOption`, `toggleText`                                       |
| Header                   | `header`, `title`, `subtitle`, `arrow`                                       |
| Weekday names            | `weekdayText`                                                                |
| Days                     | `day`, `dayText`, `secondaryDayText`                                         |
| Day states               | `selectedDay`, `selectedDayText`, `today`, `todayDayText`, `disabledDayText` |
| Month and year picker    | `pickerItem`, `pickerText`                                                   |

The day states apply to day cells only, not to the month and year picker.

`labels` replaces the texts of the toggle, and the names screen readers give the buttons. Labels you don't pass keep the locale's text:

```tsx
<HilalCalendar labels={{ hijri: 'هـ', gregorian: 'م' }} />
```

The keys are `hijri`, `gregorian`, `today`, `thisMonth`, `thisYear`, `previousMonth`, `nextMonth`, `previousYear`, `nextYear`, `previousYears`, `nextYears`, `chooseMonth` and `chooseYear`.

## Core API

The conversion engine is exported on its own: pure functions, no React.

```ts
import {
  toHijri,
  toGregorian,
  formatHijri,
  getHijriMonthLength,
} from 'react-native-hilal';

toHijri(new Date(2024, 6, 7)); // { year: 1446, month: 1, day: 1 }
toGregorian({ year: 1445, month: 9, day: 1 }); // Mon Mar 11 2024, local midnight
formatHijri({ year: 1446, month: 9, day: 1 }, { locale: 'en' }); // '1 Ramadan 1446 AH'
getHijriMonthLength(1446, 9); // 29
```

Without options, `formatHijri` returns `'١ رمضان ١٤٤٦ هـ'` (Arabic, Arabic-Indic digits).

| Function                                                  | Description                                                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `toHijri(date: Date, { adjustment? }): HijriDate`         | Hijri date of the local calendar day of `date`. The time of day is ignored.                                         |
| `toGregorian(hijri: HijriDate, { adjustment? }): Date`    | A `Date` at local midnight of the matching Gregorian day.                                                           |
| `getHijriMonthLength(year, month): 29 \| 30`              | Days in a Hijri month (`month` is 1–12).                                                                            |
| `isValidHijri(hijri: HijriDate): boolean`                 | Whether the date exists and is in the supported range.                                                              |
| `getSupportedRange(): { min: HijriDate; max: HijriDate }` | `1 Muharram 1356` to `30 Dhu al-Hijjah 1500`.                                                                       |
| `formatHijri(hijri, { locale?, digits? }): string`        | Arabic by default (`'١ رمضان ١٤٤٦ هـ'`), or `'1 Ramadan 1446 AH'` with `locale: 'en'`.                              |
| `getMonthNames(calendar, locale): string[]`               | 12 month names. Arabic Gregorian names use the Gulf style (`'يناير'`, `'فبراير'`, `'مارس'`), not the Levantine one. |
| `getWeekdayNames(locale, format?): string[]`              | 7 weekday names, Sunday first (matches `Date#getDay()`), `'long'`, `'short'` or `'narrow'`.                         |
| `toArabicDigits(input: string \| number): string`         | `'1446'` → `'١٤٤٦'`.                                                                                                |

`HijriDate` is `{ year: number; month: number; day: number }` with `month` from 1 to 12. Dates outside the supported range (1937-03-14 to 2077-11-16) throw a `RangeError`.

All types are exported too: `HilalCalendarProps`, `SelectedDate`, `HilalTheme`, `ThemeProp`, `HilalStyles`, `HilalLabels`, `HijriDate`, `HijriConversionOptions`, `FormatHijriOptions`, `CalendarType`, `Locale`, `Digits` and `WeekdayFormat`.

Dates are always handled as **local calendar days**. A day is never derived from a UTC timestamp, so the result doesn't depend on the time of day or the time zone offset.

## Why Hilal?

Other Hijri pickers for React Native tend to have at least one of these problems: they run on Android only or iOS only, they are no longer maintained, they depend on `moment`, or they only convert dates and ship no UI.

|                                        | Hilal                                                          |
| -------------------------------------- | -------------------------------------------------------------- |
| iOS, Android and web from one codebase | ✅ pure TypeScript, React Native core components only          |
| Runs in Expo Go                        | ✅ no native modules                                           |
| Runtime dependencies                   | ✅ none                                                        |
| Hijri calendar                         | ✅ Umm al-Qura, checked against ICU for every day of 1937–2077 |
| UI included                            | ✅ month grid, both calendars, themes, RTL, accessibility      |
| Use the engine without the UI          | ✅ `toHijri`, `toGregorian`, `formatHijri`, ...                |

## Accuracy

Hilal uses the **Umm al-Qura** calendar, the official calendar of Saudi Arabia. It is computed in advance, so the date of any day is known years ahead.

Religious occasions such as the start of Ramadan or Eid are announced from the actual sighting of the crescent moon (_hilal_), and can differ from the Umm al-Qura date by a day. Use Hilal for scheduling and display, and rely on the official announcement for religious observances.

### Adjusting to local moon sighting

Where months start a day before or after Umm al-Qura, shift the Hijri calendar by whole days, from `-2` to `2`:

```tsx
// The month started a day earlier here: Umm al-Qura's 29 Sha'ban 1445
// (10 March 2024) shows as 1 Ramadan 1445.
<HilalCalendar hijriAdjustment={1} />
```

```ts
toHijri(new Date(2024, 2, 10), { adjustment: 1 }); // { year: 1445, month: 9, day: 1 }
toGregorian({ year: 1445, month: 9, day: 1 }, { adjustment: 1 }); // Sun Mar 10 2024
```

Gregorian dates never change. The shift moves the whole calendar, so months keep their Umm al-Qura lengths: a month of 29 days stays 29 days. This is the common approach in Islamic apps, and it matches a local calendar that runs a fixed number of days ahead of or behind Umm al-Qura.

### How the Umm al-Qura table is made and verified

- **Generated, not copied.** [`scripts/generate-umalqura-table.ts`](scripts/generate-umalqura-table.ts) reads the `islamic-umalqura` calendar from Node's built-in ICU and writes [`src/core/umalqura-data.ts`](src/core/umalqura-data.ts). Run `yarn generate:umalqura` to rebuild it.
- **Compact.** The table is one 12-bit number per Hijri year (bit set means a 30-day month), plus the start day of 1 Muharram 1356: 145 numbers, about 1.5 KB.
- **No `Intl` at runtime.** Support for the `islamic-umalqura` calendar differs between Hermes versions and platforms, so the library only reads the table.
- **Tested day by day.** The test suite compares `toHijri` with ICU for all 51,383 days in the range, at 00:00 and 23:59, and checks every month length and the round trip `toGregorian(toHijri(d)) === d`, also for every Hijri adjustment. The suite runs in a UTC+14 time zone, so any code that takes the day from a UTC timestamp fails.

## Roadmap

Planned next:

- Range selection
- Event dots on days
- Swipe between months
- Ready-made bottom sheet and modal variants

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow, commit conventions and how to send a pull request. To report a security issue, see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2ve2
