import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HilalCalendar, type SelectedDate } from 'react-native-hilal';

export type Demo = {
  id: string;
  title: string;
  description: string;
  /** Whether the page should switch to its dark palette for this demo. */
  dark?: 'always' | 'auto';
  code: string;
  Component: () => React.JSX.Element;
};

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

function ControlledDemo() {
  const [date, setDate] = useState<SelectedDate>();
  return (
    <View>
      <HilalCalendar value={date?.gregorian} onChange={setDate} />
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
    title: 'Default',
    description:
      'Hijri grid, Arabic, Arabic-Indic digits, right-to-left, theme follows the system.',
    dark: 'auto',
    code: '<HilalCalendar />',
    Component: () => <HilalCalendar />,
  },
  {
    id: 'english',
    title: 'English',
    description: 'English names with Latin digits, laid out left-to-right.',
    dark: 'auto',
    code: '<HilalCalendar locale="en" />',
    Component: () => <HilalCalendar locale="en" />,
  },
  {
    id: 'dark',
    title: 'Dark',
    description: 'The built-in dark theme, regardless of the system setting.',
    dark: 'always',
    code: '<HilalCalendar theme="dark" />',
    Component: () => <HilalCalendar theme="dark" />,
  },
  {
    id: 'custom',
    title: 'Custom colors',
    description:
      'A partial theme is merged over the default, here with round days.',
    code: `<HilalCalendar
  theme={{
    background: '${sand.background}',
    primary: '${sand.primary}',
    today: '${sand.today}',
    border: '${sand.border}',
    radius: ${sand.radius},
  }}
/>`,
    Component: () => <HilalCalendar theme={sand} />,
  },
  {
    id: 'range',
    title: 'Min / max',
    description:
      'Only the next 30 days can be picked; the arrows stop at the edges.',
    dark: 'auto',
    code: `<HilalCalendar
  minDate={today}
  maxDate={in30Days}
/>`,
    Component: () => <HilalCalendar minDate={today} maxDate={in30Days} />,
  },
  {
    id: 'fridays',
    title: 'No Fridays',
    description:
      'isDateDisabled turns Fridays off; the week starts on Saturday and the grid is Gregorian.',
    dark: 'auto',
    code: `<HilalCalendar
  calendar="gregorian"
  firstDayOfWeek={6}
  isDateDisabled={({ gregorian }) =>
    gregorian.getDay() === 5
  }
/>`,
    Component: () => (
      <HilalCalendar
        calendar="gregorian"
        firstDayOfWeek={6}
        isDateDisabled={isFriday}
      />
    ),
  },
  {
    id: 'controlled',
    title: 'Controlled',
    description: 'The parent owns the value; everything onChange returns:',
    dark: 'auto',
    code: `const [date, setDate] = useState<SelectedDate>();

<HilalCalendar
  value={date?.gregorian}
  onChange={setDate}
/>`,
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
