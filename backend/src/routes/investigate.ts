import { Router } from "express";
import { runInvestigation } from "../services/investigateService";
import { ok } from "../types/api";

const router = Router();

router.post("/", async (req, res) => {
  const { target, page, deepScan } = req.body;
  if (!target) return res.status(400).json({ success: false, error: "Target is required" });

  const result = await runInvestigation(target, {
    page: page ? Number(page) : 1,
    deepScan: deepScan === true || deepScan === "true",
  });
  res.json(ok(result));
});

export default router;
