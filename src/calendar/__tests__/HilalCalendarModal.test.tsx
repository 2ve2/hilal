import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { HilalCalendarModal } from '../HilalCalendarModal';
import { darkTheme } from '../theme';
import type { HilalCalendarModalProps, SelectedDate } from '../types';

// 25 March 2024 = 15 Ramadan 1445.
const MARCH_25 = new Date(2024, 2, 25);

const button = (name: string | RegExp) => screen.getByRole('button', { name });
const ramadan = (d: string) => button(new RegExp(`، ${d} رمضان ١٤٤٥`));

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2024, 2, 20, 10, 30) });
});

afterEach(() => {
  jest.useRealTimers();
});

/** The modal with its own open state, as an app would use it. */
function Harness(
  props: Omit<HilalCalendarModalProps, 'visible' | 'onClose'> & {
    onClose?: () => void;
  }
) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <HilalCalendarModal
        {...props}
        visible={open}
        onClose={() => {
          props.onClose?.();
          setOpen(false);
        }}
      />
      {!open && (
        <Pressable accessibilityRole="button" onPress={() => setOpen(true)}>
          <Text>{props.locale === 'en' ? 'Reopen' : 'افتح'}</Text>
        </Pressable>
      )}
    </>
  );
}

describe('HilalCalendarModal', () => {
  it('shows nothing while closed', async () => {
    await render(<HilalCalendarModal visible={false} onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: 'تم' })).toBeNull();
  });

  it('confirms the picked day with Done, then closes', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    await render(
      <Harness title="تاريخ الميلاد" onConfirm={onConfirm} onClose={onClose} />
    );
    expect(screen.getByRole('header', { name: 'تاريخ الميلاد' })).toBeTruthy();
    // Nothing picked yet: Done waits.
    expect(button('تم')).toBeDisabled();

    await fireEvent.press(ramadan('١٥'));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(button('تم')).toBeEnabled();

    await fireEvent.press(button('تم'));
    const picked = onConfirm.mock.calls[0]![0] as SelectedDate;
    expect(picked.gregorian).toEqual(MARCH_25);
    expect(picked.hijri).toEqual({ year: 1445, month: 9, day: 15 });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'تم' })).toBeNull();
  });

  it('closes without a change on Cancel, the backdrop and the back button', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    await render(
      <HilalCalendarModal
        visible
        value={MARCH_25}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );
    await fireEvent.press(button('إلغاء'));
    await fireEvent.press(screen.getByTestId('hilal-modal-backdrop'));
    expect(button('إغلاق')).toBeTruthy(); // the backdrop's spoken name
    // Android's back button.
    await fireEvent(screen.getByTestId('hilal-modal'), 'requestClose');
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('opens on value, and starts from it again after a cancel', async () => {
    const onConfirm = jest.fn();
    await render(<Harness value={MARCH_25} onConfirm={onConfirm} />);
    expect(ramadan('١٥')).toBeSelected();
    // Done is ready with the value itself.
    expect(button('تم')).toBeEnabled();

    await fireEvent.press(ramadan('٢٠'));
    expect(ramadan('٢٠')).toBeSelected();
    await fireEvent.press(button('إلغاء'));

    await fireEvent.press(button('افتح'));
    expect(ramadan('١٥')).toBeSelected();
    expect(ramadan('٢٠')).not.toBeSelected();
    await fireEvent.press(button('تم'));
    expect((onConfirm.mock.calls[0]![0] as SelectedDate).gregorian).toEqual(
      MARCH_25
    );
  });

  it('confirms a complete range only', async () => {
    const onConfirmRange = jest.fn();
    await render(
      <Harness selectionMode="range" onConfirmRange={onConfirmRange} />
    );
    await fireEvent.press(ramadan('١٥'));
    expect(button('تم')).toBeDisabled();
    await fireEvent.press(ramadan('١٨'));
    expect(button('تم')).toBeEnabled();
    await fireEvent.press(button('تم'));
    const range = onConfirmRange.mock.calls[0]![0] as {
      start: SelectedDate;
      end: SelectedDate;
      days: number;
    };
    expect(range.start.gregorian).toEqual(MARCH_25);
    expect(range.end.gregorian).toEqual(new Date(2024, 2, 28));
    expect(range.days).toBe(4);
  });

  it('opens on rangeValue', async () => {
    await render(
      <HilalCalendarModal
        visible
        onClose={() => {}}
        selectionMode="range"
        rangeValue={{ start: MARCH_25, end: new Date(2024, 2, 28) }}
      />
    );
    expect(ramadan('١٥')).toBeSelected();
    expect(ramadan('١٨')).toBeSelected();
    expect(button('تم')).toBeEnabled();
  });

  it('passes the calendar props through and follows the theme', async () => {
    await render(
      <HilalCalendarModal
        visible
        onClose={() => {}}
        value={MARCH_25}
        locale="en"
        theme="dark"
        labels={{ done: 'Save', cancel: 'Back' }}
        sheetStyle={{ borderTopLeftRadius: 8 }}
        bottomInset={34}
      />
    );
    expect(screen.getByRole('header', { name: 'Ramadan 1445' })).toBeTruthy();
    expect(button('Back')).toBeTruthy();
    const save = button('Save');
    expect(screen.getByText('Save')).toHaveStyle({ color: darkTheme.primary });
    expect(save).toBeEnabled();
    const sheet = screen.getByTestId('hilal-modal-sheet');
    expect(sheet).toHaveStyle({
      backgroundColor: darkTheme.background,
      borderTopLeftRadius: 8,
      paddingBottom: 12 + 34,
    });
  });

  it('has no empty header without a title', async () => {
    await render(
      <HilalCalendarModal visible onClose={() => {}} value={MARCH_25} />
    );
    // The only header is the calendar's month title.
    expect(screen.getAllByRole('header').map((h) => h.props.children)).toEqual([
      'رمضان ١٤٤٥',
    ]);
  });

  it('applies the range limits inside the sheet', async () => {
    await render(
      <HilalCalendarModal
        visible
        onClose={() => {}}
        selectionMode="range"
        maxRangeDays={3}
      />
    );
    await fireEvent.press(ramadan('١٥'));
    expect(ramadan('١٧')).toBeEnabled();
    expect(ramadan('١٨')).toBeDisabled();
    expect(button('تم')).toBeDisabled();
    await fireEvent.press(ramadan('١٧'));
    expect(button('تم')).toBeEnabled();
  });

  it('puts Cancel first in reading order', async () => {
    await render(
      <HilalCalendarModal visible onClose={() => {}} value={MARCH_25} />
    );
    // Arabic in a left-to-right app: the bar is reversed, so Cancel is on
    // the right.
    expect(screen.getByTestId('hilal-modal-bar')).toHaveStyle({
      flexDirection: 'row-reverse',
    });
  });
});
