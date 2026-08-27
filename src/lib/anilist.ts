const ANILIST_API = "https://graphql.anilist.co";

export type PersonName = {
  full: string;
  native: string | null;
};

export type MangaCharacter = {
  id: number;
  name: PersonName;
  image: {
    large: string;
    medium: string;
  };
  description: string | null;
  gender: string | null;
  age: string | null;
  role: string;
  siteUrl: string;
};

export type MangaStaffMember = {
  id: number;
  name: PersonName;
  image: {
    large: string;
    medium: string;
  };
  role: string;
  primaryOccupations: string[];
  siteUrl: string;
};

export type Manga = {
  id: number;
  rank?: number;

  title: {
    english: string | null;
    romaji: string;
    native: string | null;
  };

  author: string;

  coverImage: {
    large: string;
    extraLarge: string;
  };

  rating: number | null;
  popularity: number;
  favourites: number;

  description: string | null;

  genres: string[];

  chapters: number | null;
  volumes: number | null;

  status: string;

  siteUrl: string;

  characters: MangaCharacter[];
  staff: MangaStaffMember[];
};

type AniListResponse<T> = {
  data?: T;
  errors?: {
    message: string;
  }[];
};

/**
 * Generic AniList GraphQL request.
 * Every AniList request in the project goes through this function.
 */
async function anilistRequest<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `AniList request failed: ${response.status} ${response.statusText}`
    );
  }

  const result: AniListResponse<T> = await response.json();

  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join(" | "));
  }

  if (!result.data) {
    throw new Error("AniList returned no data.");
  }

  return result.data;
}

function mapManga(manga: any): Manga {
  const author =
    manga.staff?.edges?.find(
      (edge: any) =>
        edge.role?.toLowerCase().includes("story") ||
        edge.role?.toLowerCase().includes("original creator") ||
        edge.role?.toLowerCase().includes("author")
    )?.node?.name?.full ?? "Unknown";

  const characters: MangaCharacter[] =
    manga.characters?.edges
      ?.filter((edge: any) => edge?.node)
      .map((edge: any) => ({
        id: edge.node.id,
        name: {
          full: edge.node.name?.full ?? "Unknown",
          native: edge.node.name?.native ?? null,
        },
        image: {
          large: edge.node.image?.large ?? "",
          medium: edge.node.image?.medium ?? "",
        },
        description: edge.node.description ?? null,
        gender: edge.node.gender ?? null,
        age: edge.node.age ?? null,
        role: edge.role ?? "UNKNOWN",
        siteUrl: edge.node.siteUrl ?? "",
      })) ?? [];

  const staff: MangaStaffMember[] =
    manga.staff?.edges
      ?.filter((edge: any) => edge?.node)
      .map((edge: any) => ({
        id: edge.node.id,
        name: {
          full: edge.node.name?.full ?? "Unknown",
          native: edge.node.name?.native ?? null,
        },
        image: {
          large: edge.node.image?.large ?? "",
          medium: edge.node.image?.medium ?? "",
        },
        role: edge.role ?? "Staff",
        primaryOccupations: edge.node.primaryOccupations ?? [],
        siteUrl: edge.node.siteUrl ?? "",
      })) ?? [];

  return {
    id: manga.id,

    title: {
      english: manga.title?.english ?? null,
      romaji: manga.title?.romaji ?? "",
      native: manga.title?.native ?? null,
    },

    author,

    coverImage: {
      large: manga.coverImage?.large ?? "",
      extraLarge: manga.coverImage?.extraLarge ?? "",
    },

    rating: manga.averageScore
      ? Number((manga.averageScore / 10).toFixed(1))
      : null,

    popularity: manga.popularity ?? 0,
    favourites: manga.favourites ?? 0,
    description: manga.description ?? null,
    genres: manga.genres ?? [],
    chapters: manga.chapters ?? null,
    volumes: manga.volumes ?? null,
    status: manga.status ?? "UNKNOWN",
    siteUrl: manga.siteUrl ?? "",
    characters,
    staff,
  };
}

const BASIC_MANGA_FIELDS = `
  id
  title {
    english
    romaji
    native
  }
  coverImage {
    large
    extraLarge
  }
  averageScore
  popularity
  favourites
  description
  genres
  chapters
  volumes
  status
  siteUrl
`;

// AniList connections cap perPage at 25. Keep these at or below that limit.
const STAFF_FIELDS = `
  staff(perPage: 25) {
    edges {
      role
      node {
        id
        name {
          full
          native
        }
        image {
          large
          medium
        }
        primaryOccupations
        siteUrl
      }
    }
  }
`;

const CHARACTER_FIELDS = `
  characters(perPage: 25) {
    edges {
      role
      node {
        id
        name {
          full
          native
        }
        image {
          large
          medium
        }
        description
        gender
        age
        siteUrl
      }
    }
  }
`;

const TOP_MANGA_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
        ${BASIC_MANGA_FIELDS}
        ${STAFF_FIELDS}
      }
    }
  }
`;

export async function getTopManga(limit = 12): Promise<Manga[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 25);

  const data = await anilistRequest<{
    Page: {
      media: unknown[];
    };
  }>(TOP_MANGA_QUERY, {
    page: 1,
    perPage: safeLimit,
  });

  return data.Page.media.map((manga, index) => ({
    ...mapManga(manga),
    rank: index + 1,
  }));
}

const MANGA_BY_ID_QUERY = `
  query ($id: Int!) {
    Media(id: $id, type: MANGA) {
      ${BASIC_MANGA_FIELDS}
      ${CHARACTER_FIELDS}
      ${STAFF_FIELDS}
    }
  }
`;

export async function getMangaById(id: number): Promise<Manga> {
  const data = await anilistRequest<{
    Media: any;
  }>(MANGA_BY_ID_QUERY, { id });

  if (!data.Media) {
    throw new Error("AniList could not find this manga.");
  }

  return mapManga(data.Media);
}

const MANGA_BY_TITLE_QUERY = `
  query ($search: String!) {
    Media(search: $search, type: MANGA) {
      ${BASIC_MANGA_FIELDS}
      ${STAFF_FIELDS}
    }
  }
`;

export async function getMangaByTitle(title: string): Promise<Manga> {
  const data = await anilistRequest<{
    Media: any;
  }>(MANGA_BY_TITLE_QUERY, {
    search: title,
  });

  if (!data.Media) {
    throw new Error("AniList could not find this manga.");
  }

  return mapManga(data.Media);
}
