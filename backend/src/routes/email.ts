import { Router } from "express";
import { lookupEmail } from "../services/emailService";
import { ok } from "../types/api";

const router = Router();

router.post("/", async (req, res) => {
  const { email } = req.body;
  const result = await lookupEmail(email);
  res.json(ok(result));
});

export default router;
