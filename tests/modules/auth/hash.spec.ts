import { hashPassword, verifyPassword } from '../../../src/modules/auth/hash';

describe('password hashing', () => {
  it('hashes and verifies the same password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
    expect(hash.length).toBeGreaterThan(20);
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('right');
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });

  it('produces different hashes for the same password (salted)', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
  });
});
