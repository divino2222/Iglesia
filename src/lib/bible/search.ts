import type { BibleBookContent } from "@/lib/bible/types";

export function searchInChapter(
  book: BibleBookContent,
  chapterNumber: number,
  query: string
) {
  const chapter = book.chapters.find((c) => c.chapter === chapterNumber);
  if (!chapter) return [];

  const normalized = query.trim().toLowerCase();
  if (!normalized) return chapter.verses;

  return chapter.verses.filter((verse) =>
    verse.text.toLowerCase().includes(normalized)
  );
}