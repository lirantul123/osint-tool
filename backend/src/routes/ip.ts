import { Router } from "express";
import { lookupIP } from "../services/ipService";

const router = Router();

router.post("/", (req, res) => {
  const { ip } = req.body;
  res.json(lookupIP(ip));
});

export default router;
