import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";

import ipRoutes from "./routes/ip";
import domainRoutes from "./routes/domain";
import socialRoutes from "./routes/social";
import dnsRoutes from "./routes/dns";
import subdomainRoutes from "./routes/subdomain";
import emailRoutes from "./routes/email";
import usernameRoutes from "./routes/username";
import investigateRoutes from "./routes/investigate";
import peopleRoutes from "./routes/people";

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    modules: [
      "ip",
      "domain",
      "dns",
      "subdomain",
      "email",
      "username",
      "social",
      "investigate",
      "people",
    ],
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/ip", ipRoutes);
app.use("/api/domain", domainRoutes);
app.use("/api/dns", dnsRoutes);
app.use("/api/subdomain", subdomainRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/username", usernameRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/investigate", investigateRoutes);
app.use("/api/people", peopleRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🔍 OSINT Backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});
