import { t } from "../../../create-context";
import { z } from "zod";

export const forgotPasswordRouter = t.router({
  send: t.procedure
    .input(
      z.object({
        phoneNumber: z.string().min(10, "Valid phone number is required"),
      })
    )
    .mutation(async ({ input }) => {
      console.log("Forgot Password:", input);

      return {
        success: true,
        message: "OTP sent to your phone number",
        otpSent: true,
      };
    }),
  reset: t.procedure
    .input(
      z.object({
        phoneNumber: z.string().min(10, "Valid phone number is required"),
        otp: z.string().length(6, "OTP must be 6 digits"),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ input }) => {
      console.log("Reset Password:", input);

      if (input.otp === "123456") {
        return {
          success: true,
          message: "Password reset successfully",
        };
      }

      throw new Error("Invalid OTP");
    }),
});
