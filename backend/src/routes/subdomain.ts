import { Router } from "express";
import { enumerateSubdomains } from "../services/subdomainService";
import { ok } from "../types/api";

const router = Router();

router.post("/", async (req, res) => {
  const { domain } = req.body;
  const result = await enumerateSubdomains(domain);
  res.json(ok(result));
});

export default router;
