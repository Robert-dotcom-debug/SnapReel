import { runQuery } from "../../lib/neo4j.js";
import { verifyToken } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const user = verifyToken(req);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Usuario requerido" });
    }

    await runQuery(
      `
      MATCH (me:Usuario {id: $currentUserId})-[follow:SIGUE]->(target:Usuario {id: $targetUserId})
      DELETE follow
      `,
      { currentUserId: user.id, targetUserId: userId }
    );

    return res.json({ message: "Usuario dejado de seguir" });
  } catch (error) {
    return res.status(401).json({ message: "No autorizado" });
  }
}
