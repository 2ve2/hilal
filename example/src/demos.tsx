import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  HilalCalendar,
  type Locale,
  type SelectedDate,
} from 'react-native-hilal';

export type Demo = {
  id: string;
  title: (locale: Locale) => string;
  description: (locale: Locale) => string;
  /** Whether the page should switch to its dark palette for this demo. */
  dark?: 'always' | 'auto';
  /** The JSX shown under the demo, for the page's language. */
  code: (locale: Locale) => string;
  Component: (props: { locale: Locale }) => React.JSX.Element;
};

/**
 * `<HilalCalendar ... />` with the given props, plus `locale="en"` when the
 * page is in English (Arabic is the default and needs no prop).
 */
function jsx(locale: Locale, props: string[] = []) {
  const all = locale === 'en' ? ['locale="en"', ...props] : props;
  if (all.length === 0) {
    return '<HilalCalendar />';
  }
  if (all.length === 1 && !all[0]!.includes('\n')) {
    return `<HilalCalendar ${all[0]} />`;
  }
  const lines = all.map((prop) => `  ${prop.replace(/\n/g, '\n  ')}`);
  return `<HilalCalendar\n${lines.join('\n')}\n/>`;
}

const other = (locale: Locale): Locale => (locale === 'ar' ? 'en' : 'ar');

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

const today = startOfToday();
const in30Days = addDays(today, 30);

const isFriday = ({ gregorian }: SelectedDate) => gregorian.getDay() === 5;

const sand = {
  background: '#FFF8EC',
  primary: '#B45309',
  today: '#B45309',
  border: '#F1DFC0',
  radius: 24,
};

function ControlledDemo({ locale }: { locale: Locale }) {
  const [date, setDate] = useState<SelectedDate>();
  return (
    <View>
      <HilalCalendar
        locale={locale}
        value={date?.gregorian}
        onChange={setDate}
      />
      <View style={styles.output}>
        {date ? (
          <>
            <Output label="formatted.hijri" value={date.formatted.hijri} />
            <Output
              label="formatted.gregorian"
              value={date.formatted.gregorian}
            />
            <Output label="hijri" value={JSON.stringify(date.hijri)} />
            <Output label="gregorian" value={date.gregorian.toDateString()} />
          </>
        ) : (
          <Text style={styles.placeholder}>Pick a day to see the value</Text>
        )}
      </View>
    </View>
  );
}

function Output({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.outputRow}>
      <Text style={styles.outputLabel}>{label}</Text>
      <Text style={styles.outputValue}>{value}</Text>
    </View>
  );
}

export const DEMOS: Demo[] = [
  {
    id: 'default',
    title: () => 'Default',
    description: (locale) =>
      locale === 'ar'
        ? 'Hijri grid, Arabic, Arabic-Indic digits, right-to-left, theme follows the system.'
        : 'Hijri grid, English names, Latin digits, theme follows the system.',
    dark: 'auto',
    code: (locale) => jsx(locale),
    Component: ({ locale }) => <HilalCalendar locale={locale} />,
  },
  {
    // The other language: English on the Arabic page, Arabic on the English
    // page.
    id: 'language',
    title: (locale) => (locale === 'ar' ? 'English' : 'Arabic'),
    description: (locale) =>
      locale === 'ar'
        ? 'English names with Latin digits, laid out left-to-right.'
        : 'Arabic names with Arabic-Indic digits, laid out right-to-left.',
    dark: 'auto',
    code: (locale) => `<HilalCalendar locale="${other(locale)}" />`,
    Component: ({ locale }) => <HilalCalendar locale={other(locale)} />,
  },
  {
    id: 'dark',
    title: () => 'Dark',
    description: () =>
      'The built-in dark theme, regardless of the system setting.',
    dark: 'always',
    code: (locale) => jsx(locale, ['theme="dark"']),
    Component: ({ locale }) => <HilalCalendar locale={locale} theme="dark" />,
  },
  {
    id: 'custom',
    title: () => 'Custom colors',
    description: () =>
      'A partial theme is merged over the default, here with round days.',
    code: (locale) =>
      jsx(locale, [
        `theme={{
  background: '${sand.background}',
  primary: '${sand.primary}',
  today: '${sand.today}',
  border: '${sand.border}',
  radius: ${sand.radius},
}}`,
      ]),
    Component: ({ locale }) => <HilalCalendar locale={locale} theme={sand} />,
  },
  {
    id: 'range',
    title: () => 'Min / max',
    description: () =>
      'Only the next 30 days can be picked; the arrows stop at the edges.',
    dark: 'auto',
    code: (locale) => jsx(locale, ['minDate={today}', 'maxDate={in30Days}']),
    Component: ({ locale }) => (
      <HilalCalendar locale={locale} minDate={today} maxDate={in30Days} />
    ),
  },
  {
    id: 'fridays',
    title: () => 'No Fridays',
    description: () =>
      'isDateDisabled turns Fridays off; the week starts on Saturday and the grid is Gregorian.',
    dark: 'auto',
    code: (locale) =>
      jsx(locale, [
        'calendar="gregorian"',
        'firstDayOfWeek={6}',
        `isDateDisabled={({ gregorian }) =>
  gregorian.getDay() === 5
}`,
      ]),
    Component: ({ locale }) => (
      <HilalCalendar
        locale={locale}
        calendar="gregorian"
        firstDayOfWeek={6}
        isDateDisabled={isFriday}
      />
    ),
  },
  {
    id: 'controlled',
    title: () => 'Controlled',
    description: () =>
      'The parent owns the value; everything onChange returns:',
    dark: 'auto',
    code: (locale) =>
      `const [date, setDate] = useState<SelectedDate>();\n\n` +
      jsx(locale, ['value={date?.gregorian}', 'onChange={setDate}']),
    Component: ControlledDemo,
  },
];

const styles = StyleSheet.create({
  output: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    gap: 8,
    marginTop: 12,
    padding: 14,
  },
  outputRow: {
    gap: 2,
  },
  outputLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  outputValue: {
    color: '#F8FAFC',
    fontSize: 15,
    textAlign: 'left',
  },
  placeholder: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
});
