import { runQuery } from "../../lib/neo4j.js";
import { verifyToken } from "../../lib/auth.js";

function toNumber(value) {
  return typeof value?.toNumber === "function" ? value.toNumber() : Number(value || 0);
}

function videoFromRecord(record, key = "v") {
  return {
    ...record.get(key).properties,
    autor: record.get("autor"),
    likes: toNumber(record.get("likes")),
    vistas: toNumber(record.get("vistas")),
    comentarios: toNumber(record.get("comentarios")),
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const user = verifyToken(req);

    const [userRecords, uploadedRecords, likedRecords] = await Promise.all([
      runQuery(
        `
        MATCH (u:Usuario {id: $userId})
        OPTIONAL MATCH (u)-[:SIGUE]->(following:Usuario)
        OPTIONAL MATCH (u)<-[:SIGUE]-(follower:Usuario)
        RETURN u,
               count(DISTINCT following) AS siguiendo,
               count(DISTINCT follower) AS seguidores
        `,
        { userId: user.id }
      ),
      runQuery(
        `
        MATCH (u:Usuario {id: $userId})-[:SUBIO]->(v:Video)
        OPTIONAL MATCH (v)<-[:DIO_LIKE]-(l:Usuario)
        OPTIONAL MATCH (v)<-[:VIO]-(viewer:Usuario)
        OPTIONAL MATCH (v)<-[:PERTENECE_A]-(c:Comentario)
        RETURN v, u.username AS autor,
               count(DISTINCT l) AS likes,
               count(DISTINCT viewer) AS vistas,
               count(DISTINCT c) AS comentarios
        ORDER BY v.createdAt DESC
        `,
        { userId: user.id }
      ),
      runQuery(
        `
        MATCH (u:Usuario {id: $userId})-[:DIO_LIKE]->(v:Video)
        MATCH (author:Usuario)-[:SUBIO]->(v)
        OPTIONAL MATCH (v)<-[:DIO_LIKE]-(l:Usuario)
        OPTIONAL MATCH (v)<-[:VIO]-(viewer:Usuario)
        OPTIONAL MATCH (v)<-[:PERTENECE_A]-(c:Comentario)
        RETURN v, author.username AS autor,
               count(DISTINCT l) AS likes,
               count(DISTINCT viewer) AS vistas,
               count(DISTINCT c) AS comentarios
        ORDER BY v.createdAt DESC
        `,
        { userId: user.id }
      ),
    ]);

    if (userRecords.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const profile = userRecords[0].get("u").properties;
    delete profile.password;

    return res.json({
      user: profile,
      stats: {
        siguiendo: toNumber(userRecords[0].get("siguiendo")),
        seguidores: toNumber(userRecords[0].get("seguidores")),
        videosSubidos: uploadedRecords.length,
        videosConLike: likedRecords.length,
      },
      uploadedVideos: uploadedRecords.map((record) => videoFromRecord(record)),
      likedVideos: likedRecords.map((record) => videoFromRecord(record)),
    });
  } catch (error) {
    return res.status(401).json({ message: "No autorizado" });
  }
}
