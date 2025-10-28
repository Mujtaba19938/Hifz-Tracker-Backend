import { t } from "../../create-context";
import { loginRouter } from "./login/route";
import { registerMasjidRouter } from "./register-masjid/route";
import { forgotPasswordRouter } from "./forgot-password/route";

export const authRouter = t.router({
  login: loginRouter,
  registerMasjid: registerMasjidRouter,
  forgotPassword: forgotPasswordRouter,
});


