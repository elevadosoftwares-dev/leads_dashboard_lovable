import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";

export type AppTile = {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
};

export type AppInput = Omit<AppTile, "id"> & { id?: string };

type AppRow = {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

const SELECT_APPS = `SELECT id, name, description, url, icon, sort_order, is_active FROM dbo.apps`;

function toTile(row: AppRow): AppTile {
  return {
    id: row.id.toLowerCase(),
    name: row.name,
    description: row.description,
    url: row.url,
    icon: row.icon,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

/** "#" (not set yet) or an absolute http(s) address — blocks javascript: and similar links. */
function isSafeUrl(value: string) {
  return value === "#" || /^https?:\/\/\S+$/i.test(value);
}

/** Tiles for the public home page: visible ones only. */
export const listApps = createServerFn({ method: "GET" }).handler(async () => {
  const { request } = await import("@/server/db.server");
  const req = await request();
  const { recordset } = await req.query<AppRow>(
    `${SELECT_APPS} WHERE is_active = 1 ORDER BY sort_order, name`,
  );
  return recordset.map(toTile);
});

/** Every tile, including hidden ones, for the admin page. */
export const listAllApps = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async () => {
    const { request } = await import("@/server/db.server");
    const req = await request();
    const { recordset } = await req.query<AppRow>(`${SELECT_APPS} ORDER BY sort_order, name`);
    return recordset.map(toTile);
  });

export const saveApp = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: AppInput) => {
    const name = input?.name?.trim() ?? "";
    const url = input?.url?.trim() || "#";
    const icon = input?.icon?.trim() ?? "";
    if (!name || name.length > 100) throw new Error("Name is required (max 100 characters).");
    if (!isSafeUrl(url)) throw new Error("Web address must start with http:// or https://");
    if (icon.length > 50) throw new Error("Icon key must be 50 characters or less.");
    return {
      ...(input.id ? { id: input.id } : {}),
      name,
      description: (input.description ?? "").trim().slice(0, 300),
      url,
      icon,
      sortOrder: Number.isFinite(input.sortOrder) ? Math.trunc(input.sortOrder) : 0,
      isActive: !!input.isActive,
    };
  })
  .handler(async ({ data }) => {
    const { request, sql } = await import("@/server/db.server");
    const req = (await request())
      .input("name", sql.NVarChar(100), data.name)
      .input("description", sql.NVarChar(300), data.description)
      .input("url", sql.NVarChar(2000), data.url)
      .input("icon", sql.NVarChar(50), data.icon)
      .input("sort_order", sql.Int, data.sortOrder)
      .input("is_active", sql.Bit, data.isActive);

    if (data.id) {
      const { rowsAffected } = await req.input("id", sql.UniqueIdentifier, data.id).query(
        `UPDATE dbo.apps
            SET name = @name, description = @description, url = @url, icon = @icon,
                sort_order = @sort_order, is_active = @is_active, updated_at = SYSUTCDATETIME()
          WHERE id = @id`,
      );
      if (!rowsAffected[0]) throw new Error("This app no longer exists.");
    } else {
      await req.query(
        `INSERT INTO dbo.apps (name, description, url, icon, sort_order, is_active)
         VALUES (@name, @description, @url, @icon, @sort_order, @is_active)`,
      );
    }
    return { ok: true };
  });

export const deleteApp = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing app.");
    return input;
  })
  .handler(async ({ data }) => {
    const { request, sql } = await import("@/server/db.server");
    const req = await request();
    await req
      .input("id", sql.UniqueIdentifier, data.id)
      .query(`DELETE FROM dbo.apps WHERE id = @id`);
    return { ok: true };
  });
