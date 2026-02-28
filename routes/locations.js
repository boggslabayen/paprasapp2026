// routes/locations.js
const express = require("express");
const router = express.Router();

const BASE = "https://psgc.cloud";

async function fetchJson(url) {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await r.text();

  if (!r.ok) {
    throw new Error(`HTTP ${r.status} ${url}\n${text.slice(0, 200)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from ${url}\n${text.slice(0, 200)}`);
  }
}

router.get("/regions", async (req, res) => {
  try {
    const regions = await fetchJson(`${BASE}/api/regions`);
    res.json(regions.map(r => ({ code: r.code, name: r.name })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load regions" });
  }
});

// ✅ Provinces under a region (hierarchy endpoint)
router.get("/provinces", async (req, res) => {
  try {
    const { regionCode } = req.query;
    if (!regionCode) return res.status(400).json({ error: "regionCode required" });

    const provinces = await fetchJson(`${BASE}/api/regions/${encodeURIComponent(regionCode)}/provinces`);
    // returns an array
    res.json((provinces || []).map(p => ({ code: p.code, name: p.name })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load provinces" });
  }
});

// ✅ Cities+Municipalities directly under a region (for NCR / special regions)
router.get("/cities-municipalities-by-region", async (req, res) => {
  try {
    const { regionCode } = req.query;
    if (!regionCode) return res.status(400).json({ error: "regionCode required" });

    const items = await fetchJson(`${BASE}/api/regions/${encodeURIComponent(regionCode)}/cities-municipalities`);
     res.set("Content-Type", "application/json; charset=utf-8");
    res.json((items || []).map(x => ({ code: x.code, name: x.name })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load cities/municipalities (region)" });
  }
});

// Cities & Municipalities by province (keep your v1 nested endpoint)
router.get("/cities-municipalities", async (req, res) => {
  try {
    const { provinceCode } = req.query;
    if (!provinceCode) return res.status(400).json({ error: "provinceCode required" });

    const resp = await fetchJson(`${BASE}/api/v2/provinces/${encodeURIComponent(provinceCode)}/cities-municipalities`);
    const items = Array.isArray(resp) ? resp : (resp.data || []);
    res.json(items.map(c => ({ code: c.code, name: c.name })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load cities/municipalities (province)" });
  }
});

module.exports = router;