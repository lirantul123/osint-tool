import express from "express";
import cors from "cors";

import ipRoutes from "./routes/ip";
import domainRoutes from "./routes/domain";
import socialRoutes from "./routes/social";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/ip", ipRoutes);
app.use("/api/domain", domainRoutes);
app.use("/api/social", socialRoutes);

app.listen(5000, () => console.log("Backend running on http://localhost:5000"));
