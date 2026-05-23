import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  tuyaBaseUrl: process.env.TUYA_BASE_URL ?? "https://openapi.tuyaus.com",
  tuyaClientId: process.env.TUYA_CLIENT_ID ?? "",
  tuyaClientSecret: process.env.TUYA_CLIENT_SECRET ?? "",
  tuyaDeviceId: process.env.TUYA_DEVICE_ID ?? ""
};
