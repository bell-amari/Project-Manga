import { LoaderCircle, Search, Star, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ANILIST_API = "https://graphql.anilist.co";
const MIN_SEARCH_LENGTH = 3;
const SEARCH_DELAY_MS = 700;

type SearchResult = {
  id: number;
  title: {
    english: string | null;
    romaji: string;
    native: string | null;
  };
  coverImage: {
    large: string;
  };
  rating: number | null;
  volumes: number | null;
  status: string;
};

type AniListSearchResponse = {
  data?: {
    Page?: {
      media?: Array<{
        id: number;
        title?: {
          english?: string | null;
          romaji?: string | null;
          native?: string | null;
        } | null;
        coverImage?: {
          large?: string | null;
        } | null;
        averageScore?: number | null;
        volumes?: number | null;
        status?: string | null;
      }> | null;
    } | null;
  };
  errors?: Array<{
    message?: string;
  }>;
};

const SEARCH_QUERY = `
  query ($search: String!, $perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(
        search: $search
        type: MANGA
        isAdult: false
      ) {
        id
        title {
          english
          romaji
          native
        }
        coverImage {
          large
        }
        averageScore
        volumes
        status
      }
    }
  }
`;

function displayTitle(manga: SearchResult) {
  return (
    manga.title.english ||
    manga.title.romaji ||
    manga.title.native ||
    "Untitled manga"
  );
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function searchAniList(
  search: string,
  signal: AbortSignal,
): Promise<SearchResult[]> {
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: {
        search,
        perPage: 6,
      },
    }),
    signal,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Too many searches. Try again in a moment.");
    }

    throw new Error(`Search failed (${response.status}).`);
  }

  const result: AniListSearchResponse = await response.json();

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || "AniList search failed.");
  }

  const media = result.data?.Page?.media ?? [];

  return media.map((manga) => ({
    id: manga.id,
    title: {
      english: manga.title?.english ?? null,
      romaji: manga.title?.romaji ?? "",
      native: manga.title?.native ?? null,
    },
    coverImage: {
      large: manga.coverImage?.large ?? "",
    },
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const manga = await searchAniList(trimmedQuery, controller.signal);

        if (!controller.signal.aborted) {
          setResults(manga);
        }
      } catch (searchError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("AniList search failed:", searchError);
        setResults([]);
        setError(
          searchError instanceof Error
            ? searchError.message
            : "Search is unavailable right now.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, SEARCH_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery]);

  const reset = () => {
    setQuery("");
    setResults([]);
    setError(null);
    setIsLoading(false);
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    trimmedQuery,
    reset,
  };
}

function SearchResults({
  results,
  isLoading,
  error,
  trimmedQuery,
  onSelect,
  mobile = false,
}: {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  trimmedQuery: string;
  onSelect: () => void;
  mobile?: boolean;
}) {
  if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
    return (
      <p className="px-3 py-5 text-center text-sm font-semibold text-muted-foreground">
        Type at least {MIN_SEARCH_LENGTH} characters to search AniList.
      </p>
    );
  }

  if (error) {
    return (
      <p className="px-3 py-5 text-center text-sm font-semibold text-muted-foreground">
        {error}
      </p>
    );
  }

  if (isLoading && results.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm font-semibold text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Searching AniList...
      </div>
    );
  }

  if (!isLoading && results.length === 0) {
    return (
      <p className="px-3 py-5 text-center text-sm font-semibold text-muted-foreground">
        No manga found for "{trimmedQuery}".
      </p>
    );
  }

  return (
    <div className={mobile ? "max-h-[55vh] overflow-y-auto" : "max-h-[26rem] overflow-y-auto"}>
      {results.map((manga) => {
        const title = displayTitle(manga);
        const secondaryTitle =
          manga.title.english && manga.title.romaji !== manga.title.english
            ? manga.title.romaji
            : null;

        return (
          <a
            key={manga.id}
            href={`/manga/${manga.id}`}
            onClick={onSelect}
            className="group flex min-h-24 gap-3 border-b border-ink/15 p-3 last:border-b-0 active:bg-accent/45 hover:bg-accent/45 focus:bg-accent/45 focus:outline-none"
          >
            <div className="h-24 w-16 shrink-0 overflow-hidden border border-ink bg-card">
              {manga.coverImage.large && (
                <img
                  src={manga.coverImage.large}
                  alt={`${title} cover`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
            </div>

            <div className="min-w-0 flex-1 py-1">
              <p className="line-clamp-2 font-display text-base leading-tight group-hover:text-primary">
                {title}
              </p>

              {secondaryTitle && (
                <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
                  {secondaryTitle}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {manga.rating !== null && (
                  <span className="flex items-center gap-1 text-foreground">
                    <Star
                      className="h-3 w-3 fill-ink"
                      strokeWidth={2.5}
                    />
                    {manga.rating.toFixed(1)}
                  </span>
                )}

                <span>{formatStatus(manga.status)}</span>

                {manga.volumes !== null && (
                  <span>{manga.volumes} vols</span>
                )}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

export function MangaSearch() {
  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    trimmedQuery,
    reset,
  } = useMangaSearch();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsId = useId();

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (trimmedQuery.length >= MIN_SEARCH_LENGTH) {
      setIsOpen(true);
    }
  }, [trimmedQuery]);

  const closeSearch = () => {
    setIsOpen(false);
    reset();
  };

  return (
    <div ref={containerRef} className="relative w-64">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2"
        strokeWidth={2.5}
      />

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => {
          if (trimmedQuery.length >= MIN_SEARCH_LENGTH) {
            setIsOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
            event.currentTarget.blur();
          }
        }}
        placeholder="Search manga..."
        aria-label="Search manga"
        aria-expanded={isOpen}
        aria-controls={resultsId}
        autoComplete="off"
        className="h-9 w-full border-2 border-ink bg-paper/70 pl-9 pr-9 text-xs font-bold uppercase tracking-wide outline-none placeholder:text-muted-foreground focus:shadow-stamp"
      />

      {isLoading && (
        <LoaderCircle
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      )}

      {isOpen && (
        <div
          id={resultsId}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[22rem] max-w-[calc(100vw-2rem)] border-2 border-ink bg-paper/95 p-2 shadow-stamp backdrop-blur"
        >
          <SearchResults
            results={results}
            isLoading={isLoading}
            error={error}
            trimmedQuery={trimmedQuery}
            onSelect={closeSearch}
          />
        </div>
      )}
    </div>
  );
}

export function MobileMangaSearch() {
  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    trimmedQuery,
    reset,
  } = useMangaSearch();

  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsId = useId();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const closeSearch = () => {
    setIsOpen(false);
    reset();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open manga search"
        className="flex h-11 w-11 items-center justify-center border-2 border-ink bg-paper/70 shadow-stamp-sm transition-transform active:translate-y-px"
      >
        <Search className="h-5 w-5" strokeWidth={2.5} />
      </button>

      {isMounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/25 px-4 pb-8 pt-24 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Search manga"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) {
                closeSearch();
              }
            }}
          >
            <div className="w-full max-w-lg border-2 border-ink bg-paper/95 p-3 shadow-stamp backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between border-b-2 border-ink pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    Manga Labs
                  </p>
                  <p className="font-display text-xl uppercase tracking-tight">
                    Search Manga
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Close search"
                  className="flex h-11 w-11 items-center justify-center border-2 border-ink bg-card transition-colors active:bg-accent/50"
                >
                  <X className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>

              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2"
                  strokeWidth={2.5}
                />

                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search manga..."
                  aria-label="Search manga"
                  aria-controls={resultsId}
                  autoComplete="off"
                  className="h-14 w-full border-2 border-ink bg-card/90 pl-12 pr-12 text-base font-semibold outline-none placeholder:text-muted-foreground focus:shadow-stamp"
                />

                {isLoading && (
                  <LoaderCircle
                    className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div
                id={resultsId}
                className="mt-3 border-2 border-ink bg-paper/95"
              >
                <SearchResults
                  results={results}
                  isLoading={isLoading}
                  error={error}
                  trimmedQuery={trimmedQuery}
                  onSelect={closeSearch}
                  mobile
                />
              </div>

              <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Tap outside or press Esc to close
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
