import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Star } from "lucide-react";
import { getStaffById } from "@/lib/staff";

export const Route = createFileRoute("/staff/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid staff ID.");
    }

    return getStaffById(id);
  },
  component: StaffDetailPage,
});

function cleanDescription(description: string | null) {
  if (!description) return "No biography is available for this staff member yet.";

  return description
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function StaffDetailPage() {
  const staff = Route.useLoaderData();
  const biography = cleanDescription(staff.description);

  return (
    <div className="ml-page">
      <section className="ml-section">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-14">
            <div>
              <div className="ml-card ml-card--strong overflow-hidden">
                {staff.image.large || staff.image.medium ? (
                  <img
                    src={staff.image.large || staff.image.medium}
                    alt={staff.name.full}
                    className="aspect-[3/4] h-full w-full object-cover grayscale"
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center p-6 text-center text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>
            </div>

            <div className="flex min-w-0 flex-col justify-center">
              <div className="flex flex-wrap gap-2">
                <span className="ml-tag">Staff Profile</span>
                {staff.language && <span className="ml-tag-muted">{staff.language}</span>}
              </div>

              <h1 className="mt-5 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                {staff.name.full}
              </h1>

              {staff.name.native && (
                <p className="mt-3 text-lg font-semibold text-muted-foreground">
                  {staff.name.native}
                </p>
              )}

              {staff.primaryOccupations.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {staff.primaryOccupations.map((occupation) => (
                    <span key={occupation} className="ml-chip">
                      {occupation}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <InfoCard label="Age" value={staff.age?.toString() ?? "—"} />
                <InfoCard label="Gender" value={staff.gender ?? "—"} />
                <InfoCard label="Home town" value={staff.homeTown ?? "—"} />
                <InfoCard
                  label="Years active"
                  value={staff.yearsActive?.length ? staff.yearsActive.join("–") : "—"}
                />
              </div>

              <div className="mt-8 border-t-2 border-ink pt-7">
                <p className="whitespace-pre-line text-base leading-7 text-foreground/85">
                  {biography}
                </p>
              </div>

              {staff.siteUrl && (
                <a
                  href={staff.siteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-action mt-8"
                >
                  View on AniList
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="mb-8">
            <p className="ml-kicker">Selected works</p>
            <h2 className="ml-heading mt-2">Manga Credits</h2>
          </div>

          {staff.manga.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {staff.manga.map((manga) => {
                const title = manga.title.english || manga.title.romaji;
                const rating = manga.averageScore
                  ? `${(manga.averageScore / 10).toFixed(1)}/10`
                  : "—";

                return (
                  <Link
                    key={manga.id}
                    to="/manga/$id"
                    params={{ id: String(manga.id) }}
                    className="ml-interactive-card group overflow-hidden"
                  >
                    <div className="aspect-[2/3] overflow-hidden border-b-2 border-ink bg-muted">
                      <img
                        src={manga.coverImage.extraLarge || manga.coverImage.large}
                        alt={`${title} cover`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-xl leading-tight">{title}</h3>
                      <div className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-ink" />
                        {rating}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="ml-empty-state">
              No manga credits are currently available from AniList.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="ml-stat-card">
      <p className="ml-stat-card__label">{label}</p>
      <p className="ml-stat-card__value text-lg sm:text-xl">{value}</p>
    </div>
  );
}
