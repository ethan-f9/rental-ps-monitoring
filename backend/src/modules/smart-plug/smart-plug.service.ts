import { createHash, createHmac, randomUUID } from "crypto";

type TuyaTokenResponse = {
  success: boolean;
  msg?: string;
  result?: {
    access_token?: string;
  };
};

type TuyaCommandResponse = {
  success: boolean;
  msg?: string;
};

const TUYA_BASE_URL = "https://openapi.tuyaus.com";
const EMPTY_BODY_SHA256 = createHash("sha256").update("").digest("hex");

class SmartPlugError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmartPlugError";
  }
}

const createBodyHash = (body: string) => createHash("sha256").update(body).digest("hex");

const createSignature = ({
  clientId,
  clientSecret,
  timestamp,
  nonce,
  method,
  path,
  body,
  accessToken
}: {
  clientId: string;
  clientSecret: string;
  timestamp: string;
  nonce: string;
  method: string;
  path: string;
  body: string;
  accessToken?: string;
}) => {
  const bodyHash = body ? createBodyHash(body) : EMPTY_BODY_SHA256;
  const stringToSign = [method.toUpperCase(), bodyHash, "", path].join("\n");
  const payload = `${clientId}${accessToken ?? ""}${timestamp}${nonce}${stringToSign}`;

  return createHmac("sha256", clientSecret).update(payload).digest("hex").toUpperCase();
};

const createHeaders = ({
  clientId,
  clientSecret,
  method,
  path,
  body,
  accessToken
}: {
  clientId: string;
  clientSecret: string;
  method: string;
  path: string;
  body?: string;
  accessToken?: string;
}) => {
  const timestamp = Date.now().toString();
  const nonce = randomUUID();

  return {
    sign_method: "HMAC-SHA256",
    client_id: clientId,
    t: timestamp,
    nonce,
    ...(accessToken ? { access_token: accessToken } : {}),
    sign: createSignature({
      clientId,
      clientSecret,
      timestamp,
      nonce,
      method,
      path,
      body: body ?? "",
      accessToken
    })
  };
};

const getAccessToken = async (clientId: string, clientSecret: string) => {
  const path = "/v1.0/token?grant_type=1";
  const headers = createHeaders({
    clientId,
    clientSecret,
    method: "GET",
    path
  });

  const response = await fetch(`${TUYA_BASE_URL}${path}`, {
    method: "GET",
    headers
  });
  const data = (await response.json()) as TuyaTokenResponse;

  if (!response.ok || !data.success || !data.result?.access_token) {
    throw new SmartPlugError(data.msg ?? "Failed to get Tuya access token");
  }

  return data.result.access_token;
};

const sendSwitchCommand = async (deviceId: string, clientId: string, clientSecret: string, value: boolean) => {
  const accessToken = await getAccessToken(clientId, clientSecret);
  const path = `/v1.0/devices/${deviceId}/commands`;
  const body = JSON.stringify({
    commands: [{ code: "switch_1", value }]
  });
  const headers = {
    ...createHeaders({
      clientId,
      clientSecret,
      method: "POST",
      path,
      body,
      accessToken
    }),
    "Content-Type": "application/json"
  };

  const response = await fetch(`${TUYA_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body
  });
  const data = (await response.json()) as TuyaCommandResponse;

  if (!response.ok || !data.success) {
    throw new SmartPlugError(data.msg ?? `Failed to turn ${value ? "on" : "off"} smart plug`);
  }
};

export const tuyaService = {
  turnOn(deviceId: string, clientId: string, clientSecret: string) {
    return sendSwitchCommand(deviceId, clientId, clientSecret, true);
  },
  turnOff(deviceId: string, clientId: string, clientSecret: string) {
    return sendSwitchCommand(deviceId, clientId, clientSecret, false);
  }
};
