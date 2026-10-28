import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, UserPlus } from "lucide-react";

import { deleteApp, listAllApps, saveApp, type AppInput, type AppTile } from "@/lib/apps.functions";
import { createUser, deleteUser, listUsers } from "@/lib/users.functions";
import { appIcons, resolveAppIcon } from "@/lib/app-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Manage apps | Workspace" }] }),
  component: AdminPage,
});

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

function AdminPage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-foreground">Administration</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Changes here are saved to SQL Server and show on the home page immediately.
      </p>
      <Tabs defaultValue="apps" className="mt-8">
        <TabsList>
          <TabsTrigger value="apps">Apps</TabsTrigger>
          <TabsTrigger value="users">Administrators</TabsTrigger>
        </TabsList>
        <TabsContent value="apps" className="mt-6">
          <AppsPanel />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <UsersPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------------------------- Apps ---------------------------------- */

const emptyApp: AppInput = {
  name: "",
  description: "",
  url: "",
  icon: "",
  sortOrder: 0,
  isActive: true,
};

function AppsPanel() {
  const queryClient = useQueryClient();
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["apps", "all"],
    queryFn: () => listAllApps(),
  });
  const [editing, setEditing] = useState<AppInput | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => deleteApp({ data: { id } }),
    onSuccess: () => {
      toast.success("App deleted.");
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const nextOrder = apps.reduce((max, a) => Math.max(max, a.sortOrder), 0) + 1;

  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center justify-between gap-4 border-b p-4">
        <h2 className="font-semibold text-card-foreground">App tiles</h2>
        <Button size="sm" onClick={() => setEditing({ ...emptyApp, sortOrder: nextOrder })}>
          <Plus className="size-4" /> Add app
        </Button>
      </div>
      {isLoading ? (
        <div className="grid place-items-center p-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Order</TableHead>
              <TableHead>App</TableHead>
              <TableHead className="hidden md:table-cell">Web address</TableHead>
              <TableHead className="w-24">Visible</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((app) => (
              <AppRow
                key={app.id}
                app={app}
                onEdit={() => setEditing(app)}
                onDelete={() => {
                  if (confirm(`Delete "${app.name}"?`)) remove.mutate(app.id);
                }}
              />
            ))}
            {apps.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No apps yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      <AppDialog app={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function AppRow({
  app,
  onEdit,
  onDelete,
}: {
  app: AppTile;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = resolveAppIcon(app.icon);
  return (
    <TableRow>
      <TableCell>{app.sortOrder}</TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink text-tide">
            <Icon className="size-[18px]" strokeWidth={1.75} />
          </span>
          <div>
            <div className="font-medium">{app.name}</div>
            <div className="text-xs text-muted-foreground">{app.description}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden max-w-xs truncate md:table-cell">
        {app.url === "#" ? <span className="text-muted-foreground">Not set</span> : app.url}
      </TableCell>
      <TableCell>{app.isActive ? "Yes" : "Hidden"}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${app.name}`}>
          <Pencil className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label={`Delete ${app.name}`}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

const DEFAULT_ICON = "__default__";

function AppDialog({ app, onClose }: { app: AppInput | null; onClose: () => void }) {
  return (
    <Dialog open={app !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {/* Keyed so the form resets each time a different app is opened. */}
        {app && <AppForm key={app.id ?? "new"} initial={app} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function AppForm({ initial, onClose }: { initial: AppInput; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AppInput>({
    ...initial,
    url: initial.url === "#" ? "" : initial.url,
  });

  const save = useMutation({
    mutationFn: (data: AppInput) => saveApp({ data }),
    onSuccess: () => {
      toast.success(initial.id ? "App updated." : "App added.");
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const set = <K extends keyof AppInput>(key: K, value: AppInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const PreviewIcon = resolveAppIcon(form.icon);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(form);
      }}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle>{initial.id ? "Edit app" : "Add app"}</DialogTitle>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="app-name">Name</Label>
        <Input
          id="app-name"
          required
          maxLength={100}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="app-desc">Description</Label>
        <Textarea
          id="app-desc"
          rows={2}
          maxLength={300}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="app-url">Web address</Label>
        <Input
          id="app-url"
          type="url"
          placeholder="https://..."
          value={form.url}
          onChange={(e) => set("url", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty if the address is not known yet.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink text-tide">
            <PreviewIcon className="size-[18px]" strokeWidth={1.75} />
          </span>
          <Select
            value={form.icon in appIcons ? form.icon : DEFAULT_ICON}
            onValueChange={(v) => set("icon", v === DEFAULT_ICON ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEFAULT_ICON}>Default</SelectItem>
              {Object.entries(appIcons).map(([key, Icon]) => (
                <SelectItem key={key} value={key}>
                  <Icon className="size-4" /> {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-end gap-6">
        <div className="w-28 space-y-2">
          <Label htmlFor="app-order">Order</Label>
          <Input
            id="app-order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
          Visible on home page
        </label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

/* --------------------------------- Users ---------------------------------- */

function UsersPanel() {
  const queryClient = useQueryClient();
  const { user: me } = Route.useRouteContext();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => listUsers(),
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const create = useMutation({
    mutationFn: () => createUser({ data: { email, password } }),
    onSuccess: () => {
      toast.success("Administrator added.");
      setEmail("");
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => deleteUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Administrator removed.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="rounded-2xl border bg-card">
        <div className="border-b p-4">
          <h2 className="font-semibold text-card-foreground">Administrators</h2>
        </div>
        {isLoading ? (
          <div className="grid place-items-center p-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="hidden sm:table-cell">Added</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    {u.email}
                    {u.id === me.userId && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {u.id !== me.userId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${u.email}`}
                        onClick={() => {
                          if (confirm(`Remove ${u.email}?`)) remove.mutate(u.id);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <form
        className="h-fit space-y-4 rounded-2xl border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <h2 className="font-semibold text-card-foreground">Add administrator</h2>
        <div className="space-y-2">
          <Label htmlFor="new-email">Email</Label>
          <Input
            id="new-email"
            type="email"
            required
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">Password</Label>
          <Input
            id="new-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>
        <Button type="submit" className="w-full" disabled={create.isPending}>
          {create.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserPlus className="size-4" />
          )}
          Add
        </Button>
      </form>
    </div>
  );
}
