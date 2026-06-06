import { runQuery } from "../../lib/neo4j.js";
import { verifyToken } from "../../lib/auth.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const user = verifyToken(req);

      const records = await runQuery(
        `
        MATCH (u:Usuario)-[:SUBIO]->(v:Video)
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
        ORDER BY v.createdAt DESC
        LIMIT 30
        `,
        { userId: user.id }
      );

      const videos = records.map((record) => ({
        ...record.get("v").properties,
        autor: record.get("autor"),
        autorId: record.get("autorId"),
        isFollowing: record.get("isFollowing"),
        likedByMe: record.get("likedByMe"),
        likes: record.get("likes").toNumber(),
        vistas: record.get("vistas").toNumber(),
        comentarios: record.get("comentarios").toNumber(),
      }));

      return res.json(videos);
    }

    if (req.method === "POST") {
      const user = verifyToken(req);
      const { title, description, videoUrl, publicId, thumbnailUrl } = req.body;

      const records = await runQuery(
        `
        MATCH (u:Usuario {id: $userId})
        CREATE (v:Video {
          id: randomUUID(),
          title: $title,
          description: $description,
          videoUrl: $videoUrl,
          publicId: $publicId,
          thumbnailUrl: $thumbnailUrl,
          createdAt: datetime()
        })
        CREATE (u)-[:SUBIO]->(v)
        RETURN v
        `,
        {
          userId: user.id,
          title,
          description,
          videoUrl,
          publicId,
          thumbnailUrl,
        }
      );

      return res.status(201).json(records[0].get("v").properties);
    }

    return res.status(405).json({ message: "Método no permitido" });
  } catch (error) {
    return res.status(500).json({ message: "Error en videos" });
  }
}
