import jwt from "jsonwebtoken";

export function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(req) {
  const auth = req.headers.authorization;

  if (!auth) {
    throw new Error("Token no enviado");
  }

  const token = auth.replace("Bearer ", "");
  return jwt.verify(token, process.env.JWT_SECRET);
}