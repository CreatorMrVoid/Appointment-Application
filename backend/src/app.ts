// Core app & server

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import env from "./utils/env";
import authRouter from "./routes/auth_routes";
import appointmentRouter from "./routes/appointment_routes";
import healthRouter from "./routes/health_routes";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middlewares/error";
import healthRoutes from "./routes/health_routes";

const app = express();
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));

// rate limit auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/auth", authLimiter);

app.use("/api/auth", authRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api", healthRouter);

// health display
app.use('/api', healthRoutes);

// central error handler (must be last)
app.use(errorHandler);

export default app;
