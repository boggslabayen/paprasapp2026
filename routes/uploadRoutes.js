const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { spacesClient } = require("../config/spacesClient");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Images only"));
    cb(null, true);
  }
});

router.post("/upload-banner", upload.single("banner"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const bucket = process.env.DO_SPACES_BUCKET;

    const ext = req.file.originalname.split(".").pop()?.toLowerCase() || "jpg";
    const key = `banners/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;

    await spacesClient.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: "public-read"
      })
    );

    const publicUrl = `${process.env.DO_SPACES_PUBLIC_BASE}/${key}`;
    return res.json({ url: publicUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
});

module.exports = router; // ✅ export the router itself
