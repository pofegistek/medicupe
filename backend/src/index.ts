import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { router } from "./routes.js";
import { ensureDefaultProcedures } from "./seed.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", router);

async function bootstrap() {
  await ensureDefaultProcedures();
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
