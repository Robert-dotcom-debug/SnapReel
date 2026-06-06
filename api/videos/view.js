import { runQuery } from "../../lib/neo4j.js";
import { verifyToken } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const user = verifyToken(req);
    const { videoId } = req.body;

    await runQuery(
      `
      MATCH (u:Usuario {id: $userId})
      MATCH (v:Video {id: $videoId})
      MERGE (u)-[:VIO]->(v)
      `,
      { userId: user.id, videoId }
    );

    return res.json({ message: "Vista registrada" });
  } catch (error) {
    return res.status(500).json({ message: "Error al registrar vista" });
  }
}