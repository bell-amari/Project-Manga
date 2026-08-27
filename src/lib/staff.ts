const ANILIST_API = "https://graphql.anilist.co";

export type StaffProfile = {
  id: number;
  name: {
    full: string;
    native: string | null;
  };
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

type AniListResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

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
      staffMedia(page: 1, perPage: 25, type: MANGA, sort: POPULARITY_DESC) {
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
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: STAFF_BY_ID_QUERY,
      variables: { id },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `AniList staff request failed: ${response.status} ${response.statusText}`
    );
  }

  const result: AniListResponse<{ Staff: any }> = await response.json();

  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join(" | "));
  }

  const staff = result.data?.Staff;

  if (!staff) {
    throw new Error("AniList could not find this staff member.");
  }

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
      staff.staffMedia?.nodes
        ?.filter(Boolean)
        .map((media: any) => ({
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
