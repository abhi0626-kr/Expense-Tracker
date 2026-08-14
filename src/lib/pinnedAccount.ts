export const PINNED_KEY_PREFIX = "expense-tracker:pinned-account:";

function readRawPinned(userId?: string | null): string | null {
  if (!userId) return null;
  try {
    return localStorage.getItem(PINNED_KEY_PREFIX + userId);
  } catch (e) {
    return null;
  }
}

export function getPinnedAccountIds(userId?: string | null): string[] {
  const raw = readRawPinned(userId);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch (e) {
    // fallback: legacy single id stored as plain string
    return [raw].filter(Boolean);
  }
  return [];
}

export function setPinnedAccountIds(userId: string | null | undefined, accountIds: string[] | null) {
  if (!userId) return;
  try {
    const key = PINNED_KEY_PREFIX + userId;
    if (accountIds && accountIds.length > 0) {
      localStorage.setItem(key, JSON.stringify(accountIds));
    } else {
      localStorage.removeItem(key);
    }
    try {
      window.dispatchEvent(new StorageEvent('storage', { key }));
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore
  }
}

export function togglePinnedAccount(userId: string | null | undefined, accountId: string, limit = 3) {
  if (!userId) return [] as string[];
  const current = getPinnedAccountIds(userId);
  const exists = current.includes(accountId);
  let next: string[];
  if (exists) {
    next = current.filter((id) => id !== accountId);
  } else {
    if (current.length >= limit) {
      // do not add more than limit
      return current;
    }
    next = [accountId, ...current];
  }
  setPinnedAccountIds(userId, next);
  return next;
}

// Backwards-compatible helpers
export function getPinnedAccountId(userId?: string | null) {
  const ids = getPinnedAccountIds(userId);
  return ids.length > 0 ? ids[0] : null;
}

export function setPinnedAccountId(userId: string | null | undefined, accountId: string | null) {
  if (!userId) return;
  if (accountId) {
    setPinnedAccountIds(userId, [accountId]);
  } else {
    setPinnedAccountIds(userId, null);
  }
}
