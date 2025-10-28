import { t } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { authRouter } from "./routes/auth/route";

export const appRouter = t.router({
  example: t.router({
    hi: hiRoute,
  }),
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
