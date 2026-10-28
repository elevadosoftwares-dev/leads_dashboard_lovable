import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Settings } from "lucide-react";

import { listApps } from "@/lib/apps.functions";
import { resolveAppIcon } from "@/lib/app-icons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workspace — All Apps in One Place" },
      {
        name: "description",
        content:
          "Quick access to Quotation Hub, SIC Manager, Client Hub, Password Pal, Payable Hub, HRM, WCR and more.",
      },
      { property: "og:title", content: "Workspace — All Apps in One Place" },
      {
        property: "og:description",
        content: "Quick access to all twelve internal web apps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // Runs on the server for the first page load (SSR) and via /_serverFn on client navigation.
  loader: () => listApps(),
  component: Index,
});

// Every icon sits in water cyan on a near-black chip.
const CHIP = "bg-ink text-tide group-hover:bg-tide";
const ARROW = "text-tide";

function Wave() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 12"
      preserveAspectRatio="none"
      className="h-2.5 w-full text-brand"
    >
      <path
        d="M0 8 C 100 2, 200 2, 300 8 S 500 14, 600 8 S 800 2, 900 8 S 1100 14, 1200 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity=".55"
      />
      <path
        d="M0 11 C 100 5, 200 5, 300 11 S 500 17, 600 11 S 800 5, 900 11 S 1100 17, 1200 11"
        fill="none"
        stroke="var(--tide)"
        strokeWidth="1"
        opacity=".5"
      />
    </svg>
  );
}

function Index() {
  const apps = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-background">
      <div aria-hidden="true" className="canopy-rule h-[3px] w-full" />
      <div className="px-5 py-7 md:px-8 md:py-9">
        <div className="mx-auto max-w-5xl">
          <header className="mb-5 border-b border-border pb-4">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand">
                  Canopy &amp; Shore
                </p>
                <h1 className="mt-1.5 font-display text-3xl leading-none text-foreground md:text-4xl">
                  Workspace<span className="text-tide">.</span>
                </h1>
                <p className="mt-2 text-xs text-muted-foreground">
                  Pick a tile to open the tool in a new tab.
                </p>
              </div>
              <p className="shrink-0 rounded-full bg-brand-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                {apps.length} apps
              </p>
            </div>
            <div className="mt-4">
              <Wave />
            </div>
          </header>

          {apps.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No apps have been added yet.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {apps.map((a, i) => {
              const Icon = resolveAppIcon(a.icon);
              return (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tile group flex flex-col rounded-xl border border-border bg-card p-3.5"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 group-hover:text-ink ${CHIP}`}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    </span>
                    <ArrowUpRight
                      className={`h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${ARROW}`}
                    />
                  </div>
                  <h2 className="mt-3 truncate text-[13px] font-semibold leading-snug text-card-foreground">
                    {a.name}
                  </h2>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                    {a.description}
                  </p>
                </a>
              );
            })}
          </div>

          <footer className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1" aria-hidden="true">
                <span className="h-1.5 w-1.5 rounded-full bg-forest" />
                <span className="h-1.5 w-1.5 rounded-full bg-sand-deep" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                <span className="h-1.5 w-1.5 rounded-full bg-tide" />
              </span>
              <span>Forest · Sand · Water</span>
            </span>
            <Link
              to="/admin"
              className="flex items-center gap-1.5 normal-case tracking-normal hover:text-foreground"
            >
              <Settings className="h-3 w-3" /> Manage apps
            </Link>
          </footer>
        </div>
      </div>
    </main>
  );
}
