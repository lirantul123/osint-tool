import { Router } from "express";
import { investigatePerson } from "../services/peopleService";
import { ok } from "../types/api";

const router = Router();

router.post("/", async (req, res) => {
  const { name } = req.body;
  const result = await investigatePerson({ name });
  res.json(ok(result));
});

export default router;
