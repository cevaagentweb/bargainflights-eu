import {
  HistoryStatusFilter,
  readDealHistory,
} from "@/lib/history-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestedStatus = url.searchParams.get("status");
    const status: HistoryStatusFilter =
      requestedStatus === "active" ||
      requestedStatus === "gone" ||
      requestedStatus === "past"
        ? requestedStatus
        : "all";
    const offset = Number(url.searchParams.get("offset") || 0);
    const limit = Number(url.searchParams.get("limit") || 24);
    const history = await readDealHistory({ status, offset, limit });
    return Response.json(history, {
      headers: {
        "Cache-Control":
          "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Unable to read the deal history", error);
    return Response.json(
      { error: "The deal history is temporarily unavailable." },
      { status: 503 },
    );
  }
}
