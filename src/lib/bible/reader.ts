import { bibleManifest } from "@/data/bible/manifest";
import type { BibleBook, BibleBookContent } from "@/lib/bible/types";

export function getBibleBooks(): BibleBook[] {
  return [...bibleManifest.books].sort((a, b) => a.order - b.order);
}

export function getBibleBooksByTestament(testament: "old" | "new") {
  return getBibleBooks().filter((book) => book.testament === testament);
}

export function getBookMeta(bookId: string): BibleBook | undefined {
  return bibleManifest.books.find((book) => book.id === bookId);
}

export async function loadBookContent(
  bookId: string
): Promise<BibleBookContent | null> {
  const meta = getBookMeta(bookId);
  if (!meta) return null;

  try {
    const response = await fetch(meta.file, { cache: "force-cache" });
    if (!response.ok) return null;
    return (await response.json()) as BibleBookContent;
  } catch (error) {
    console.error("Error loading Bible book:", error);
    return null;
  }
}