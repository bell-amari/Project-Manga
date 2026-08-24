import { Link, useRouter } from "@tanstack/react-router";
import { BookOpen, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search } from "lucide-react";

export function SiteHeader() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center bg-primary text-primary-foreground shadow-stamp-sm transition-transform group-hover:-rotate-3">
            <BookOpen className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl tracking-tight">
            MANGA<span className="text-primary">LABS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <div className="relative w-64">
  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />

  <input
    type="search"
    placeholder="Search manga..."
    className="h-9 w-full border-2 border-ink bg-paper/70 pl-9 pr-3 text-xs font-bold uppercase tracking-wide outline-none placeholder:text-muted-foreground focus:shadow-stamp"
  />
</div>
          {user && (
            <Link to="/bookshelf" className="text-sm font-semibold uppercase tracking-wide hover:text-primary [&.active]:text-primary">My Shelf</Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/bookshelf">
                <Button variant="ghost" size="sm" className="gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.email?.split("@")[0]}</span>
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="default" size="sm" className="font-display uppercase tracking-wide shadow-stamp-sm border-2 border-ink">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}