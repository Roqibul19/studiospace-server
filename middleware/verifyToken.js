import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from the environment");
}

export const JWT_COOKIE = "studiospace_token";

export function verifyToken(req, res, next) {
  const token = req.cookies?.[JWT_COOKIE];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized: please login first" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    req.user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      image: payload.image ?? null,
    };
    next();
  } catch {
    res.status(401).send({ message: "Unauthorized: invalid or expired login" });
  }
}
