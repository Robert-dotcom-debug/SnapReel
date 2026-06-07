import { runQuery } from "../../lib/neo4j.js";
import { verifyToken } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (!["POST", "DELETE"].includes(req.method)) {
    return res.status(405).json({ message: "Metodo no permitido" });
  }

  try {
    const user = verifyToken(req);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Usuario requerido" });
    }

    if (req.method === "POST" && userId === user.id) {
      return res.status(400).json({ message: "No puedes seguirte a ti mismo" });
    }

    if (req.method === "DELETE") {
      await runQuery(
        `
        MATCH (me:Usuario {id: $currentUserId})-[follow:SIGUE]->(target:Usuario {id: $targetUserId})
        DELETE follow
        `,
        { currentUserId: user.id, targetUserId: userId }
      );

      return res.json({ message: "Usuario dejado de seguir" });
    }

    await runQuery(
      `
      MATCH (me:Usuario {id: $currentUserId})
      MATCH (target:Usuario {id: $targetUserId})
      MERGE (me)-[:SIGUE]->(target)
      `,
      { currentUserId: user.id, targetUserId: userId }
    );

    return res.json({ message: "Usuario seguido" });
  } catch (error) {
    return res.status(401).json({ message: "No autorizado" });
  }
}
