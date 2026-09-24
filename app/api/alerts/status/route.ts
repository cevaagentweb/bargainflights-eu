import { redisSettings } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      enabled: Boolean(
        redisSettings() &&
          process.env.WAITLIST_CONTROLLER_NAME &&
          process.env.WAITLIST_PRIVACY_EMAIL,
      ),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
