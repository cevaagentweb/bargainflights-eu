import { Badge } from "@/components/ui/badge";

export function TripTypeBadge({ tripType }: { tripType: string }) {
  const isRoundTrip = tripType.toLowerCase().includes("round");

  return (
    <Badge
      variant="outline"
      className={
        isRoundTrip
          ? "border-violet-300/40 bg-violet-300/15 font-bold uppercase tracking-[0.1em] text-violet-100"
          : "border-cyan-300/40 bg-cyan-300/15 font-bold uppercase tracking-[0.1em] text-cyan-100"
      }
    >
      {isRoundTrip ? "Round trip" : "One way"}
    </Badge>
  );
}
