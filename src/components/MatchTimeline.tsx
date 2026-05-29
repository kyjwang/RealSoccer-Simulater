"use client";

import { useEffect, useMemo, useRef } from "react";

import type { MatchEvent } from "@/types/event";
import type { Team } from "@/types/team";

type MatchTimelineProps = {
  events: MatchEvent[];
  teams: Team[];
  currentTick: number;
};

const eventTone = (type: MatchEvent["type"]): string => {
  switch (type) {
    case "goal":
      return "border-l-cardYellow border-l-4 border-emerald-500/10 bg-cardYellow/5 text-emerald-100";
    case "shot":
    case "save":
      return "border-l-amber-400 border-l-4 border-emerald-500/10 bg-amber-400/5 text-emerald-100";
    case "foul":
    case "free_kick":
      return "border-l-rose-400 border-l-4 border-emerald-500/10 bg-rose-400/5 text-emerald-100";
    case "halftime":
    case "fulltime":
      return "border-l-sky-400 border-l-4 border-emerald-500/10 bg-sky-400/5 text-emerald-100";
    default:
      return "border-l-emerald-500/30 border-l-4 border-emerald-500/10 bg-emerald-500/5 text-emerald-100";
  }
};

const eventIcon = (type: MatchEvent["type"]): string => {
  switch (type) {
    case "goal":
      return "⚽";
    case "shot":
      return "🎯";
    case "save":
      return "🧤";
    case "foul":
      return "🟨";
    case "free_kick":
      return "🦶";
    case "halftime":
      return "⏸";
    case "fulltime":
      return "🏁";
    default:
      return "•";
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
    <section className="rounded-xl border border-emerald-500/20 bg-gradient-to-b from-surface via-panel to-surface p-4 shadow-panel">
      <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.15em] text-emerald-300">
        📋 Event Timeline
      </h3>
      <div ref={containerRef} className="max-h-[360px] space-y-1.5 overflow-y-auto pr-1 text-sm">
        {visibleEvents.length === 0 ? (
          <p className="py-4 text-center text-emerald-100/40">No events yet. Start a match!</p>
        ) : (
          visibleEvents.map((event) => {
            const team = teams.find((candidate) => candidate.id === event.teamId);
            return (
              <div key={event.id} className={`rounded-md px-3 py-2 ${eventTone(event.type)}`}>
                <div className="flex items-start gap-2">
                  <span className="text-base leading-5">{eventIcon(event.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug">{event.description}</p>
                    <p className="mt-0.5 text-xs text-emerald-100/50">
                      {team?.shortName ?? "N/A"} · {event.minute}&apos;
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
