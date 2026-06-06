import { runQuery } from "../../lib/neo4j.js";
import { verifyToken } from "../../lib/auth.js";

function toNumber(value) {
  return typeof value?.toNumber === "function" ? value.toNumber() : Number(value || 0);
}

function videoFromRecord(record) {
  return {
    ...record.get("v").properties,
    autor: record.get("autor"),
    autorId: record.get("autorId"),
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
    const currentUser = verifyToken(req);
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "Usuario requerido" });
    }

    const [userRecords, uploadedRecords] = await Promise.all([
      runQuery(
        `
        MATCH (u:Usuario {id: $userId})
        MATCH (me:Usuario {id: $currentUserId})
        OPTIONAL MATCH (u)-[:SIGUE]->(following:Usuario)
        OPTIONAL MATCH (u)<-[:SIGUE]-(follower:Usuario)
        OPTIONAL MATCH (me)-[follow:SIGUE]->(u)
        RETURN u,
               count(DISTINCT following) AS siguiendo,
               count(DISTINCT follower) AS seguidores,
               count(DISTINCT follow) > 0 AS isFollowing
        `,
        { userId, currentUserId: currentUser.id }
      ),
      runQuery(
        `
        MATCH (u:Usuario {id: $userId})-[:SUBIO]->(v:Video)
        OPTIONAL MATCH (v)<-[:DIO_LIKE]-(l:Usuario)
        OPTIONAL MATCH (v)<-[:VIO]-(viewer:Usuario)
        OPTIONAL MATCH (v)<-[:PERTENECE_A]-(c:Comentario)
        RETURN v, u.username AS autor, u.id AS autorId,
               count(DISTINCT l) AS likes,
               count(DISTINCT viewer) AS vistas,
               count(DISTINCT c) AS comentarios
        ORDER BY v.createdAt DESC
        `,
        { userId }
      ),
    ]);

    if (userRecords.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const profile = userRecords[0].get("u").properties;
    delete profile.password;
    delete profile.email;

    return res.json({
      user: profile,
      stats: {
        siguiendo: toNumber(userRecords[0].get("siguiendo")),
        seguidores: toNumber(userRecords[0].get("seguidores")),
        videosSubidos: uploadedRecords.length,
        isFollowing: userRecords[0].get("isFollowing"),
      },
      uploadedVideos: uploadedRecords.map((record) => videoFromRecord(record)),
    });
  } catch (error) {
    return res.status(401).json({ message: "No autorizado" });
  }
}
