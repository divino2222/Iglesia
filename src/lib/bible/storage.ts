const LAST_READING_KEY = "comunidad-vid-bible-last-reading";

export type LastReadingState = {
  bookId: string;
  chapter: number;
};

export function saveLastReading(state: LastReadingState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_READING_KEY, JSON.stringify(state));
}

export function getLastReading(): LastReadingState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(LAST_READING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastReadingState;
  } catch {
    return null;
  }
}