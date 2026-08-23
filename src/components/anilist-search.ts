const ANILIST_API = "https://graphql.anilist.co";

export type MangaSearchResult = {
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

type RawSearchManga = {
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
};

type AniListSearchResponse = {
  data?: {
    Page?: {
      media?: RawSearchManga[] | null;
    } | null;
  };
  errors?: Array<{ message?: string }>;
};

const SEARCH_MANGA_QUERY = `
  query ($search: String!, $perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(search: $search, type: MANGA, isAdult: false) {
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

const searchCache = new Map<string, MangaSearchResult[]>();

export async function searchMangaTitles(
  search: string,
  limit = 6,
  signal?: AbortSignal,
): Promise<MangaSearchResult[]> {
  const query = search.trim();

  if (query.length < 3) return [];

  const safeLimit = Math.min(Math.max(limit, 1), 8);
  const cacheKey = `${query.toLowerCase()}::${safeLimit}`;
  const cached = searchCache.get(cacheKey);

  if (cached) return cached;

  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: SEARCH_MANGA_QUERY,
      variables: {
        search: query,
        perPage: safeLimit,
      },
    }),
    signal,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        "AniList is receiving too many requests. Try again in a moment.",
      );
    }

    throw new Error(`AniList search failed (${response.status}).`);
  }

  const result: AniListSearchResponse = await response.json();

  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || "AniList search failed.");
  }

  const media = result.data?.Page?.media ?? [];

  const mapped = media.map(
    (manga): MangaSearchResult => ({
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
    }),
  );

  searchCache.set(cacheKey, mapped);
  return mapped;
}
