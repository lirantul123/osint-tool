import express from "express";
import { getGitHubUser } from "../services/socialService";

const router = express.Router();

router.post("/", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query missing" });

  const user = await getGitHubUser(query);
  res.json(user);
});

export default router;
