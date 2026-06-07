import { runQuery } from "../../lib/neo4j.js";
import { verifyToken } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const user = verifyToken(req);
    const { videoId } = req.query;

    if (!videoId) {
      return res.status(400).json({ message: "Video requerido" });
    }

    const records = await runQuery(
      `
      MATCH (u:Usuario)-[:SUBIO]->(v:Video {id: $videoId})
      MATCH (me:Usuario {id: $userId})
      OPTIONAL MATCH (v)<-[:DIO_LIKE]-(l:Usuario)
      OPTIONAL MATCH (v)<-[:VIO]-(viewer:Usuario)
      OPTIONAL MATCH (v)<-[:PERTENECE_A]-(c:Comentario)
      OPTIONAL MATCH (me)-[follow:SIGUE]->(u)
      OPTIONAL MATCH (me)-[myLike:DIO_LIKE]->(v)
      RETURN v, u.username AS autor, u.id AS autorId,
             count(DISTINCT follow) > 0 AS isFollowing,
             count(DISTINCT myLike) > 0 AS likedByMe,
             count(DISTINCT l) AS likes,
             count(DISTINCT viewer) AS vistas,
             count(DISTINCT c) AS comentarios
      LIMIT 1
      `,
      { videoId, userId: user.id }
    );

    if (records.length === 0) {
      return res.status(404).json({ message: "Video no encontrado" });
    }

    const record = records[0];

    return res.json({
      ...record.get("v").properties,
      autor: record.get("autor"),
      autorId: record.get("autorId"),
      isFollowing: record.get("isFollowing"),
      likedByMe: record.get("likedByMe"),
      likes: record.get("likes").toNumber(),
      vistas: record.get("vistas").toNumber(),
      comentarios: record.get("comentarios").toNumber(),
    });
  } catch (error) {
    return res.status(401).json({ message: "No autorizado" });
  }
}
