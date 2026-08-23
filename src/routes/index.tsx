import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookMarked, PenTool, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-manga.jpg";
import { useEffect, useState } from "react";
import { getTopManga, type Manga } from "../lib/anilist";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Manga Labs — Top Manga Worldwide & Your Personal Shelf" },
      {
        name: "description",
        content:
          "Discover the world's top-rated manga, rate what you read, build your bookshelf, and craft your own stories as PDFs.",
      },
      { property: "og:title", content: "Manga Labs" },
      { property: "og:description", content: "Top manga worldwide. Your shelf. Your stories." },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: Index,
});

function Index() {
  const [topManga, setTopManga] = useState<Manga[]>([]);
  const [loadingManga, setLoadingManga] = useState(true);
  const [mangaError, setMangaError] = useState<string | null>(null);

  useEffect(() => {
    getTopManga(12)
      .then(setTopManga)
      .catch((error) => {
        console.error("Failed to load AniList manga:", error);
        setMangaError("Unable to load manga right now.");
      })
      .finally(() => {
        setLoadingManga(false);
      });
  }, []);
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b-2 border-ink">
        <div className="absolute inset-0 halftone opacity-[0.04]" aria-hidden />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:py-32">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 border-2 border-ink bg-accent px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-stamp-sm">
              <Trophy className="h-3.5 w-3.5" /> The Wiki for Manga Readers
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              READ.
              <br />
              RATE.
              <br />
              <span className="text-primary">CREATE.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              The global wiki for manga lovers. Track what you own, rate what you read, and publish
              your own panels as PDFs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login">
                <Button
                  size="lg"
                  className="h-12 border-2 border-ink font-display uppercase tracking-wider shadow-stamp"
                >
                  Start your shelf <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#top-reads">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-2 border-ink font-display uppercase tracking-wider hover:bg-ink hover:text-paper"
                >
                  Browse top reads
                </Button>
              </a>
            </div>
          </div>
          <div className="relative">
            <div
              className="absolute -inset-4 border-2 border-ink bg-primary translate-x-3 translate-y-3"
              aria-hidden
            />
            <img
              src={heroImg}
              alt="Stack of manga volumes bursting with ink splashes"
              width={1600}
              height={1200}
              className="relative h-full w-full border-2 border-ink object-cover"
            />
          </div>
        </div>
      </section>

      {/* TOP READS */}
      <section id="top-reads" className="border-b-2 border-ink bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex items-end justify-between gap-6 border-b-2 border-ink pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Volume 01</p>

              <h2 className="mt-2 font-display text-4xl sm:text-5xl">Top Manga Worldwide</h2>
            </div>

            <p className="hidden max-w-xs text-sm text-muted-foreground md:block">
              Ranked by popularity across the AniList community.
            </p>
          </div>

          {loadingManga && (
            <p className="mt-10 text-sm font-bold uppercase tracking-wide">Loading manga...</p>
          )}

          {mangaError && <p className="mt-10 text-sm font-bold text-red-600">{mangaError}</p>}

          {!loadingManga && !mangaError && (
            <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topManga.map((m) => (
                <li
                  key={m.id}
                  className="group relative border-2 border-ink bg-card transition-transform hover:-translate-y-1 hover:shadow-stamp"
                >
                  <Link
                    to="/manga/$id"
                    params={{ id: String(m.id) }}
                    className="block h-full p-6 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-display text-6xl leading-none text-primary">
                        {String(m.rank).padStart(2, "0")}
                      </span>

                      <span className="flex items-center gap-1 border-2 border-ink bg-accent px-2 py-1 text-xs font-bold">
                        <Star className="h-3 w-3 fill-ink" strokeWidth={2.5} />

                        {m.rating ?? "N/A"}
                      </span>
                    </div>

                    {/* Full manga artwork */}
                    <div className="mt-6 aspect-square w-full border-2 border-ink bg-paper flex items-center justify-center overflow-hidden">
                      <img
                        src={m.coverImage.large}
                        alt={m.title.english || m.title.romaji}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>

                    <h3 className="mt-4 font-display text-2xl leading-tight">
                      {m.title.english || m.title.romaji}
                    </h3>

                    <p className="text-sm text-muted-foreground">by {m.author}</p>

                    <p className="mt-3 text-sm">
                      {m.description
                        ? m.description.replace(/<[^>]*>/g, "").slice(0, 180) + "..."
                        : "No description available."}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-ink/20 pt-3 text-xs font-semibold uppercase tracking-wide">
                      <span>{m.genres[0] ?? "Manga"}</span>

                      <span>{m.volumes !== null ? `${m.volumes} vols` : "Volumes N/A"}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* CREATE & READ */}
      <section className="border-b-2 border-ink bg-ink text-paper">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              Create &amp; Read
            </p>
            <h2 className="mt-2 font-display text-4xl text-paper sm:text-5xl text-white">
              Your panels.
              <br />
              Your story.
              <br />
              <span className="text-primary">Published.</span>
            </h2>
            <p className="mt-6 max-w-md text-paper/70 text-white">
              Sketch chapters in the browser, drop in panels, and export print-ready PDFs the
              community can rate alongside the classics.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/login">
                <Button
                  size="lg"
                  className="h-12 border-2 border-paper bg-primary font-display uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
                >
                  <PenTool className="mr-2 h-5 w-5" /> Start a chapter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BOOKSHELF */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Your Bookshelf
              </p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl">
                Every volume you own — in one place.
              </h2>
              <p className="mt-6 max-w-md text-muted-foreground">
                Log every manga you own, track what you're reading, and rate volumes as you finish
                them. No more duplicate purchases.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Track owned, reading, finished & wishlist",
                  "Personal 1–5 rating system",
                  "Private notes per volume",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center border-2 border-ink bg-accent text-xs font-black">
                      ✓
                    </span>
                    <span className="text-sm font-semibold">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link to="/login">
                  <Button
                    size="lg"
                    className="h-12 border-2 border-ink font-display uppercase tracking-wider shadow-stamp"
                  >
                    <BookMarked className="mr-2 h-5 w-5" /> Build my shelf
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-3 gap-2 border-2 border-ink bg-card p-4 shadow-stamp">
                {topManga.slice(0, 9).map((m) => (
                  <Link
                    key={m.id}
                    to="/manga/$id"
                    params={{ id: String(m.id) }}
                    className="aspect-[2/3] overflow-hidden border border-ink bg-paper transition-transform hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
                    aria-label={`Open ${m.title.english || m.title.romaji}`}
                  >
                    <img
                      src={m.coverImage.large}
                      alt={m.title.english || m.title.romaji}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-ink bg-ink text-paper">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <p className="font-display text-lg">
            MANGA<span className="text-primary">SCOPEIN LABS </span>
          </p>
          <p className="text-xs uppercase tracking-widest text-paper/60">
            © Manga Labs — Read. Rate. Create.
          </p>
        </div>
      </footer>
    </div>
  );
}
