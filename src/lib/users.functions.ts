import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";
import { validateCredentials } from "@/lib/auth.functions";

export type AdminUser = { id: string; email: string; created_at: string };

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async (): Promise<AdminUser[]> => {
    const { request } = await import("@/server/db.server");
    const req = await request();
    const { recordset } = await req.query<{ id: string; email: string; created_at: Date }>(
      `SELECT id, email, created_at FROM dbo.users ORDER BY created_at`,
    );
    return recordset.map((u) => ({
      id: u.id.toLowerCase(),
      email: u.email,
      created_at: u.created_at.toISOString(),
    }));
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(validateCredentials)
  .handler(async ({ data }) => {
    const { request, sql, isDuplicateKeyError } = await import("@/server/db.server");
    const { hashPassword } = await import("@/server/crypto.server");
    const req = await request();
    try {
      await req
        .input("email", sql.NVarChar(320), data.email)
        .input("password_hash", sql.NVarChar(256), await hashPassword(data.password))
        .query(`INSERT INTO dbo.users (email, password_hash) VALUES (@email, @password_hash)`);
    } catch (error) {
      if (isDuplicateKeyError(error))
        throw new Error("A user with this email address has already been registered");
      throw error;
    }
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: { userId: string }) => {
    if (!input?.userId) throw new Error("Missing user.");
    return input;
  })
  .handler(async ({ data, context }) => {
    if (data.userId.toLowerCase() === context.user.userId)
      throw new Error("You cannot delete your own account.");
    const { request, sql } = await import("@/server/db.server");
    const req = await request();
    await req
      .input("id", sql.UniqueIdentifier, data.userId)
      .query(`DELETE FROM dbo.users WHERE id = @id`);
    return { ok: true };
  });
