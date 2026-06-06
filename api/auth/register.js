import bcrypt from "bcryptjs";
import { runQuery } from "../../lib/neo4j.js";
import { createToken } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const records = await runQuery(
      `
      CREATE (u:Usuario {
        id: randomUUID(),
        username: $username,
        email: $email,
        password: $passwordHash,
        createdAt: datetime()
      })
      RETURN u
      `,
      { username, email, passwordHash }
    );

    const user = records[0].get("u").properties;
    const token = createToken(user);

    return res.status(201).json({ user, token });
  } catch (error) {
    return res.status(500).json({ message: "Error al registrar usuario" });
  }
}