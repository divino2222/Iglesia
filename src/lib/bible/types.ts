export type BibleVerse = {
  verse: number;
  text: string;
};

export type BibleChapter = {
  chapter: number;
  verses: BibleVerse[];
};

export type BibleBook = {
  id: string;
  name: string;
  shortName: string;
  testament: "old" | "new";
  order: number;
  chaptersCount: number;
  file: string;
};

export type BibleBookContent = {
  id: string;
  name: string;
  shortName: string;
  chapters: BibleChapter[];
};

export type BibleManifest = {
  books: BibleBook[];
};