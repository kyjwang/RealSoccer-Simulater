"use client";

import { useEffect, useMemo, useRef } from "react";

import type { MatchEvent } from "@/types/event";
import type { Team } from "@/types/team";

type MatchTimelineProps = {
  events: MatchEvent[];
  teams: Team[];
  currentTick: number;
};

const eventColor = (type: MatchEvent["type"]): string => {
  switch (type) {
    case "goal":
      return "text-emerald-300";
    case "shot":
    case "save":
      return "text-amber-300";
    case "foul":
    case "free_kick":
      return "text-rose-300";
    case "yellow_card":
      return "text-yellow-300";
    case "red_card":
      return "text-red-300";
    case "halftime":
    case "fulltime":
      return "text-sky-300";
    default:
      return "text-slate-200";
  }
};

export function MatchTimeline({ events, teams, currentTick }: MatchTimelineProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleEvents = useMemo(
    () => events.filter((event, index) => (event.tick ?? index) <= currentTick),
    [events, currentTick]
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [visibleEvents.length]);

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-200">Event Timeline</h3>
      <div ref={containerRef} className="max-h-[360px] space-y-2 overflow-y-auto pr-1 text-sm">
        {visibleEvents.length === 0 ? (
          <p className="text-slate-400">No events yet.</p>
        ) : (
          visibleEvents.map((event) => {
            const team = teams.find((candidate) => candidate.id === event.teamId);
            return (
              <div key={event.id} className="rounded border border-slate-700 bg-slate-800/60 px-3 py-2">
                <p className={eventColor(event.type)}>{event.description}</p>
                <p className="text-xs text-slate-400">{team?.shortName ?? "N/A"}</p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
