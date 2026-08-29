import { createApp } from "./app";
import { env } from "./lib/env";

const app = createApp();

app.listen(env.PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`[CAPS] Servidor escuchando en 0.0.0.0:${env.PORT} (${env.NODE_ENV})`);
});
