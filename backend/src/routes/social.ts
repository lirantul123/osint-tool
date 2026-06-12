import { Router } from "express";
import { searchSocial } from "../services/socialService";
import { ok } from "../types/api";

const router = Router();

router.post("/", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ success: false, error: "Query missing" });

  const result = await searchSocial(query);
  res.json(ok(result));
});

export default router;
