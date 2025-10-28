import { z } from "zod";
import { t } from "@/backend/trpc/create-context";

export default t.procedure
  .input(z.object({ name: z.string() }))
  .mutation(({ input }) => {
    return {
      hello: input.name,
      date: new Date(),
    };
  });
