import cloudinary from "cloudinary";
import { verifyToken } from "../../lib/auth.js";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    verifyToken(req);

    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.v2.utils.api_sign_request(
      {
        timestamp,
        folder: "videos_tiktok_clone",
      },
      process.env.CLOUDINARY_API_SECRET
    );

    return res.json({
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: "videos_tiktok_clone",
    });
  } catch (error) {
    return res.status(401).json({ message: "No autorizado" });
  }
}