/**
 * Helper to mask sensitive email addresses for Guest / Content Operator mode.
 * Masks the username and hides the full domain (e.g., wahyu.miftakhul@gmail.com -> wa***@g***).
 * Strictly prevents leaking "...gmail.com" in Guest mode.
 */
export function maskEmail(email: string | undefined | null): string {
  if (!email || !email.trim()) {
    return '******';
  }
  const cleanEmail = email.trim();
  if (!cleanEmail.includes('@')) {
    return cleanEmail.length > 2 ? `${cleanEmail.slice(0, 2)}***` : '******';
  }

  const [username, domain] = cleanEmail.split('@');
  if (!username) {
    return '***@***';
  }

  const userPrefix = username.slice(0, Math.min(2, username.length));
  const domainPrefix = domain ? domain.slice(0, 1) : 'g';
  return `${userPrefix}***@${domainPrefix}***`;
}

/**
 * Checks if a string contains or looks like an email and masks it if in guest mode.
 * Strictly prevents displaying full email in handle or username fields for guests.
 */
export function maskIfEmail(text: string | undefined | null, isGuest: boolean): string {
  if (!text) return '';
  if (!isGuest) return text;
  const trimmed = text.trim();
  if (trimmed.includes('@') && (trimmed.includes('.') || trimmed.toLowerCase().includes('gmail'))) {
    return maskEmail(trimmed);
  }
  return text;
}
