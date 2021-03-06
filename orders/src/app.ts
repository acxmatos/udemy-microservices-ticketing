import express from "express";
import "express-async-errors"; // enables async error throwing without calling next
import { json } from "body-parser";
import cookieSession from "cookie-session";
import { NotFoundError, errorHandler, currentUser } from "@acxmatos-gittix/common";

import { newOrderRouter } from "./routes/new";
import { showOrderRouter } from "./routes/show";
import { indexOrderRouter } from "./routes/index";
import { deleteOrderRouter } from "./routes/delete";

// Express
const app = express();
app.set("trust proxy", true); // trusts nginx proxy coming through ingress

// Middlewares - Packages/Builtins
app.use(json());
app.use(
  cookieSession({
    signed: false,
    // secure: process.env.NODE_ENV !== "test", // cookies only over https, but https for test environment
    secure: false,
  })
);

// Middlewares - Custom
app.use(currentUser);
app.use(newOrderRouter);
app.use(showOrderRouter);
app.use(indexOrderRouter);
app.use(deleteOrderRouter);

// Handles any invalid route not found in any
// of the router handlers set above
app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };