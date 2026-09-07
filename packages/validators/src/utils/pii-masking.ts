/**
 * PII Masking Utilities
 *
 * Follows Module 14 spec for masking Personally Identifiable Information
 * in audit log UI display. Full values are NEVER sent to the client.
 *
 * senior-backend skill: Security practices — mask sensitive data before transport.
 */

/**
 * Mask phone number: "0963124567" → "096*****67"
 * Shows first 3 and last 2 digits.
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.length < 6) return '***';
  const prefix = cleaned.slice(0, 3);
  const suffix = cleaned.slice(-2);
  const masked = '*'.repeat(cleaned.length - 5);
  return `${prefix}${masked}${suffix}`;
}

/**
 * Mask email: "hello@gmail.com" → "h***@gmail.com"
 * Shows first character of local part + domain.
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '—';
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return '***';
  const firstChar = email[0];
  const domain = email.slice(atIndex);
  return `${firstChar}***${domain}`;
}

/**
 * Mask ID number (CCCD/CMND): "079123456789" → "0791****6789"
 * Shows first 4 and last 4 digits.
 */
export function maskIdNumber(id: string | null | undefined): string {
  if (!id) return '—';
  const cleaned = id.replace(/\s/g, '');
  if (cleaned.length < 8) return '***';
  const prefix = cleaned.slice(0, 4);
  const suffix = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 8);
  return `${prefix}${masked}${suffix}`;
}

/**
 * PII field patterns to detect and mask automatically.
 */
const PII_FIELD_PATTERNS: Array<{
  pattern: RegExp;
  masker: (value: string) => string;
}> = [
  { pattern: /phone|sdt|điện.?thoại/i, masker: maskPhone },
  { pattern: /email/i, masker: maskEmail },
  { pattern: /cccd|cmnd|id.*card|id.*number|identity/i, masker: maskIdNumber },
];

/**
 * Recursively mask PII fields in a JSON object.
 * Detects field names matching PII patterns and applies appropriate masking.
 */
export function maskPiiInObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskPiiInObject(item));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Check if this field name matches a PII pattern
      const piiMatch = PII_FIELD_PATTERNS.find((p) => p.pattern.test(key));
      if (piiMatch && typeof value === 'string') {
        result[key] = piiMatch.masker(value);
      } else {
        result[key] = maskPiiInObject(value);
      }
    }
    return result;
  }

  return obj;
}

/**
 * Mask PII in an audit log entry's beforeJson and afterJson fields.
 */
export function maskAuditLogEntry<T extends { beforeJson?: unknown; afterJson?: unknown; metadata?: unknown }>(
  entry: T,
): T {
  return {
    ...entry,
    beforeJson: maskPiiInObject(entry.beforeJson),
    afterJson: maskPiiInObject(entry.afterJson),
    metadata: maskPiiInObject(entry.metadata),
  };
}
