import { runQuery } from "../../lib/neo4j.js";
import { verifyToken } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const user = verifyToken(req);
    const { videoId } = req.body;

    const existing = await runQuery(
      `
      MATCH (u:Usuario {id: $userId})-[like:DIO_LIKE]->(v:Video {id: $videoId})
      RETURN like
      LIMIT 1
      `,
      { userId: user.id, videoId }
    );

    if (existing.length > 0) {
      await runQuery(
        `
        MATCH (u:Usuario {id: $userId})-[like:DIO_LIKE]->(v:Video {id: $videoId})
        DELETE like
        `,
        { userId: user.id, videoId }
      );

      return res.json({ liked: false, message: "Like eliminado" });
    }

    await runQuery(
      `
      MATCH (u:Usuario {id: $userId})
      MATCH (v:Video {id: $videoId})
      MERGE (u)-[:DIO_LIKE]->(v)
      `,
      { userId: user.id, videoId }
    );

    return res.json({ liked: true, message: "Like registrado" });
  } catch (error) {
    return res.status(500).json({ message: "Error al actualizar like" });
  }
}
