/** @jest-environment node */
jest.mock('@/lib/db', () => ({ __esModule: true, default: jest.fn() }));

import { parseExtraction, flyerTimestamp, flyerContent } from '@/lib/flyerSync';

describe('parseExtraction', () => {
  it('keeps valid fields', () => {
    const f = parseExtraction({
      title: 'Sunset Session', description: 'Ven.', event_date: '2026-12-05',
      start_time: '9:30', event_time: '9:30 AM - 6:00 PM', price: '25$', capacity: 200, prizes: null,
    });
    expect(f).toEqual({
      title: 'Sunset Session', description: 'Ven.', event_date: '2026-12-05', start_time: '09:30',
      event_time: '9:30 AM - 6:00 PM', price: 25, capacity: 200, prizes: null,
    });
  });

  it('turns malformed values into null instead of guessing', () => {
    const f = parseExtraction({ title: 'X', event_date: 'sábado', start_time: '25:00', price: 'gratis', capacity: '', prizes: 'null' });
    expect(f.event_date).toBeNull();
    expect(f.start_time).toBeNull();
    expect(f.price).toBeNull();
    expect(f.capacity).toBeNull();
    expect(f.prizes).toBeNull();
    expect(f.description).toBe('');
  });

  it('rejects a flyer without a title', () => {
    expect(() => parseExtraction({ title: '  ' })).toThrow();
    expect(() => parseExtraction(null)).toThrow();
  });
});

describe('flyerTimestamp', () => {
  it('uses Venezuela time and the start time', () => {
    expect(flyerTimestamp('2026-12-05', '21:00')).toBe('2026-12-05T21:00:00-04:00');
  });
  it('defaults to midday when no time is shown', () => {
    expect(flyerTimestamp('2026-12-05', null)).toBe('2026-12-05T12:00:00-04:00');
  });
  it('is null without a date', () => {
    expect(flyerTimestamp(null, '21:00')).toBeNull();
  });
});

describe('flyerContent', () => {
  it('lists the printed schedule and prizes', () => {
    expect(flyerContent({ event_time: '12 PM - 8 PM', prizes: 'Botella' })).toBe('Horario: 12 PM - 8 PM\n\nPremios: Botella');
    expect(flyerContent({ event_time: null, prizes: null })).toBe('');
  });
});
