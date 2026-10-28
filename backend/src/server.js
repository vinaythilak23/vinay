import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import incidentRoutes from "./routes/incidents.js";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing. Copy .env.example to .env and configure it.");
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "ResQNow API" }));
app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error." });
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => console.log(`ResQNow API running at http://localhost:${port}`));
