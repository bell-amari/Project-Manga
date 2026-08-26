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

export type StaffProfile = {
  id: number;
  name: PersonName;
  image: {
    large: string;
    medium: string;
  };
  description: string | null;
  gender: string | null;
  age: number | null;
  homeTown: string | null;
  language: string | null;
  primaryOccupations: string[];
  yearsActive: number[] | null;
  siteUrl: string;
  manga: {
    id: number;
    title: {
      english: string | null;
      romaji: string;
      native: string | null;
    };
    coverImage: {
      large: string;
      extraLarge: string;
    };
    averageScore: number | null;
    siteUrl: string;
  }[];
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
    throw new Error(result.errors[0].message);
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
    manga.characters?.edges?.map((edge: any) => ({
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
    manga.staff?.edges?.map((edge: any) => ({
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

const STAFF_FIELDS = `
  staff(perPage: 50) {
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
  characters(perPage: 30) {
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
  const data = await anilistRequest<{
    Page: {
      media: unknown[];
    };
  }>(TOP_MANGA_QUERY, {
    page: 1,
    perPage: limit,
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

  return mapManga(data.Media);
}

const STAFF_BY_ID_QUERY = `
  query ($id: Int!) {
    Staff(id: $id) {
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
      homeTown
      languageV2
      primaryOccupations
      yearsActive
      siteUrl
      staffMedia(page: 1, perPage: 30, type: MANGA, sort: POPULARITY_DESC) {
        nodes {
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
          siteUrl
        }
      }
    }
  }
`;

export async function getStaffById(id: number): Promise<StaffProfile> {
  const data = await anilistRequest<{
    Staff: any;
  }>(STAFF_BY_ID_QUERY, { id });

  const staff = data.Staff;

  return {
    id: staff.id,
    name: {
      full: staff.name?.full ?? "Unknown",
      native: staff.name?.native ?? null,
    },
    image: {
      large: staff.image?.large ?? "",
      medium: staff.image?.medium ?? "",
    },
    description: staff.description ?? null,
    gender: staff.gender ?? null,
    age: staff.age ?? null,
    homeTown: staff.homeTown ?? null,
    language: staff.languageV2 ?? null,
    primaryOccupations: staff.primaryOccupations ?? [],
    yearsActive: staff.yearsActive ?? null,
    siteUrl: staff.siteUrl ?? "",
    manga:
      staff.staffMedia?.nodes?.map((media: any) => ({
        id: media.id,
        title: {
          english: media.title?.english ?? null,
          romaji: media.title?.romaji ?? "",
          native: media.title?.native ?? null,
        },
        coverImage: {
          large: media.coverImage?.large ?? "",
          extraLarge: media.coverImage?.extraLarge ?? "",
        },
        averageScore: media.averageScore ?? null,
        siteUrl: media.siteUrl ?? "",
      })) ?? [],
  };
}
