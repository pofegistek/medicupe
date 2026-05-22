import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { router } from "./routes.js";
import { ensureDefaultProcedures, ensureDefaultSupplements } from "./seed.js";

const app = express();
app.disable("x-powered-by");

app.set("trust proxy", 1);

const corsOrigins = new Set(config.corsAllowedOrigins);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (corsOrigins.has(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"));
    }
  })
);

app.use(
  rateLimit({
    windowMs: config.apiRateLimitWindowMs,
    max: config.apiRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Слишком много запросов. Повторите позже." }
  })
);

app.use(
  "/api/auth/telegram",
  rateLimit({
    windowMs: config.authRateLimitWindowMs,
    max: config.authRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Слишком много попыток авторизации. Повторите позже." }
  })
);

app.use(express.json());
app.use("/api", router);
app.use((error: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error.message === "CORS origin not allowed") {
    return res.status(403).json({ error: "Origin запрещен политикой CORS" });
  }
  return next(error);
});

async function bootstrap() {
  await ensureDefaultProcedures();
  await ensureDefaultSupplements();
  app.listen(config.port, () => {
    console.log(`Medicube backend listening on :${config.port}`);
  });
}

bootstrap().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
