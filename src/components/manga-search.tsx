import { Link } from "@tanstack/react-router";
import { LoaderCircle, Search, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

export function MangaSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const manga = await searchAniList(trimmedQuery, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setResults(manga);
        setIsOpen(true);
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

        setIsOpen(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, SEARCH_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery]);

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

  const closeSearch = () => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setError(null);
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
          if (
            trimmedQuery.length >= MIN_SEARCH_LENGTH &&
            (results.length > 0 || error)
          ) {
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
        aria-controls="manga-search-results"
        autoComplete="off"
        className="h-9 w-full border-2 border-ink bg-paper/70 pl-9 pr-9 text-xs font-bold uppercase tracking-wide outline-none placeholder:text-muted-foreground focus:shadow-stamp"
      />

      {isLoading && (
        <LoaderCircle
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      )}

      {isOpen && trimmedQuery.length >= MIN_SEARCH_LENGTH && (
        <div
          id="manga-search-results"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[22rem] max-w-[calc(100vw-2rem)] border-2 border-ink bg-paper p-2 shadow-stamp backdrop-blur"
        >
          {error ? (
            <p className="px-3 py-4 text-sm font-semibold text-muted-foreground">
              {error}
            </p>
          ) : !isLoading && results.length === 0 ? (
            <p className="px-3 py-4 text-sm font-semibold text-muted-foreground">
              No manga found for "{trimmedQuery}".
            </p>
          ) : (
            <div className="max-h-[26rem] overflow-y-auto">
              {results.map((manga) => {
                const title = displayTitle(manga);
                const secondaryTitle =
                  manga.title.english &&
                  manga.title.romaji !== manga.title.english
                    ? manga.title.romaji
                    : null;

                return (
                  <Link
                    key={manga.id}
                    to="/manga/$id"
                    params={{ id: String(manga.id) }}
                    onClick={closeSearch}
                    className="group flex gap-3 border-b border-ink/15 p-2 last:border-b-0 hover:bg-accent/45 focus:bg-accent/45 focus:outline-none"
                  >
                    <div className="h-20 w-14 shrink-0 overflow-hidden border border-ink bg-card">
                      {manga.coverImage.large && (
                        <img
                          src={manga.coverImage.large}
                          alt={`${title} cover`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 py-0.5">
                      <p className="truncate font-display text-sm leading-tight group-hover:text-primary">
                        {title}
                      </p>

                      {secondaryTitle && (
                        <p className="mt-1 truncate text-[11px] font-semibold text-muted-foreground">
                          {secondaryTitle}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
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
                  </Link>
                );
              })}
            </div>
          )}

          {isLoading && results.length === 0 && (
            <p className="px-3 py-4 text-sm font-semibold text-muted-foreground">
              Searching AniList...
            </p>
          )}
        </div>
      )}
    </div>
  );
}