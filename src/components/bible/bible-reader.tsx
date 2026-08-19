"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  Bookmark,
  WifiOff,
} from "lucide-react";
import { getBibleBooks, getBibleBooksByTestament, loadBookContent } from "@/lib/bible/reader";
import { getLastReading, saveLastReading } from "@/lib/bible/storage";
import { searchInChapter } from "@/lib/bible/search";
import type { BibleBook, BibleBookContent } from "@/lib/bible/types";

const allBooks = getBibleBooks();
const oldTestamentBooks = getBibleBooksByTestament("old");
const newTestamentBooks = getBibleBooksByTestament("new");

export default function BibleReader() {
  const defaultBookId = allBooks[0]?.id ?? "";
  const defaultChapter = 1;

  const [selectedBookId, setSelectedBookId] = useState(defaultBookId);
  const [selectedChapterNumber, setSelectedChapterNumber] = useState(defaultChapter);
  const [query, setQuery] = useState("");
  const [bookContent, setBookContent] = useState<BibleBookContent | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedBookMeta: BibleBook | undefined = useMemo(
    () => allBooks.find((book) => book.id === selectedBookId),
    [selectedBookId]
  );

  useEffect(() => {
    const lastReading = getLastReading();
    if (lastReading) {
      setSelectedBookId(lastReading.bookId);
      setSelectedChapterNumber(lastReading.chapter);
    }
  }, []);

  useEffect(() => {
    async function fetchBook() {
      setLoading(true);
      const content = await loadBookContent(selectedBookId);
      setBookContent(content);

      const availableChapter =
        content?.chapters.find((c) => c.chapter === selectedChapterNumber) ??
        content?.chapters[0];

      if (availableChapter && availableChapter.chapter !== selectedChapterNumber) {
        setSelectedChapterNumber(availableChapter.chapter);
      }

      setLoading(false);
    }

    if (selectedBookId) {
      fetchBook();
    }
  }, [selectedBookId]);

  useEffect(() => {
    if (selectedBookId && selectedChapterNumber) {
      saveLastReading({
        bookId: selectedBookId,
        chapter: selectedChapterNumber,
      });
    }
  }, [selectedBookId, selectedChapterNumber]);

  const availableChapters = bookContent?.chapters ?? [];

  const selectedChapter = useMemo(() => {
    return (
      availableChapters.find((chapter) => chapter.chapter === selectedChapterNumber) ??
      availableChapters[0]
    );
  }, [availableChapters, selectedChapterNumber]);

  const filteredVerses = useMemo(() => {
    if (!bookContent || !selectedChapter) return [];
    return searchInChapter(bookContent, selectedChapter.chapter, query);
  }, [bookContent, selectedChapter, query]);

  const currentChapterIndex = availableChapters.findIndex(
    (chapter) => chapter.chapter === selectedChapter?.chapter
  );

  const goToPreviousChapter = () => {
    if (currentChapterIndex > 0) {
      setSelectedChapterNumber(availableChapters[currentChapterIndex - 1].chapter);
      setQuery("");
    }
  };

  const goToNextChapter = () => {
    if (
      currentChapterIndex >= 0 &&
      currentChapterIndex < availableChapters.length - 1
    ) {
      setSelectedChapterNumber(availableChapters[currentChapterIndex + 1].chapter);
      setQuery("");
    }
  };

  const handleBookChange = (bookId: string) => {
    setSelectedBookId(bookId);
    setSelectedChapterNumber(1);
    setQuery("");
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[30px] border border-white/60 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-800 px-5 py-5 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-200">
            <BookOpen size={12} />
            Lectura bíblica
          </div>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            {selectedBookMeta?.name ?? "Biblia"} {selectedChapter?.chapter ?? ""}
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-300">
            Lista para lectura rápida y disponible sin conexión una vez cargada.
          </p>
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-[24px] border border-stone-200 bg-stone-50 px-4 py-3">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Antiguo Testamento
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {oldTestamentBooks.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => handleBookChange(book.id)}
                  className={`rounded-2xl px-3 py-3 text-sm font-medium transition ${
                    selectedBookId === book.id
                      ? "bg-stone-900 text-white"
                      : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {book.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-stone-200 bg-stone-50 px-4 py-3">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Nuevo Testamento
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {newTestamentBooks.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => handleBookChange(book.id)}
                  className={`rounded-2xl px-3 py-3 text-sm font-medium transition ${
                    selectedBookId === book.id
                      ? "bg-stone-900 text-white"
                      : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {book.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-stone-200 bg-stone-50 px-4 py-3">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Libro actual
              </label>
              <div className="rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-900">
                {selectedBookMeta?.name ?? "Selecciona un libro"}
              </div>
            </div>

            <div className="rounded-[24px] border border-stone-200 bg-stone-50 px-4 py-3">
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Capítulo
              </label>
              <select
                value={selectedChapterNumber}
                onChange={(e) => setSelectedChapterNumber(Number(e.target.value))}
                className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400"
              >
                {availableChapters.map((chapter) => (
                  <option key={chapter.chapter} value={chapter.chapter}>
                    Capítulo {chapter.chapter}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-[24px] border border-stone-200 bg-stone-50 px-4 py-3">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Buscar dentro del capítulo
            </label>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Escribe una palabra o frase"
                className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-10 pr-3 text-sm text-stone-900 outline-none transition focus:border-stone-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goToPreviousChapter}
              disabled={currentChapterIndex <= 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-stone-900 ring-1 ring-stone-200 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
              {selectedBookMeta?.shortName} {selectedChapter?.chapter}
            </div>

            <button
              type="button"
              onClick={goToNextChapter}
              disabled={
                currentChapterIndex < 0 ||
                currentChapterIndex >= availableChapters.length - 1
              }
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-stone-900 ring-1 ring-stone-200 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[30px] border border-white/60 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-stone-950">
              {selectedBookMeta?.name ?? "Biblia"} {selectedChapter?.chapter ?? ""}
            </h3>
            <p className="text-sm text-stone-500">
              {loading
                ? "Cargando..."
                : `${filteredVerses.length} versículo${
                    filteredVerses.length === 1 ? "" : "s"
                  } visibles`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
              <Bookmark size={18} />
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 sm:inline-flex">
              <WifiOff size={12} />
              Offline
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4">
          {loading ? (
            <div className="rounded-[24px] border border-stone-200 bg-stone-50 px-4 py-5 text-sm leading-6 text-stone-600">
              Cargando libro y capítulo...
            </div>
          ) : filteredVerses.length === 0 ? (
            <div className="rounded-[24px] border border-stone-200 bg-stone-50 px-4 py-5 text-sm leading-6 text-stone-600">
              No se encontraron resultados dentro de este capítulo.
            </div>
          ) : (
            filteredVerses.map((verse) => (
              <div
                key={`${selectedBookMeta?.id}-${selectedChapter?.chapter}-${verse.verse}`}
                className="rounded-[24px] border border-stone-100 bg-stone-50/70 px-4 py-4 transition hover:bg-stone-50"
              >
                <p className="leading-7 text-stone-800">
                  <span className="mr-2 inline-flex min-w-7 items-center justify-center rounded-full bg-stone-900 px-2 py-0.5 text-xs font-semibold text-white">
                    {verse.verse}
                  </span>
                  {verse.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}