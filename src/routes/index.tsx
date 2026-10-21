import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, LayoutGrid, Settings } from "lucide-react";

import { listApps } from "@/lib/apps.functions";
import { resolveAppImage } from "@/lib/app-images";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workspace — All Apps in One Place" },
      {
        name: "description",
        content: "Quick access to Quotation Hub, SIC Manager, Client Hub, Password Pal and more.",
      },
      { property: "og:title", content: "Workspace — All Apps in One Place" },
      { property: "og:description", content: "Quick access to all eight internal web apps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // Runs on the server for the first page load (SSR) and via /_serverFn on client navigation.
  loader: () => listApps(),
  component: Index,
});

function Index() {
  const apps = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-background px-6 py-16 md:py-24">
      <div className="mx-auto max-w-7xl">
        <header className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent-foreground">
            Workspace
          </p>
          <h1 className="font-display text-5xl text-foreground md:text-6xl">
            All your apps, one place
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Pick a tile to open the tool you need.
          </p>
        </header>
        {apps.length === 0 ? (
          <p className="text-center text-muted-foreground">No apps have been added yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {apps.map((a, i) => {
              const img = resolveAppImage(a.image);
              return (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tile group flex flex-col overflow-hidden rounded-2xl border bg-card"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="overflow-hidden bg-muted">
                    {img ? (
                      <img
                        src={img}
                        alt={a.name}
                        width={944}
                        height={704}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid aspect-[4/3] w-full place-items-center text-muted-foreground">
                        <LayoutGrid className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 items-start justify-between gap-3 p-5">
                    <div>
                      <h2 className="text-lg font-semibold text-card-foreground">{a.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
        <footer className="mt-16 text-center">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-3.5 w-3.5" /> Manage apps
          </Link>
        </footer>
      </div>
    </main>
  );
}
