import { createMiddleware } from "@tanstack/react-start";

/** Server functions using this require a signed-in administrator and receive it as `context.user`. */
export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { getSessionUser } = await import("@/server/auth.server");
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized: please sign in again.");
  return next({ context: { user } });
});
