/**
 * Helper to mask sensitive email addresses for Guest / Content Operator mode.
 * Shows only the first few characters of the email username, followed by asterisks, and the full domain.
 * e.g., wahyu.miftakhul@gmail.com -> wah******@gmail.com
 */
export function maskEmail(email: string | undefined | null): string {
  if (!email || !email.trim()) {
    return '******';
  }
  const cleanEmail = email.trim();
  if (!cleanEmail.includes('@')) {
    return cleanEmail.length > 2 ? `${cleanEmail.slice(0, 2)}******` : '******';
  }

  const [username, domain] = cleanEmail.split('@');
  if (!username) {
    return `******@${domain}`;
  }

  if (username.length <= 2) {
    return `${username[0]}******@${domain}`;
  }

  const visibleCount = Math.min(3, Math.max(1, Math.floor(username.length / 2)));
  const visiblePart = username.slice(0, visibleCount);
  return `${visiblePart}******@${domain}`;
}
