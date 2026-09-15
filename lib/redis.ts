type RedisSettings = {
  url: string;
  token: string;
};

export function redisSettings(): RedisSettings | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export async function redisCommand<T = unknown>(command: unknown[]): Promise<T> {
  const settings = redisSettings();
  if (!settings) {
    throw new Error("Redis REST environment variables are not configured");
  }

  const response = await fetch(settings.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Redis returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as { result?: T; error?: string };
  if (payload.error) throw new Error(payload.error);
  return payload.result as T;
}

export async function redisPipeline(commands: unknown[][]): Promise<unknown[]> {
  if (commands.length === 0) return [];

  const settings = redisSettings();
  if (!settings) {
    throw new Error("Redis REST environment variables are not configured");
  }

  const response = await fetch(`${settings.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Redis pipeline returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    result?: unknown;
    error?: string;
  }>;
  if (!Array.isArray(payload)) {
    throw new Error("Redis pipeline returned an invalid response");
  }

  return payload.map((item) => {
    if (item.error) throw new Error(item.error);
    return item.result;
  });
}
