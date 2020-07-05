import express from "express";
import "express-async-errors"; // enables async error throwing without calling next
import { json } from "body-parser";
import cookieSession from "cookie-session";
import { NotFoundError, errorHandler } from "@acxmatos-gittix/common";

import { currentUserRouter } from "./routes/current-user";
import { signinRouter } from "./routes/signin";
import { signoutRouter } from "./routes/signout";
import { signupRouter } from "./routes/signup";

// Express
const app = express();
app.set("trust proxy", true); // trusts nginx proxy coming through ingress

// Middlewares - Packages/Builtins
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test", // cookies only over https, but https for test environment
  })
);

// Middlewares - Custom
app.use(currentUserRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(signupRouter);

// Handles any invalid route not found in any
// of the router handlers set above
app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };