import bcrypt from "bcryptjs";
import { runQuery } from "../../lib/neo4j.js";
import { createToken } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { email, password } = req.body;

    const records = await runQuery(
      `
      MATCH (u:Usuario {email: $email})
      RETURN u
      LIMIT 1
      `,
      { email }
    );

    if (records.length === 0) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const user = records[0].get("u").properties;
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    delete user.password;

    const token = createToken(user);

    return res.json({ user, token });
  } catch (error) {
    return res.status(500).json({ message: "Error al iniciar sesión" });
  }
}