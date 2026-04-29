import {
  generateJti,
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../../src/modules/auth/tokens';

describe('JWT helpers', () => {
  it('round-trips an access token', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@b.c' });
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.email).toBe('a@b.c');
    expect(decoded.type).toBe('access');
  });

  it('round-trips a refresh token preserving jti', () => {
    const jti = generateJti();
    const token = signRefreshToken({ sub: 'user-2', jti });
    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toBe('user-2');
    expect(decoded.jti).toBe(jti);
    expect(decoded.type).toBe('refresh');
  });

  it('rejects an access token verified with the refresh secret (and vice versa)', () => {
    const access = signAccessToken({ sub: 'u', email: 'e@e.e' });
    const refresh = signRefreshToken({ sub: 'u', jti: generateJti() });
    expect(() => verifyRefreshToken(access)).toThrow();
    expect(() => verifyAccessToken(refresh)).toThrow();
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken({ sub: 'u', email: 'e@e.e' });
    const tampered = token.slice(0, -2) + 'aa';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('hashes refresh tokens deterministically', () => {
    const t = 'some.refresh.token';
    expect(hashRefreshToken(t)).toBe(hashRefreshToken(t));
    expect(hashRefreshToken(t)).not.toBe(t);
    expect(hashRefreshToken(t)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generateJti returns a 32-char hex string', () => {
    const a = generateJti();
    const b = generateJti();
    expect(a).toMatch(/^[a-f0-9]{32}$/);
    expect(a).not.toBe(b);
  });
});
