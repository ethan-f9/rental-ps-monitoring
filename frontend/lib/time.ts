const pad = (value: number) => value.toString().padStart(2, "0");

export const formatCountdown = (targetTime: string | null) => {
  if (!targetTime) {
    return "--:--:--";
  }

  const remainingMs = new Date(targetTime).getTime() - Date.now();

  if (remainingMs <= 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
};

export const formatCurrency = (value: string | number | null | undefined) => {
  const numericValue = typeof value === "string" ? Number(value) : value ?? 0;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
};
