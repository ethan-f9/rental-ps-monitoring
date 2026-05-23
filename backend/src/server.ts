import { createApp } from "./app";
import { env } from "./config/env";
import { startSessionExpiryJob } from "./jobs/sessionExpiry";

const app = createApp();

startSessionExpiryJob();

app.listen(env.port, () => {
  console.log(`Backend server running on port ${env.port}`);
});
