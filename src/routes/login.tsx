import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Manga Labs" },
      { name: "description", content: "Sign in or create an account to build your manga bookshelf." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/bookshelf" });
  }, [user, navigate]);

  const handleEmail = async (mode: "in" | "up") => {
    setLoading(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/bookshelf` },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/bookshelf",
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="border-2 border-ink bg-card p-8 shadow-stamp">
        <Link to="/" className="text-xs font-bold uppercase tracking-widest text-primary">
          ← Manga Labs
        </Link>
        <h1 className="mt-3 font-display text-4xl">Enter the shelf</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to track your manga.</p>

        <Button
          onClick={handleGoogle}
          disabled={loading}
          variant="outline"
          className="mt-6 h-11 w-full border-2 border-ink font-semibold"
        >
          Continue with Google
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-ink/20" /> or <span className="h-px flex-1 bg-ink/20" />
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          {(["signin", "signup"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor={`${tab}-email`}>Email</Label>
                <Input id={`${tab}-email`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border-2 border-ink" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${tab}-pw`}>Password</Label>
                <Input id={`${tab}-pw`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border-2 border-ink" />
              </div>
              <Button
                onClick={() => handleEmail(tab === "signin" ? "in" : "up")}
                disabled={loading || !email || !password}
                className="h-11 w-full border-2 border-ink font-display uppercase tracking-wider shadow-stamp-sm"
              >
                {tab === "signin" ? "Sign in" : "Create account"}
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}