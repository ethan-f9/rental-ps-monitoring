import { completeExpiredSessions } from "../modules/billing/billing.service";

const SESSION_EXPIRY_INTERVAL_MS = 60_000;

export const startSessionExpiryJob = () => {
  const run = async () => {
    try {
      await completeExpiredSessions();
    } catch (error) {
      console.error("Failed to complete expired sessions", error);
    }
  };

  void run();
  return setInterval(() => {
    void run();
  }, SESSION_EXPIRY_INTERVAL_MS);
};
