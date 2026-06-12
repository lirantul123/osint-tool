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

function buildAllowedOrigins(): string[] {
  const origins = new Set<string>([
    "http://localhost:5173",
    "http://localhost:4173",
  ]);

  if (process.env.FRONTEND_URL) {
    origins.add(process.env.FRONTEND_URL.replace(/\/$/, ""));
  }

  return Array.from(origins);
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  const allowed = buildAllowedOrigins();
  if (allowed.includes(origin)) return true;
  if (origin.endsWith(".vercel.app")) return true;
  return false;
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        callback(null, isAllowedOrigin(origin));
      },
      credentials: true,
    })
  );
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

  return app;
}

const app = createApp();
export default app;
