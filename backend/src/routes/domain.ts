import { Router } from "express";
import { lookupDomain } from "../services/domainService";

const router = Router();

router.post("/", async (req, res) => {
  const { domain } = req.body;
  const result = await lookupDomain(domain);
  res.json(result);
});

export default router;
