// Pure rules for picking a password (unit-tested). Shown before typing as a hint; checked when Save is tapped.
export const PASSWORD_RULE = 'At least 8 letters or numbers.';

export function passwordProblem(password: string, again: string): string | null {
  if (password.length < 8) return 'Use at least 8 letters or numbers.';
  if (password !== again) return 'The two passwords don’t match.';
  return null;
}

/** "Patrick Byrne" → "Patrick"; nothing → null, so the screen just says "Welcome". */
export function firstNameOf(fullName: unknown): string | null {
  const first = typeof fullName === 'string' ? fullName.trim().split(/\s+/)[0] : '';
  return first || null;
}
