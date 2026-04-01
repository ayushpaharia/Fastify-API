import Fastify from "fastify";
import "dotenv/config";
import { registerCors } from "./plugins/cors.js";
import { registerAuth } from "./plugins/auth.js";
import { registerRateLimit } from "./plugins/rateLimit.js";
import { registerRequestLogger } from "./plugins/requestLogger.js";
import { healthRoutes } from "./routes/health.js";
import { metricsRoutes } from "./routes/metrics.js";
import { endpointRoutes } from "./routes/endpoints.js";
import { userRoutes } from "./routes/users.js";
import { logRoutes } from "./routes/logs.js";
import { authRoutes } from "./routes/auth.js";
import { eventRoutes } from "./routes/events.js";
import { webhookRoutes } from "./routes/webhooks.js";
import { ingestionRoutes } from "./routes/ingestion.js";

const app = Fastify({ logger: true });

async function start() {
  // Plugins (order matters: CORS first, then auth, then rate limit)
  await registerCors(app);
  await registerAuth(app);
  await registerRateLimit(app);
  await registerRequestLogger(app);

  // Routes
  await app.register(healthRoutes);
  await app.register(metricsRoutes);
  await app.register(endpointRoutes);
  await app.register(userRoutes);
  await app.register(logRoutes);
  await app.register(authRoutes);
  await app.register(eventRoutes);
  await app.register(webhookRoutes);
  await app.register(ingestionRoutes);

  const port = parseInt(process.env.PORT || "4000");
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Server running on http://localhost:${port}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
