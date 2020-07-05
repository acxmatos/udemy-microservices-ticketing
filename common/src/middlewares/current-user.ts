import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Content of a JWT payload
interface UserPayload {
  id: string;
  email: string;
}

// Tell TypeScript that Request interface has additional properties
declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const currentUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session?.jwt) {
    return next(); // do nothing and move on since requests without
                   // jwt token is handled by another middleware
  }

  try {
    const payload = jwt.verify(
      req.session.jwt,
      process.env.JWT_KEY! // ! = don't worry, we already verified and this thing exists
    ) as UserPayload;
    req.currentUser = payload;
  } finally {
    next();
  }
};
