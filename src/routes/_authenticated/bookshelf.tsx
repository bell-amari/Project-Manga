import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Item = Tables<"bookshelf_items">;
type ShelfStatus = Enums<"shelf_status">;

const STATUSES: ShelfStatus[] = ["owned", "reading", "finished", "wishlist"];

export const Route = createFileRoute("/_authenticated/bookshelf")({
  head: () => ({ meta: [{ title: "My Bookshelf — Manga Labs" }] }),
  component: BookshelfPage,
});

function BookshelfPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<ShelfStatus | "all">("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", status: "owned" as ShelfStatus, rating: 0, notes: "" });

  const load = async () => {
    const { data, error } = await supabase
      .from("bookshelf_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setItems(data ?? []);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const handleAdd = async () => {
    if (!user || !form.title.trim()) return;
    const { error } = await supabase.from("bookshelf_items").insert({
      user_id: user.id,
      title: form.title.trim(),
      author: form.author.trim() || null,
      status: form.status,
      rating: form.rating || null,
      notes: form.notes.trim() || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Added to your shelf");
    setForm({ title: "", author: "", status: "owned", rating: 0, notes: "" });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("bookshelf_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  const handleRate = async (id: string, rating: number) => {
    const { error } = await supabase.from("bookshelf_items").update({ rating }).eq("id", id);
    if (error) return toast.error(error.message);
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, rating } : i)));
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Your Collection</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">My Bookshelf</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 border-2 border-ink font-display uppercase tracking-wider shadow-stamp-sm">
              <Plus className="mr-2 h-4 w-4" /> Add manga
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 border-ink">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase">Add to shelf</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border-2 border-ink" />
              </div>
              <div className="space-y-1.5">
                <Label>Author</Label>
                <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="border-2 border-ink" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ShelfStatus })}>
                  <SelectTrigger className="border-2 border-ink"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="border-2 border-ink" />
              </div>
              <Button onClick={handleAdd} className="h-11 w-full border-2 border-ink font-display uppercase tracking-wider shadow-stamp-sm">
                Add to shelf
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s} ({items.filter((i) => i.status === s).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="mt-12 border-2 border-dashed border-ink/30 p-16 text-center">
          <p className="font-display text-2xl">Your shelf is empty</p>
          <p className="mt-2 text-sm text-muted-foreground">Add the first volume to start tracking.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.id} className="group border-2 border-ink bg-card p-5 transition-transform hover:-translate-y-1 hover:shadow-stamp-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-xl leading-tight">{item.title}</h3>
                  {item.author && <p className="text-sm text-muted-foreground">by {item.author}</p>}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-muted-foreground opacity-0 transition hover:text-primary group-hover:opacity-100"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <span className="mt-3 inline-block border-2 border-ink bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                {item.status}
              </span>
              <div className="mt-4 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => handleRate(item.id, n)} aria-label={`Rate ${n}`}>
                    <Star
                      className={`h-5 w-5 transition ${n <= (item.rating ?? 0) ? "fill-primary text-primary" : "text-ink/30 hover:text-primary"}`}
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>
              {item.notes && <p className="mt-3 border-t border-ink/15 pt-3 text-sm text-muted-foreground">{item.notes}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}