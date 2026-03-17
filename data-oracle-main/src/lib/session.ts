const SESSION_STORAGE_KEY = "datagod_session_id";

export function getOrCreateSessionId(): string {
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing && existing.trim()) {
    return existing;
  }

  const next = "session-" + Math.random().toString(36).slice(2, 9);
  window.localStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}
