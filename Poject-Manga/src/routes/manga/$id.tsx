import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Heart, Layers3, Star, Users } from "lucide-react";
import { getMangaById } from "@/lib/anilist";

export const Route = createFileRoute("/manga/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid manga ID.");
    }

    return getMangaById(id);
  },
  component: MangaDetailPage,
});

function cleanDescription(description: string | null) {
  if (!description) return "No description is available yet.";

  return description
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function MangaDetailPage() {
  const manga = Route.useLoaderData();
  const title = manga.title.english || manga.title.romaji || manga.title.native || "Untitled manga";
  const description = cleanDescription(manga.description);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper">
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(320px,460px)_1fr] lg:gap-14">
            <div>
              <div className="aspect-square overflow-hidden border-2 border-ink bg-card p-4 shadow-stamp sm:p-6">
                <img
                  src={manga.coverImage.extraLarge || manga.coverImage.large}
                  alt={`${title} cover`}
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border-2 border-ink bg-accent px-3 py-1 text-xs font-bold uppercase tracking-widest">
                  Manga Profile
                </span>
                <span className="border-2 border-ink bg-card px-3 py-1 text-xs font-bold uppercase tracking-widest">
                  {formatStatus(manga.status)}
                </span>
              </div>

              <h1 className="mt-5 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                {title}
              </h1>

              {manga.title.english && manga.title.romaji !== manga.title.english && (
                <p className="mt-3 text-lg font-semibold text-muted-foreground">
                  {manga.title.romaji}
                </p>
              )}

              <p className="mt-4 text-sm font-semibold text-muted-foreground">
                by <span className="text-foreground">{manga.author}</span>
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {manga.genres.map((genre) => (
                  <span key={genre} className="border border-ink bg-card px-3 py-1 text-xs font-bold uppercase tracking-wide">
                    {genre}
                  </span>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard icon={<Star className="h-4 w-4 fill-ink" strokeWidth={2.5} />} label="Rating" value={manga.rating !== null ? `${manga.rating.toFixed(1)}/10` : "—"} />
                <StatCard icon={<Layers3 className="h-4 w-4" strokeWidth={2.5} />} label="Volumes" value={manga.volumes?.toLocaleString() ?? "—"} />
                <StatCard icon={<Users className="h-4 w-4" strokeWidth={2.5} />} label="Popularity" value={manga.popularity.toLocaleString()} />
                <StatCard icon={<Heart className="h-4 w-4" strokeWidth={2.5} />} label="Favorites" value={manga.favourites.toLocaleString()} />
              </div>

              <div className="mt-8 border-t-2 border-ink pt-7">
                <p className="whitespace-pre-line text-base leading-7 text-foreground/85">{description}</p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-ink/20 pt-6 text-sm font-semibold">
                <span>{manga.chapters !== null ? `${manga.chapters} chapters` : "Chapter count unavailable"}</span>
                <span aria-hidden>•</span>
                <span>{manga.volumes !== null ? `${manga.volumes} volumes` : "Volume count unavailable"}</span>
              </div>

              {manga.siteUrl && (
                <a
                  href={manga.siteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex w-fit cursor-pointer items-center gap-2 border-2 border-ink bg-primary px-5 py-3 font-display text-sm uppercase tracking-wider text-primary-foreground shadow-stamp-sm transition-transform hover:-translate-y-0.5"
                >
                  View on AniList
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border-2 border-ink bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-xl sm:text-2xl">{value}</p>
    </div>
  );
}
