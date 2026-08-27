const ANILIST_API = "https://graphql.anilist.co";

export type MangaCharacter = {
  id: number;
  name: { full: string; native: string | null };
  image: { large: string; medium: string };
  description: string | null;
  gender: string | null;
  age: string | null;
  role: string;
  siteUrl: string;
};

export type MangaStaffMember = {
  id: number;
  name: { full: string; native: string | null };
  image: { large: string; medium: string };
  role: string;
  primaryOccupations: string[];
  siteUrl: string;
};

export type MangaExtras = {
  characters: MangaCharacter[];
  staff: MangaStaffMember[];
};

const QUERY = `
  query ($id: Int!) {
    Media(id: $id, type: MANGA) {
      characters(perPage: 25) {
        edges {
          role
          node {
            id
            name { full native }
            image { large medium }
            description
            gender
            age
            siteUrl
          }
        }
      }
      staff(perPage: 25) {
        edges {
          role
          node {
            id
            name { full native }
            image { large medium }
            primaryOccupations
            siteUrl
          }
        }
      }
    }
  }
`;

export async function getMangaExtras(id: number): Promise<MangaExtras> {
  try {
    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query: QUERY, variables: { id } }),
    });

    if (!response.ok) return { characters: [], staff: [] };

    const result = await response.json();
    if (result.errors?.length || !result.data?.Media) {
      return { characters: [], staff: [] };
    }

    return {
      characters:
        result.data.Media.characters?.edges
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
          })) ?? [],
      staff:
        result.data.Media.staff?.edges
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
          })) ?? [],
    };
  } catch (error) {
    console.error("Unable to load optional AniList manga extras:", error);
    return { characters: [], staff: [] };
  }
}
