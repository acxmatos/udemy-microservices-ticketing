import express from "express";
import "express-async-errors"; // enables async error throwing without calling next
import { json } from "body-parser";
import cookieSession from "cookie-session";
import { NotFoundError, errorHandler, currentUser } from "@acxmatos-gittix/common";

import { createChargeRouter } from "./routes/new";

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
app.use(currentUser);
app.use(createChargeRouter);

// Handles any invalid route not found in any
// of the router handlers set above
app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };