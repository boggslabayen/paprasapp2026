const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { spacesClient } = require("../config/spacesClient");

const router = express.Router();

function requireDashboardUser(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Please log in to upload images" });
  }
  next();
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Images only"));
    cb(null, true);
  }
});

async function uploadImageToSpaces(file, folder) {
  const bucket = process.env.DO_SPACES_BUCKET;
  const publicBase = process.env.DO_SPACES_PUBLIC_BASE;

  if (!bucket || !publicBase) {
    throw new Error("DigitalOcean Spaces upload is not configured");
  }

  const ext = file.originalname.split(".").pop()?.toLowerCase() || "jpg";
  const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;

  await spacesClient.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read"
    })
  );

  return `${publicBase.replace(/\/$/, "")}/${key}`;
}

router.post("/upload-banner", requireDashboardUser, upload.single("banner"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const publicUrl = await uploadImageToSpaces(req.file, "banners");
    return res.json({ url: publicUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
});

router.post("/upload-content-image", requireDashboardUser, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const publicUrl = await uploadImageToSpaces(req.file, "content");
    return res.json({ url: publicUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
});

module.exports = router; // ✅ export the router itself
