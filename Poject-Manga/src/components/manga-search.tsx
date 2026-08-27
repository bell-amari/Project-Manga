import { LoaderCircle, Search, Star, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ANILIST_API = "https://graphql.anilist.co";
const MIN_SEARCH_LENGTH = 3;
const SEARCH_DELAY_MS = 500;

type SearchResult = {
  id: number;
  title: {
    english: string | null;
    romaji: string;
    native: string | null;
  };
  coverImage: { large: string };
  rating: number | null;
  volumes: number | null;
  status: string;
};

const SEARCH_QUERY = `
  query ($search: String!, $perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(search: $search, type: MANGA, isAdult: false) {
        id
        title { english romaji native }
        coverImage { large }
        averageScore
        volumes
        status
      }
    }
  }
`;

function titleFor(manga: SearchResult) {
  return manga.title.english || manga.title.romaji || manga.title.native || "Untitled manga";
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function searchAniList(search: string, signal: AbortSignal): Promise<SearchResult[]> {
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: { search, perPage: 6 },
    }),
    signal,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Too many searches. Try again in a moment.");
    }
    throw new Error(`Search failed (${response.status}).`);
  }

  const result = await response.json();
  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || "AniList search failed.");
  }

  return (result.data?.Page?.media ?? []).map((manga: any) => ({
    id: manga.id,
    title: {
      english: manga.title?.english ?? null,
      romaji: manga.title?.romaji ?? "",
      native: manga.title?.native ?? null,
    },
    coverImage: { large: manga.coverImage?.large ?? "" },
    rating:
      typeof manga.averageScore === "number"
        ? Number((manga.averageScore / 10).toFixed(1))
        : null,
    volumes: manga.volumes ?? null,
    status: manga.status ?? "UNKNOWN",
  }));
}

function useMangaSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const nextResults = await searchAniList(trimmed, controller.signal);
        if (!controller.signal.aborted) setResults(nextResults);
      } catch (searchError) {
        if (!controller.signal.aborted) {
          setResults([]);
          setError(searchError instanceof Error ? searchError.message : "Search is unavailable right now.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, SEARCH_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const reset = () => {
    setQuery("");
    setResults([]);
    setLoading(false);
    setError(null);
  };

  return { query, setQuery, results, loading, error, trimmed, reset };
}

function Results({
  results,
  loading,
  error,
  trimmed,
  onSelect,
  mobile = false,
}: {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  trimmed: string;
  onSelect: () => void;
  mobile?: boolean;
}) {
  if (trimmed.length < MIN_SEARCH_LENGTH) {
    return (
      <p className="px-3 py-5 text-center text-sm font-semibold text-muted-foreground">
        Type at least {MIN_SEARCH_LENGTH} characters to search AniList.
      </p>
    );
  }

  if (error) {
    return <p className="px-3 py-5 text-center text-sm font-semibold text-muted-foreground">{error}</p>;
  }

  if (loading && results.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm font-semibold text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" /> Searching AniList...
      </div>
    );
  }

  if (!loading && results.length === 0) {
    return <p className="px-3 py-5 text-center text-sm font-semibold text-muted-foreground">No manga found.</p>;
  }

  return (
    <div className={mobile ? "max-h-[55vh] overflow-y-auto" : "max-h-[26rem] overflow-y-auto"}>
      {results.map((manga) => {
        const title = titleFor(manga);
        return (
          <a
            key={manga.id}
            href={`/manga/${manga.id}`}
            onClick={onSelect}
            className="group flex min-h-24 cursor-pointer gap-3 border-b border-ink/15 p-3 last:border-b-0 hover:bg-accent/45 focus:bg-accent/45 focus:outline-none"
          >
            <div className="h-24 w-16 shrink-0 overflow-hidden border border-ink bg-card">
              {manga.coverImage.large && (
                <img src={manga.coverImage.large} alt={`${title} cover`} className="h-full w-full object-cover" loading="lazy" />
              )}
            </div>
            <div className="min-w-0 flex-1 py-1">
              <p className="line-clamp-2 font-display text-base leading-tight group-hover:text-primary">{title}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {manga.rating !== null && (
                  <span className="flex items-center gap-1 text-foreground">
                    <Star className="h-3 w-3 fill-ink" strokeWidth={2.5} />
                    {manga.rating.toFixed(1)}
                  </span>
                )}
                <span>{formatStatus(manga.status)}</span>
                {manga.volumes !== null && <span>{manga.volumes} vols</span>}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

export function MangaSearch() {
  const { query, setQuery, results, loading, error, trimmed, reset } = useMangaSearch();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsId = useId();

  useEffect(() => {
    if (trimmed.length >= MIN_SEARCH_LENGTH) setOpen(true);
  }, [trimmed]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  const close = () => {
    setOpen(false);
    reset();
  };

  return (
    <div ref={containerRef} className="relative w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2" strokeWidth={2.5} />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => trimmed.length >= MIN_SEARCH_LENGTH && setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder="Search manga..."
        aria-label="Search manga"
        aria-expanded={open}
        aria-controls={resultsId}
        autoComplete="off"
        className="h-9 w-full cursor-text border-2 border-ink bg-paper/70 pl-9 pr-9 text-xs font-bold uppercase tracking-wide outline-none placeholder:text-muted-foreground focus:shadow-stamp"
      />
      {loading && <LoaderCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      {open && (
        <div id={resultsId} className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[22rem] max-w-[calc(100vw-2rem)] border-2 border-ink bg-paper/95 p-2 shadow-stamp backdrop-blur">
          <Results results={results} loading={loading} error={error} trimmed={trimmed} onSelect={close} />
        </div>
      )}
    </div>
  );
}

export function MobileMangaSearch() {
  const { query, setQuery, results, loading, error, trimmed, reset } = useMangaSearch();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsId = useId();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    reset();
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Open manga search" className="flex h-11 w-11 cursor-pointer items-center justify-center border-2 border-ink bg-paper/70 shadow-stamp-sm">
        <Search className="h-5 w-5" strokeWidth={2.5} />
      </button>
      {mounted && open && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/25 px-4 pb-8 pt-24 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Search manga"
          onPointerDown={(event) => event.target === event.currentTarget && close()}
        >
          <div className="w-full max-w-lg border-2 border-ink bg-paper/95 p-3 shadow-stamp">
            <div className="mb-3 flex items-center justify-between border-b-2 border-ink pb-3">
              <p className="font-display text-xl uppercase">Search Manga</p>
              <button type="button" onClick={close} aria-label="Close search" className="flex h-11 w-11 cursor-pointer items-center justify-center border-2 border-ink bg-card">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search manga..."
                aria-label="Search manga"
                aria-controls={resultsId}
                autoComplete="off"
                className="h-14 w-full cursor-text border-2 border-ink bg-card/90 pl-12 pr-12 text-base font-semibold outline-none focus:shadow-stamp"
              />
              {loading && <LoaderCircle className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin" />}
            </div>
            <div id={resultsId} className="mt-3 border-2 border-ink bg-paper/95">
              <Results results={results} loading={loading} error={error} trimmed={trimmed} onSelect={close} mobile />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
