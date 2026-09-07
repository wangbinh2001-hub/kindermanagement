import { describe, it, expect } from 'vitest';
import { requirePasswordChange } from '../src/index.js';

describe('requirePasswordChange', () => {
  it('returns true when password is temporary', () => {
    expect(requirePasswordChange({ isTemporaryPassword: true })).toBe(true);
  });
});
