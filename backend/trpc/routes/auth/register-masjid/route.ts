import { t } from "../../../create-context";
import { z } from "zod";

export const registerMasjidRouter = t.router({
  create: t.procedure
    .input(
      z.object({
        masjidName: z.string().min(1, "Masjid name is required"),
        adminName: z.string().min(1, "Admin name is required"),
        phoneNumber: z.string().min(10, "Valid phone number is required"),
        email: z.string().email("Valid email is required"),
        address: z.string().min(1, "Address is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ input }) => {
      console.log("Register Masjid:", input);

      return {
        success: true,
        message: "Masjid registered successfully",
        masjidId: Math.random().toString(36).substring(7),
      };
    }),
});

export default registerMasjidRouter;
