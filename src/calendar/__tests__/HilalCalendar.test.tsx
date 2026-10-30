import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react-native';
import { AccessibilityInfo, I18nManager, StyleSheet } from 'react-native';

import { HilalCalendar } from '../HilalCalendar';
import { lightTheme } from '../theme';
import type { SelectedDate } from '../types';

// 25 March 2024 = 15 Ramadan 1445. Ramadan 1445 runs 11 March - 9 April.
const MARCH_25 = new Date(2024, 2, 25);

const day = (name: string | RegExp) => screen.getByRole('button', { name });
const header = () => screen.getByRole('header');

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2024, 2, 20, 10, 30) }); // 10 Ramadan
});

afterEach(() => {
  jest.useRealTimers();
});

describe('HilalCalendar', () => {
  it('shows the Hijri month of the selected day with the overlapped months', async () => {
    await render(<HilalCalendar defaultValue={MARCH_25} />);
    expect(header()).toHaveTextContent('رمضان ١٤٤٥');
    expect(screen.getByText('مارس – أبريل ٢٠٢٤')).toBeOnTheScreen();
    expect(screen.getByText('أحد')).toBeOnTheScreen(); // weekday header
  });

  it('gives every day a full spoken date and button semantics', async () => {
    await render(<HilalCalendar defaultValue={MARCH_25} />);
    const first = day('الاثنين، ١ رمضان ١٤٤٥ هـ، ١١ مارس ٢٠٢٤');
    expect(first).toBeEnabled();
    expect(first).not.toBeSelected();
    expect(day(/^الاثنين، ١٥ رمضان/)).toBeSelected();
  });

  it('calls onChange with both dates when a day is selected', async () => {
    const onChange = jest.fn<(date: SelectedDate) => void>();
    await render(<HilalCalendar onChange={onChange} />);

    await fireEvent.press(day(/^الثلاثاء، ١٦ رمضان/));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      gregorian: new Date(2024, 2, 26),
      hijri: { year: 1445, month: 9, day: 16 },
      formatted: {
        gregorian: '٢٦ مارس ٢٠٢٤',
        hijri: '١٦ رمضان ١٤٤٥ هـ',
      },
    });
    expect(day(/^الثلاثاء، ١٦ رمضان/)).toBeSelected();
  });

  it('highlights today', async () => {
    await render(<HilalCalendar />);
    expect(day(/^الأربعاء، ١٠ رمضان/)).toHaveStyle({
      borderColor: lightTheme.today,
    });
    expect(day(/^الخميس، ١١ رمضان/)).not.toHaveStyle({
      borderColor: lightTheme.today,
    });
  });

  it('does not select disabled days', async () => {
    const onChange = jest.fn();
    await render(
      <HilalCalendar
        onChange={onChange}
        isDateDisabled={({ gregorian }) => gregorian.getDay() === 5}
        minDate={new Date(2024, 2, 14)}
      />
    );

    const friday = day(/^الجمعة، ٥ رمضان/);
    const beforeMin = day(/^الأربعاء، ٣ رمضان/);
    expect(friday).toBeDisabled();
    expect(beforeMin).toBeDisabled();
    await fireEvent.press(friday);
    await fireEvent.press(beforeMin);
    expect(onChange).not.toHaveBeenCalled();
    expect(friday).not.toBeSelected();

    expect(day(/^الخميس، ٤ رمضان/)).toBeEnabled();
  });

  it('switches the grid between calendars and keeps the selected day', async () => {
    const onCalendarChange = jest.fn();
    await render(
      <HilalCalendar
        defaultValue={MARCH_25}
        onCalendarChange={onCalendarChange}
      />
    );

    await fireEvent.press(screen.getByRole('button', { name: 'ميلادي' }));

    expect(onCalendarChange).toHaveBeenCalledWith('gregorian');
    expect(header()).toHaveTextContent('مارس ٢٠٢٤');
    expect(screen.getByText('شعبان – رمضان ١٤٤٥')).toBeOnTheScreen();
    // Gregorian first in the label now, and still selected.
    expect(day(/^الاثنين، ٢٥ مارس ٢٠٢٤، ١٥ رمضان/)).toBeSelected();
    expect(
      screen.getByRole('button', { name: 'ميلادي', selected: true })
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'هجري' }));
    expect(header()).toHaveTextContent('رمضان ١٤٤٥');
  });

  it('follows the calendar prop', async () => {
    const { rerender } = await render(
      <HilalCalendar defaultValue={MARCH_25} calendar="gregorian" />
    );
    expect(header()).toHaveTextContent('مارس ٢٠٢٤');
    await rerender(<HilalCalendar defaultValue={MARCH_25} calendar="hijri" />);
    expect(header()).toHaveTextContent('رمضان ١٤٤٥');
  });

  it('renders English with Latin digits', async () => {
    await render(<HilalCalendar defaultValue={MARCH_25} locale="en" />);
    expect(header()).toHaveTextContent('Ramadan 1445');
    expect(screen.getByText('March – April 2024')).toBeOnTheScreen();
    expect(day('Monday, 1 Ramadan 1445 AH, 11 March 2024')).toBeOnTheScreen();
  });

  it('hides the toggle and secondary dates when asked', async () => {
    await render(
      <HilalCalendar
        defaultValue={MARCH_25}
        showCalendarToggle={false}
        showSecondaryDate={false}
      />
    );
    expect(screen.queryByText('ميلادي')).toBeNull();
    // Day 1 of Ramadan is 11 March; without secondary dates no "١١" sits
    // under it (the only "١١" left is the 11th of Ramadan itself).
    expect(screen.getAllByText('١١')).toHaveLength(1);
  });

  describe('direction', () => {
    const arrows = () => ({
      previous: screen.getByRole('button', { name: /السابق|Previous/ }),
      next: screen.getByRole('button', { name: /التالي|Next/ }),
    });
    // Which way the drawn chevron inside an arrow button points.
    const points = (button: ReturnType<typeof screen.getByRole>) => {
      const { queryByTestId } = within(button);
      if (queryByTestId('hilal-chevron-left')) return 'left';
      if (queryByTestId('hilal-chevron-right')) return 'right';
      return 'none';
    };
    const flexDirection = () =>
      StyleSheet.flatten(screen.getByTestId('hilal-header').props.style)
        .flexDirection;

    it('lays out right-to-left for Arabic', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      // Previous sits on the right and points right.
      expect(flexDirection()).toBe('row-reverse');
      expect(points(arrows().previous)).toBe('right');
      expect(points(arrows().next)).toBe('left');
    });

    it('lays out left-to-right for English', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} locale="en" />);
      expect(flexDirection()).toBe('row');
      expect(points(arrows().previous)).toBe('left');
      expect(points(arrows().next)).toBe('right');
    });

    it('lets direction override the locale', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} direction="ltr" />);
      expect(flexDirection()).toBe('row');
      expect(points(arrows().previous)).toBe('left');
    });

    describe('app direction (I18nManager.isRTL)', () => {
      const original = Object.getOwnPropertyDescriptor(I18nManager, 'isRTL');
      const setAppRTL = (value: boolean | undefined) =>
        Object.defineProperty(I18nManager, 'isRTL', {
          configurable: true,
          get: () => value,
        });
      afterEach(() => {
        Object.defineProperty(I18nManager, 'isRTL', original!);
      });

      it('treats undefined (React Native Web) as left-to-right', async () => {
        setAppRTL(undefined);
        await render(<HilalCalendar defaultValue={MARCH_25} locale="en" />);
        expect(flexDirection()).toBe('row');
        expect(points(arrows().previous)).toBe('left');
      });

      it('relies on React Native mirroring rows in an RTL app', async () => {
        setAppRTL(true);
        await render(<HilalCalendar defaultValue={MARCH_25} />);
        // 'row' is already right-to-left in an RTL app.
        expect(flexDirection()).toBe('row');
        expect(points(arrows().previous)).toBe('right');
      });

      it('reverses rows for an LTR calendar in an RTL app', async () => {
        setAppRTL(true);
        await render(<HilalCalendar defaultValue={MARCH_25} direction="ltr" />);
        expect(flexDirection()).toBe('row-reverse');
        expect(points(arrows().previous)).toBe('left');
      });
    });
  });

  describe('navigation', () => {
    const previous = () => screen.getByRole('button', { name: 'الشهر السابق' });
    const next = () => screen.getByRole('button', { name: 'الشهر التالي' });

    it('moves between months', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      await fireEvent.press(next());
      expect(header()).toHaveTextContent('شوال ١٤٤٥');
      await fireEvent.press(previous());
      await fireEvent.press(previous());
      expect(header()).toHaveTextContent('شعبان ١٤٤٥');
    });

    it('stops at minDate and maxDate', async () => {
      await render(
        <HilalCalendar
          defaultValue={MARCH_25}
          minDate={new Date(2024, 2, 12)}
          maxDate={new Date(2024, 3, 12)}
        />
      );
      expect(previous()).toBeDisabled();
      await fireEvent.press(previous());
      expect(header()).toHaveTextContent('رمضان ١٤٤٥');

      await fireEvent.press(next()); // Shawwal starts 10 April
      expect(header()).toHaveTextContent('شوال ١٤٤٥');
      expect(next()).toBeDisabled();
    });

    it('stops at the end of the supported range without crashing', async () => {
      await render(
        <HilalCalendar
          defaultValue={new Date(2077, 10, 16)}
          calendar="gregorian"
        />
      );
      expect(header()).toHaveTextContent('نوفمبر ٢٠٧٧');
      expect(next()).toBeDisabled();
      // 17 November 2077 has no Umm al-Qura date: shown but disabled.
      expect(day(/١٧ نوفمبر ٢٠٧٧$/)).toBeDisabled();
      expect(day(/^الثلاثاء، ١٦ نوفمبر ٢٠٧٧، ٣٠ ذو الحجة ١٥٠٠/)).toBeEnabled();
    });

    it('stops at the start of the supported range', async () => {
      await render(<HilalCalendar defaultValue={new Date(1900, 0, 1)} />);
      expect(header()).toHaveTextContent('محرم ١٣٥٦');
      expect(previous()).toBeDisabled();
    });
  });

  describe('hijriAdjustment', () => {
    // Umm al-Qura: 1 Ramadan 1445 is Monday 11 March 2024.
    it('moves Hijri dates one day earlier with 1', async () => {
      const onChange = jest.fn<(date: SelectedDate) => void>();
      await render(
        <HilalCalendar
          defaultValue={new Date(2024, 2, 10)}
          hijriAdjustment={1}
          onChange={onChange}
        />
      );
      expect(header()).toHaveTextContent('رمضان ١٤٤٥');
      expect(day('الأحد، ١ رمضان ١٤٤٥ هـ، ١٠ مارس ٢٠٢٤')).toBeSelected();

      await fireEvent.press(day(/^الاثنين، ٢ رمضان/));
      expect(onChange).toHaveBeenCalledWith({
        gregorian: new Date(2024, 2, 11),
        hijri: { year: 1445, month: 9, day: 2 },
        formatted: { gregorian: '١١ مارس ٢٠٢٤', hijri: '٢ رمضان ١٤٤٥ هـ' },
      });
    });

    it('moves Hijri dates one day later with -1', async () => {
      await render(
        <HilalCalendar defaultValue={MARCH_25} hijriAdjustment={-1} />
      );
      expect(day('الثلاثاء، ١ رمضان ١٤٤٥ هـ، ١٢ مارس ٢٠٢٤')).toBeOnTheScreen();
      // Sha'ban keeps its 29 days: 11 March is now 29 Sha'ban.
      await fireEvent.press(
        screen.getByRole('button', { name: 'الشهر السابق' })
      );
      expect(header()).toHaveTextContent('شعبان ١٤٤٥');
      expect(day('الاثنين، ٢٩ شعبان ١٤٤٥ هـ، ١١ مارس ٢٠٢٤')).toBeOnTheScreen();
    });

    it('shifts the secondary dates of the Gregorian grid', async () => {
      await render(
        <HilalCalendar
          defaultValue={MARCH_25}
          calendar="gregorian"
          locale="en"
          hijriAdjustment={1}
        />
      );
      expect(header()).toHaveTextContent('March 2024');
      expect(day('Sunday, 10 March 2024, 1 Ramadan 1445 AH')).toBeEnabled();
    });

    it('moves the edges of the supported range', async () => {
      await render(
        <HilalCalendar
          defaultValue={new Date(2077, 10, 14)}
          calendar="gregorian"
          locale="en"
          hijriAdjustment={2}
        />
      );
      // With +2, 30 Dhu al-Hijjah 1500 is 14 November 2077.
      expect(day(/14 November 2077, 30 Dhu al-Hijjah 1500 AH$/)).toBeEnabled();
      expect(day(/15 November 2077$/)).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    });

    it('rejects values that are not an integer from -2 to 2', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      await expect(
        render(<HilalCalendar hijriAdjustment={3} />)
      ).rejects.toThrow(/integer from -2 to 2/);
      consoleError.mockRestore();
    });
  });

  describe('month and year picker', () => {
    const button = (name: string | RegExp) =>
      screen.getByRole('button', { name });
    const openMonths = () => fireEvent.press(button(/^اختر الشهر والسنة/));

    it('opens the months of the year from the title', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      expect(button('اختر الشهر والسنة، رمضان ١٤٤٥')).toBeOnTheScreen();

      await openMonths();
      expect(header()).toHaveTextContent('١٤٤٥');
      expect(screen.getByText('٢٠٢٣ – ٢٠٢٤')).toBeOnTheScreen();
      expect(screen.queryByText('أحد')).toBeNull(); // no weekday row
      // The 12 months, not counting the "choose year" title button.
      expect(button('رمضان ١٤٤٥، هذا الشهر')).toBeSelected();
      expect(button('محرم ١٤٤٥')).toBeEnabled();
      expect(
        screen.getAllByRole('button', { name: /^[^،]+ ١٤٤٥(، هذا الشهر)?$/ })
      ).toHaveLength(12);
    });

    it('shows the days of the month that is picked', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      await openMonths();
      await fireEvent.press(button('محرم ١٤٤٥'));
      expect(header()).toHaveTextContent('محرم ١٤٤٥');
      expect(screen.getByText('أحد')).toBeOnTheScreen();
    });

    it('changes the year with the arrows', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      await openMonths();
      await fireEvent.press(button('السنة التالية'));
      expect(header()).toHaveTextContent('١٤٤٦');
      expect(button('رمضان ١٤٤٦')).not.toBeSelected();
      await fireEvent.press(button('شوال ١٤٤٦'));
      expect(header()).toHaveTextContent('شوال ١٤٤٦');
    });

    it('jumps across years with the year grid', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      await openMonths();
      await fireEvent.press(button('اختر السنة، ١٤٤٥'));
      expect(header()).toHaveTextContent('١٤٤٠ – ١٤٥١');
      expect(button('١٤٤٥، هذه السنة')).toBeSelected();

      await fireEvent.press(button('السنوات التالية'));
      expect(header()).toHaveTextContent('١٤٥٢ – ١٤٦٣');
      await fireEvent.press(button('١٤٦٠'));
      expect(header()).toHaveTextContent('١٤٦٠');
      await fireEvent.press(button('رجب ١٤٦٠'));
      expect(header()).toHaveTextContent('رجب ١٤٦٠');
    });

    it('rings the current month', async () => {
      // Today is 10 Ramadan 1445 (fake timers); the selection is in Rajab.
      await render(<HilalCalendar defaultValue={new Date(2024, 0, 20)} />);
      await openMonths();
      expect(button('رجب ١٤٤٥')).toBeSelected();
      expect(button('رمضان ١٤٤٥، هذا الشهر')).toHaveStyle({
        borderColor: lightTheme.today,
      });
      expect(button('شوال ١٤٤٥')).not.toHaveStyle({
        borderColor: lightTheme.today,
      });
    });

    it('disables months and years outside minDate and maxDate', async () => {
      await render(
        <HilalCalendar
          defaultValue={MARCH_25}
          minDate={new Date(2024, 2, 20)}
          maxDate={new Date(2024, 4, 2)}
        />
      );
      await openMonths();
      // 20 March - 2 May 2024 touches Ramadan and Shawwal 1445 only.
      expect(button('رمضان ١٤٤٥، هذا الشهر')).toBeEnabled();
      expect(button('شوال ١٤٤٥')).toBeEnabled();
      expect(button('شعبان ١٤٤٥')).toBeDisabled();
      expect(button('ذو القعدة ١٤٤٥')).toBeDisabled();
      expect(button('السنة السابقة')).toBeDisabled();
      expect(button('السنة التالية')).toBeDisabled();

      await fireEvent.press(button('اختر السنة، ١٤٤٥'));
      expect(button('١٤٤٥، هذه السنة')).toBeEnabled();
      expect(button('١٤٤٤')).toBeDisabled();
      expect(button('السنوات السابقة')).toBeDisabled();
      expect(button('السنوات التالية')).toBeDisabled();
    });

    it('stops at the edges of the supported range', async () => {
      await render(<HilalCalendar defaultValue={new Date(1937, 2, 20)} />);
      await openMonths();
      expect(header()).toHaveTextContent('١٣٥٦');
      expect(button('السنة السابقة')).toBeDisabled();
      await fireEvent.press(button('اختر السنة، ١٣٥٦'));
      expect(header()).toHaveTextContent('١٣٥٦ – ١٣٦٧');
      expect(button('السنوات السابقة')).toBeDisabled();
    });

    it('works with the Gregorian grid', async () => {
      await render(
        <HilalCalendar defaultValue={MARCH_25} calendar="gregorian" />
      );
      await fireEvent.press(button('اختر الشهر والسنة، مارس ٢٠٢٤'));
      expect(header()).toHaveTextContent('٢٠٢٤');
      expect(screen.getByText('١٤٤٥ – ١٤٤٦')).toBeOnTheScreen();
      expect(button('مارس ٢٠٢٤، هذا الشهر')).toBeSelected();
      await fireEvent.press(button('يوليو ٢٠٢٤'));
      expect(header()).toHaveTextContent('يوليو ٢٠٢٤');
    });

    it('speaks English', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} locale="en" />);
      await fireEvent.press(button('Choose month and year, Ramadan 1445'));
      expect(button('Ramadan 1445, This month')).toBeSelected();
      await fireEvent.press(button('Choose year, 1445'));
      expect(header()).toHaveTextContent('1440 – 1451');
      expect(button('Next years')).toBeEnabled();
    });

    it('goes back to the days when the calendar is switched', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      await openMonths();
      await fireEvent.press(button('ميلادي'));
      expect(header()).toHaveTextContent('مارس ٢٠٢٤');
      expect(screen.getByText('أحد')).toBeOnTheScreen();
    });

    it('lays the grids out right-to-left in Arabic', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      await openMonths();
      const rowOf = (name: string) =>
        StyleSheet.flatten(button(name).parent!.parent!.props.style)
          .flexDirection;
      expect(rowOf('محرم ١٤٤٥')).toBe('row-reverse');
    });

    it('can be turned off', async () => {
      await render(
        <HilalCalendar defaultValue={MARCH_25} showMonthYearPicker={false} />
      );
      expect(
        screen.queryByRole('button', { name: /اختر الشهر والسنة/ })
      ).toBeNull();
      expect(header()).toHaveTextContent('رمضان ١٤٤٥');
    });
  });

  describe('controlled', () => {
    it('shows `value` and leaves selection to the parent', async () => {
      const onChange = jest.fn();
      const { rerender } = await render(
        <HilalCalendar value={MARCH_25} onChange={onChange} />
      );
      await fireEvent.press(day(/^الثلاثاء، ١٦ رمضان/));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(day(/^الاثنين، ١٥ رمضان/)).toBeSelected();
      expect(day(/^الثلاثاء، ١٦ رمضان/)).not.toBeSelected();

      // A new value in another month brings that month into view.
      await rerender(
        <HilalCalendar value={new Date(2024, 6, 7)} onChange={onChange} />
      );
      expect(header()).toHaveTextContent('محرم ١٤٤٦');
      expect(day(/^الأحد، ١ محرم ١٤٤٦/)).toBeSelected();
    });
  });

  describe('switching views', () => {
    const openMonths = () =>
      fireEvent.press(
        screen.getByRole('button', { name: /^اختر الشهر والسنة/ })
      );
    // The view wrappers: around the weekday row and weeks, or the picker.
    const daysView = () => screen.getByText('أحد').parent!.parent!;
    const flat = (element: { props: { style?: unknown } }) =>
      StyleSheet.flatten(element.props.style as object) ?? {};
    const pickerView = () =>
      screen.getByRole('button', { name: 'رمضان ١٤٤٥، هذا الشهر' }).parent!
        .parent!.parent!.parent!;

    it("doesn't animate the days when the calendar appears", async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      expect(flat(daysView())).not.toHaveProperty('opacity');
    });

    it('fades the picker in, then the days when going back', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      await openMonths();
      expect(pickerView()).toHaveStyle({ opacity: 0 });

      await fireEvent.press(screen.getByRole('button', { name: 'شوال ١٤٤٥' }));
      expect(header()).toHaveTextContent('شوال ١٤٤٥');
      expect(daysView()).toHaveStyle({ opacity: 0 });
    });

    it('plays the fade again from months to years', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      await openMonths();
      const months = pickerView();

      await fireEvent.press(
        screen.getByRole('button', { name: /^اختر السنة/ })
      );
      const years = screen.getByRole('button', { name: '١٤٤٥، هذه السنة' })
        .parent!.parent!.parent!.parent!;
      // A new wrapper, so its fade starts over.
      expect(years).not.toBe(months);
      expect(years).toHaveStyle({ opacity: 0 });
    });

    it("doesn't animate when the system reduces motion", async () => {
      jest
        .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
        .mockResolvedValueOnce(true);
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      await openMonths();
      expect(flat(pickerView())).not.toHaveProperty('opacity');
    });

    it('keeps the height of the days when the picker opens', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      await fireEvent(daysView(), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 312 } },
      });
      await openMonths();
      expect(pickerView()).toHaveStyle({ minHeight: 312 });
      // The rows and buttons grow to fill it.
      const ramadan = screen.getByRole('button', {
        name: 'رمضان ١٤٤٥، هذا الشهر',
      });
      expect(ramadan).toHaveStyle({ flexGrow: 1 });
      expect(ramadan.parent!.parent).toHaveStyle({ flexGrow: 1 });
    });

    it('shows the title button without a caret', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      const title = screen.getByRole('button', {
        name: 'اختر الشهر والسنة، رمضان ١٤٤٥',
      });
      expect(title).toHaveTextContent('رمضان ١٤٤٥', { exact: true });
      expect(screen.queryByText('▾')).toBeNull();
    });

    it('keeps the header height when the years open', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      await openMonths();
      await fireEvent.press(
        screen.getByRole('button', { name: /^اختر السنة/ })
      );
      // The same vertical padding as the title button of the other views.
      expect(header().parent).toHaveStyle({ paddingVertical: 2 });
    });

    it('lays the picker out by its content before the days are measured', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} />);
      await openMonths();
      const ramadan = screen.getByRole('button', {
        name: 'رمضان ١٤٤٥، هذا الشهر',
      });
      expect(flat(ramadan)).not.toHaveProperty('flexGrow');
    });
  });

  describe('weekdayFormat', () => {
    // The texts of the weekday row, first column first.
    const weekdayRow = (anyName: string) =>
      screen
        .getAllByText(anyName)[0]!
        .parent!.children.map((text) =>
          typeof text === 'string' ? text : text.props.children
        );

    it('shows short names by default', async () => {
      await render(<HilalCalendar defaultValue={MARCH_25} locale="en" />);
      expect(weekdayRow('Sun')).toEqual([
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
      ]);
    });

    it('shows narrow names, repeated letters included', async () => {
      await render(
        <HilalCalendar
          defaultValue={MARCH_25}
          locale="en"
          weekdayFormat="narrow"
          firstDayOfWeek={1}
        />
      );
      expect(weekdayRow('M')).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
    });
  });

  describe('styles', () => {
    it('merges each slot into its part of the calendar', async () => {
      await render(
        <HilalCalendar
          defaultValue={MARCH_25}
          minDate={new Date(2024, 2, 14)}
          styles={{
            toggle: { borderColor: '#000001' },
            toggleOption: { paddingHorizontal: 21 },
            toggleText: { fontSize: 11 },
            header: { marginBottom: 21 },
            title: { color: '#000002' },
            subtitle: { color: '#000003' },
            arrow: { width: 41 },
            weekdayText: { color: '#000004' },
            day: { height: 51 },
            dayText: { fontSize: 19 },
            secondaryDayText: { fontSize: 9 },
            selectedDay: { borderRadius: 2 },
            selectedDayText: { fontWeight: '900' },
            today: { borderColor: '#000005' },
            disabledDayText: { color: '#000006' },
          }}
        />
      );
      const toggleOption = screen.getByRole('button', { name: 'هجري' });
      expect(toggleOption).toHaveStyle({ paddingHorizontal: 21 });
      expect(toggleOption.parent).toHaveStyle({ borderColor: '#000001' });
      expect(screen.getByText('هجري')).toHaveStyle({ fontSize: 11 });
      expect(screen.getByTestId('hilal-header')).toHaveStyle({
        marginBottom: 21,
        // The layout direction still wins.
        flexDirection: 'row-reverse',
      });
      expect(screen.getByText('رمضان ١٤٤٥')).toHaveStyle({
        color: '#000002',
        fontWeight: '700',
      });
      expect(screen.getByText('مارس – أبريل ٢٠٢٤')).toHaveStyle({
        color: '#000003',
      });
      expect(screen.getByRole('button', { name: 'الشهر التالي' })).toHaveStyle({
        width: 41,
        height: 40,
      });
      expect(screen.getByText('أحد')).toHaveStyle({ color: '#000004' });

      // 25 March: selected. 20 March: today. 13 March: disabled.
      const selected = day(/^الاثنين، ١٥ رمضان/);
      const today = day(/^الأربعاء، ١٠ رمضان/);
      const plain = day(/^الثلاثاء، ١٦ رمضان/);
      const disabled = day(/^الأربعاء، ٣ رمضان/);
      expect(plain).toHaveStyle({ height: 51, borderColor: 'transparent' });
      expect(selected).toHaveStyle({ height: 51, borderRadius: 2 });
      expect(today).toHaveStyle({ borderColor: '#000005' });
      expect(within(plain).getByText('١٦')).toHaveStyle({ fontSize: 19 });
      expect(within(plain).getByText('٢٦')).toHaveStyle({ fontSize: 9 });
      expect(within(selected).getByText('١٥')).toHaveStyle({
        fontSize: 19,
        fontWeight: '900',
        color: lightTheme.onPrimary,
      });
      expect(within(disabled).getByText('٣')).toHaveStyle({
        color: '#000006',
      });
      expect(within(disabled).getByText('١٣')).toHaveStyle({
        color: '#000006',
      });
    });

    it('styles the container like the style prop, which wins', async () => {
      await render(
        <HilalCalendar
          styles={{ container: { padding: 4, margin: 1 } }}
          style={{ padding: 8 }}
        />
      );
      const container = screen.getByTestId('hilal-header').parent;
      expect(container).toHaveStyle({ padding: 8, margin: 1 });
    });

    it('styles picker items, but not with the day slots', async () => {
      await render(
        <HilalCalendar
          defaultValue={MARCH_25}
          styles={{
            pickerItem: { minHeight: 61 },
            pickerText: { fontSize: 12 },
            selectedDay: { borderRadius: 2 },
            selectedDayText: { color: '#000007' },
            today: { borderColor: '#000005' },
          }}
        />
      );
      await fireEvent.press(
        screen.getByRole('button', { name: /^اختر الشهر والسنة/ })
      );
      const ramadan = screen.getByRole('button', {
        name: 'رمضان ١٤٤٥، هذا الشهر',
      });
      expect(ramadan).toHaveStyle({
        minHeight: 61,
        borderRadius: lightTheme.radius,
        borderColor: lightTheme.primary,
      });
      expect(screen.getByText('رمضان')).toHaveStyle({
        fontSize: 12,
        color: lightTheme.onPrimary,
      });
    });

    it('keeps the selected background over a day background', async () => {
      await render(
        <HilalCalendar
          defaultValue={MARCH_25}
          styles={{ day: { backgroundColor: '#000008' } }}
        />
      );
      const plain = day(/^الثلاثاء، ١٦ رمضان/);
      expect(plain).toHaveStyle({ backgroundColor: '#000008' });
      expect(day(/^الاثنين، ١٥ رمضان/)).toHaveStyle({
        backgroundColor: lightTheme.primary,
      });
    });
  });

  describe('labels', () => {
    it('replaces the toggle and button texts', async () => {
      await render(
        <HilalCalendar
          defaultValue={MARCH_25}
          labels={{
            hijri: 'هـ',
            gregorian: 'م',
            previousMonth: 'قبل',
            nextMonth: undefined,
            chooseMonth: 'افتح',
            chooseYear: 'السنوات',
            previousYear: 'سنة قبل',
            nextYear: 'سنة بعد',
          }}
        />
      );
      expect(screen.getByText('هـ')).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'م' })).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'قبل' })).toBeOnTheScreen();
      // Undefined keeps the default.
      expect(
        screen.getByRole('button', { name: 'الشهر التالي' })
      ).toBeOnTheScreen();
      await fireEvent.press(
        screen.getByRole('button', { name: 'افتح، رمضان ١٤٤٥' })
      );
      expect(screen.getByRole('button', { name: 'سنة قبل' })).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'سنة بعد' })).toBeOnTheScreen();
      await fireEvent.press(
        screen.getByRole('button', { name: 'السنوات، ١٤٤٥' })
      );
      expect(
        screen.getByRole('button', { name: 'السنوات السابقة' })
      ).toBeOnTheScreen();
    });

    it('replaces the year page arrows', async () => {
      await render(
        <HilalCalendar
          defaultValue={MARCH_25}
          locale="en"
          labels={{ previousYears: 'Earlier', nextYears: 'Later' }}
        />
      );
      await fireEvent.press(
        screen.getByRole('button', { name: /^Choose month and year/ })
      );
      await fireEvent.press(
        screen.getByRole('button', { name: /^Choose year/ })
      );
      expect(screen.getByRole('button', { name: 'Earlier' })).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'Later' })).toBeOnTheScreen();
    });
  });

  it('says today, this month and this year to screen readers', async () => {
    await render(<HilalCalendar defaultValue={MARCH_25} />);
    // 20 March is today.
    expect(day(/^الأربعاء، ١٠ رمضان ١٤٤٥ هـ، .*، اليوم$/)).toBeOnTheScreen();
    expect(day(/^الاثنين، ١٥ رمضان/)).not.toHaveAccessibleName(/اليوم$/);
    await fireEvent.press(
      screen.getByRole('button', { name: /^اختر الشهر والسنة/ })
    );
    expect(screen.getByRole('button', { name: 'شوال ١٤٤٥' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: /^اختر السنة/ }));
    expect(screen.getByRole('button', { name: '١٤٤٦' })).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: '١٤٤٥، هذه السنة' })
    ).toBeOnTheScreen();
  });

  it('limits how far the system text size grows fixed-size text', async () => {
    await render(<HilalCalendar defaultValue={MARCH_25} />);
    const cell = day(/^الاثنين، ١٥ رمضان/);
    expect(within(cell).getByText('١٥')).toHaveProp(
      'maxFontSizeMultiplier',
      1.3
    );
    expect(within(cell).getByText('٢٥')).toHaveProp(
      'maxFontSizeMultiplier',
      1.3
    );
    expect(screen.getByText('أحد')).toHaveProp('maxFontSizeMultiplier', 1.3);
    expect(screen.getByText('رمضان ١٤٤٥')).toHaveProp(
      'maxFontSizeMultiplier',
      2
    );
  });

  it('sets day numbers in medium, the selected day and today in bold', async () => {
    await render(<HilalCalendar defaultValue={MARCH_25} />);
    // 25 March is selected, 20 March is today, 26 March neither.
    const text = (name: RegExp, digits: string) =>
      within(day(name)).getByText(digits);
    expect(text(/^الثلاثاء، ١٦ رمضان/, '١٦')).toHaveStyle({
      fontWeight: '500',
    });
    expect(text(/^الاثنين، ١٥ رمضان/, '١٥')).toHaveStyle({ fontWeight: '700' });
    expect(text(/^الأربعاء، ١٠ رمضان/, '١٠')).toHaveStyle({
      fontWeight: '700',
    });
  });

  it('gives the toggle and the title 44 pt tall touch areas', async () => {
    await render(<HilalCalendar defaultValue={MARCH_25} />);
    expect(screen.getByRole('button', { name: 'هجري' })).toHaveProp('hitSlop', {
      top: 8,
      bottom: 8,
    });
    expect(
      screen.getByRole('button', { name: /^اختر الشهر والسنة/ })
    ).toHaveProp('hitSlop', { top: 8, bottom: 10, left: 6, right: 6 });
  });

  it('accepts theme and style overrides', async () => {
    await render(
      <HilalCalendar
        defaultValue={MARCH_25}
        theme={{ primary: '#7C3AED' }}
        dayStyle={{ borderRadius: 4 }}
      />
    );
    expect(day(/^الاثنين، ١٥ رمضان/)).toHaveStyle({
      backgroundColor: '#7C3AED',
      borderRadius: 4,
    });
  });

  it('draws the arrows in theme.arrow, and disabled arrows in theme.disabled', async () => {
    const strokes = (direction: 'left' | 'right') =>
      screen.getByTestId(`hilal-chevron-${direction}`).children;
    // 1 Ramadan is the earliest day, so the previous-month arrow is disabled.
    await render(
      <HilalCalendar
        defaultValue={MARCH_25}
        minDate={new Date(2024, 2, 11)}
        theme={{ arrow: '#DC2626' }}
      />
    );
    // Arabic: the next month is on the left.
    for (const stroke of strokes('left')) {
      expect(stroke).toHaveStyle({ backgroundColor: '#DC2626' });
    }
    for (const stroke of strokes('right')) {
      expect(stroke).toHaveStyle({ backgroundColor: lightTheme.disabled });
    }
  });

  it('draws the arrows in the text color by default', async () => {
    await render(<HilalCalendar defaultValue={MARCH_25} />);
    for (const stroke of screen.getByTestId('hilal-chevron-left').children) {
      expect(stroke).toHaveStyle({ backgroundColor: lightTheme.text });
    }
  });

  it('renders text in the theme fonts', async () => {
    await render(
      <HilalCalendar
        defaultValue={MARCH_25}
        theme={{
          fontFamily: 'Cairo-Regular',
          fontFamilyBold: 'Cairo-Bold',
          fontScale: 1.25,
        }}
      />
    );
    expect(screen.getByText('رمضان ١٤٤٥')).toHaveStyle({
      fontFamily: 'Cairo-Bold',
      fontSize: 22.5,
      fontWeight: 'normal',
    });
    expect(screen.getByText('مارس – أبريل ٢٠٢٤')).toHaveStyle({
      fontFamily: 'Cairo-Regular',
      fontSize: 16.3,
    });
    expect(day(/^الاثنين، ١٥ رمضان/)).toHaveStyle({ height: 60 });
  });
});
