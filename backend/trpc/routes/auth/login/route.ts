import { t } from "../../../create-context";
import { z } from "zod";

export const loginRouter = t.router({
  signin: t.procedure
    .input(
      z.object({
        phoneNumber: z.string().min(10, "Valid phone number is required"),
        password: z.string().min(1, "Password is required"),
        role: z.enum(["admin", "student"]),
      })
    )
    .mutation(async ({ input }) => {
      console.log("Login:", input);

      const ADMIN_PHONE = "03001234567";
      const ADMIN_PASSWORD = "admin@123";

      if (
        (input.role === "admin" &&
          input.phoneNumber === ADMIN_PHONE &&
          input.password === ADMIN_PASSWORD) ||
        (input.role === "student" && input.phoneNumber === "1234567890" && input.password === "password")
      ) {
        return {
          success: true,
          message: "Login successful",
          user: {
            id: Math.random().toString(36).substring(7),
            phoneNumber: input.phoneNumber,
            role: input.role,
          },
        };
      }

      throw new Error("Invalid credentials");
    }),
});

export default loginRouter;
