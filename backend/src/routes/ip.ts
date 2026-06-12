import { Router } from "express";
import { lookupIP } from "../services/ipService";
import { ok } from "../types/api";

const router = Router();

router.post("/", async (req, res) => {
  const { ip } = req.body;
  const result = await lookupIP(ip);
  res.json(ok(result));
});

export default router;
