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
import { I18nManager, StyleSheet } from 'react-native';

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
});
