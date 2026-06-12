import { Router } from "express";
import { lookupDNS } from "../services/dnsService";
import { ok } from "../types/api";

const router = Router();

router.post("/", async (req, res) => {
  const { domain } = req.body;
  const result = await lookupDNS(domain);
  res.json(ok(result));
});

export default router;
