function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== "[object Object]") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

export function sanitizeFirestoreData<T>(value: T): T {
  if (value === undefined) return undefined as T;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined).map((item) => sanitizeFirestoreData(item)) as T;
  }
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, sanitizeFirestoreData(item)]),
  ) as T;
}
