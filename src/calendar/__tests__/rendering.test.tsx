import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { HilalCalendar } from '../HilalCalendar';

const renders: number[] = [];

// Wrap the cell so every render of a day is recorded. The wrapper is
// memoized the same way as the real DayCell (asserted below), so this
// measures whether the calendar keeps the cells' props stable.
jest.mock('../DayCell', () => {
  const actual = jest.requireActual<typeof import('../DayCell')>('../DayCell');
  const { createElement, memo } =
    jest.requireActual<typeof import('react')>('react');
  return {
    ...actual,
    DayCell: memo((props: Parameters<typeof actual.DayCellView>[0]) => {
      renders.push(props.epochDay);
      return createElement(actual.DayCellView, props);
    }),
  };
});

const MEMO = Symbol.for('react.memo');

describe('day cell rendering', () => {
  it('is memoized', () => {
    const { DayCell } =
      jest.requireActual<typeof import('../DayCell')>('../DayCell');
    expect((DayCell as unknown as { $$typeof: symbol }).$$typeof).toBe(MEMO);
  });

  it('re-renders only the old and new selected day (uncontrolled)', async () => {
    await render(<HilalCalendar defaultValue={new Date(2024, 2, 25)} />);
    expect(renders.length).toBeGreaterThanOrEqual(29);

    renders.length = 0;
    await fireEvent.press(
      screen.getByRole('button', { name: /^الثلاثاء، ١٦ رمضان/ })
    );
    expect(renders).toHaveLength(2);
  });

  it('re-renders only the old and new selected day (controlled, inline props)', async () => {
    function Parent() {
      const [value, setValue] = useState(new Date(2024, 2, 25));
      return (
        <HilalCalendar
          value={value}
          // New function and style objects on every render, as people
          // write them in real apps.
          onChange={(d) => setValue(d.gregorian)}
          isDateDisabled={(d) => d.gregorian.getDay() === 5}
          dayStyle={{ borderRadius: 8 }}
          styles={{ dayText: { fontSize: 17 } }}
          theme={{ primary: '#7C3AED' }}
        />
      );
    }
    await render(<Parent />);

    renders.length = 0;
    await fireEvent.press(
      screen.getByRole('button', { name: /^الثلاثاء، ١٦ رمضان/ })
    );
    expect(renders).toHaveLength(2);
  });
});
