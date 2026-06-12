import { Router } from "express";
import { searchUsername } from "../services/usernameService";
import { ok } from "../types/api";

const router = Router();

router.post("/", async (req, res) => {
  const { username } = req.body;
  const result = await searchUsername(username);
  res.json(ok(result));
});

export default router;
