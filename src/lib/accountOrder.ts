export const ACCOUNT_ORDER_PREFIX = "expense-tracker:account-order:";

export function getAccountOrder(userId?: string | null): string[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(ACCOUNT_ORDER_PREFIX + userId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
    }
  } catch (e) {
    // ignore parsing errors
  }
  return [];
}

export function setAccountOrder(userId: string | null | undefined, accountIds: string[]) {
  if (!userId) return;
  try {
    const key = ACCOUNT_ORDER_PREFIX + userId;
    if (accountIds && accountIds.length > 0) {
      localStorage.setItem(key, JSON.stringify(accountIds));
    } else {
      localStorage.removeItem(key);
    }
    try {
      window.dispatchEvent(new StorageEvent("storage", { key }));
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore
  }
}

export function sortAccountsByOrder<T extends { id: string }>(
  accounts: T[],
  order: string[]
): T[] {
  if (!accounts || accounts.length === 0) return [];
  if (!order || order.length === 0) return [...accounts];

  const orderMap = new Map<string, number>();
  order.forEach((id, index) => {
    orderMap.set(id, index);
  });

  return [...accounts].sort((a, b) => {
    const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
    const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
    return orderA - orderB;
  });
}
