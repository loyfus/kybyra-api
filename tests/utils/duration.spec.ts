import { parseDuration } from '../../src/utils/duration';

describe('parseDuration', () => {
  it.each([
    ['30s', 30_000],
    ['15m', 15 * 60_000],
    ['2h', 2 * 3_600_000],
    ['7d', 7 * 86_400_000],
    ['2w', 14 * 86_400_000],
    ['  10m  ', 10 * 60_000],
  ])('parses %s', (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  it.each(['', 'foo', '5x', '15', 'm15'])('rejects invalid input %s', (input) => {
    expect(() => parseDuration(input)).toThrow();
  });
});
