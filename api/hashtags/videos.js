import { runQuery } from "../../lib/neo4j.js";
import { verifyToken } from "../../lib/auth.js";

function normalizeTag(tag = "") {
  return tag.replace(/^#/, "").toLowerCase();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const user = verifyToken(req);
    const tag = normalizeTag(req.query.tag);

    if (!tag) {
      return res.status(400).json({ message: "Hashtag requerido" });
    }

    const records = await runQuery(
      `
      MATCH (h:Hashtag {name: $tag})<-[:USA_HASHTAG]-(v:Video)
      MATCH (u:Usuario)-[:SUBIO]->(v)
      MATCH (me:Usuario {id: $userId})
      OPTIONAL MATCH (v)<-[:DIO_LIKE]-(l:Usuario)
      OPTIONAL MATCH (v)<-[:VIO]-(viewer:Usuario)
      OPTIONAL MATCH (v)<-[:PERTENECE_A]-(c:Comentario)
      OPTIONAL MATCH (me)-[follow:SIGUE]->(u)
      OPTIONAL MATCH (me)-[myLike:DIO_LIKE]->(v)
      RETURN v, u.username AS autor, u.id AS autorId, h.name AS hashtag,
             count(DISTINCT follow) > 0 AS isFollowing,
             count(DISTINCT myLike) > 0 AS likedByMe,
             count(DISTINCT l) AS likes,
             count(DISTINCT viewer) AS vistas,
             count(DISTINCT c) AS comentarios
      ORDER BY v.createdAt DESC
      `,
      { tag, userId: user.id }
    );

    const videos = records.map((record) => ({
      ...record.get("v").properties,
      autor: record.get("autor"),
      autorId: record.get("autorId"),
      hashtag: record.get("hashtag"),
      isFollowing: record.get("isFollowing"),
      likedByMe: record.get("likedByMe"),
      likes: record.get("likes").toNumber(),
      vistas: record.get("vistas").toNumber(),
      comentarios: record.get("comentarios").toNumber(),
    }));

    return res.json({ hashtag: tag, videos });
  } catch (error) {
    return res.status(401).json({ message: "No autorizado" });
  }
}
