import { Link, useRouter } from "@tanstack/react-router";
import { BookOpen, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  MangaSearch,
  MobileMangaSearch,
} from "@/components/manga-search";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/" });
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="group flex items-center gap-2">
          <div className="brand-mark">
            <BookOpen className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl tracking-tight">
            MANGA<span className="text-primary">LABS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <MangaSearch />

          {user && (
            <Link
              to="/bookshelf"
              className="text-sm font-semibold uppercase tracking-wide hover:text-primary [&.active]:text-primary"
            >
              My Shelf
            </Link>
          )}
        </nav>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden">
          <MobileMangaSearch />
        </div>

        <div className="site-header__actions">
          {user ? (
            <>
              <Link to="/bookshelf">
                <Button variant="ghost" size="sm" className="gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {user.email?.split("@")[0]}
                  </span>
                </Button>
              </Link>

              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button
                variant="default"
                size="sm"
                className="border-2 border-ink font-display uppercase tracking-wide shadow-stamp-sm"
              >
                Sign in
              </Button>
            </Link>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
