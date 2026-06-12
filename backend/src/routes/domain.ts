import { Router } from "express";
import { lookupDomain } from "../services/domainService";
import { ok } from "../types/api";

const router = Router();

router.post("/", async (req, res) => {
  const { domain } = req.body;
  const result = await lookupDomain(domain);
  res.json(ok(result));
});

export default router;
