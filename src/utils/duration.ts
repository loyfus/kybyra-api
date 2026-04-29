/**
 * Parses simple duration strings ("15m", "7d", "30s", "12h") to milliseconds.
 * Used for refresh token expiry persistence; mirrors what jsonwebtoken accepts.
 */
export function parseDuration(input: string): number {
  const match = /^(\d+)\s*(s|m|h|d|w)$/.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid duration: "${input}" (expected e.g. "15m", "7d")`);
  }
  const value = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return value * 1_000;
    case 'm':
      return value * 60_000;
    case 'h':
      return value * 3_600_000;
    case 'd':
      return value * 86_400_000;
    case 'w':
      return value * 7 * 86_400_000;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
}
