import { runQuery } from "../../lib/neo4j.js";
import { verifyToken } from "../../lib/auth.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { videoId } = req.query;

      const records = await runQuery(
        `
        MATCH (c:Comentario)-[:PERTENECE_A]->(v:Video {id: $videoId})
        MATCH (u:Usuario)-[:COMENTO]->(c)
        OPTIONAL MATCH (c)-[:RESPONDE_A]->(parent:Comentario)
        RETURN c, u.username AS autor, parent.id AS respondeA
        ORDER BY c.createdAt ASC
        `,
        { videoId }
      );

      const comments = records.map((record) => ({
        ...record.get("c").properties,
        autor: record.get("autor"),
        respondeA: record.get("respondeA"),
      }));

      return res.json(comments);
    }

    if (req.method === "POST") {
      const user = verifyToken(req);
      const { videoId, text, parentCommentId } = req.body;

      if (parentCommentId) {
        await runQuery(
          `
          MATCH (u:Usuario {id: $userId})
          MATCH (v:Video {id: $videoId})
          MATCH (parent:Comentario {id: $parentCommentId})
          CREATE (c:Comentario {
            id: randomUUID(),
            text: $text,
            createdAt: datetime()
          })
          CREATE (u)-[:COMENTO]->(c)
          CREATE (c)-[:PERTENECE_A]->(v)
          CREATE (c)-[:RESPONDE_A]->(parent)
          RETURN c
          `,
          { userId: user.id, videoId, text, parentCommentId }
        );
      } else {
        await runQuery(
          `
          MATCH (u:Usuario {id: $userId})
          MATCH (v:Video {id: $videoId})
          CREATE (c:Comentario {
            id: randomUUID(),
            text: $text,
            createdAt: datetime()
          })
          CREATE (u)-[:COMENTO]->(c)
          CREATE (c)-[:PERTENECE_A]->(v)
          RETURN c
          `,
          { userId: user.id, videoId, text }
        );
      }

      return res.status(201).json({ message: "Comentario creado" });
    }

    return res.status(405).json({ message: "Método no permitido" });
  } catch (error) {
    return res.status(500).json({ message: "Error en comentarios" });
  }
}