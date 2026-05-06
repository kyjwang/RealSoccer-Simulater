"use client";

import { useEffect, useRef } from "react";

import { lerp } from "@/engine/probability";
import type { MatchEvent } from "@/types/event";
import type { MatchFrame } from "@/types/match";
import type { Team } from "@/types/team";

type Pitch2DProps = {
  frame?: MatchFrame;
  nextFrame?: MatchFrame;
  frameDurationMs: number;
  homeTeam: Team;
  awayTeam: Team;
  playerMeta: Record<string, { number: number; name: string }>;
  currentEvent?: MatchEvent;
};

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;
const PADDING = 36;

const stripeColor = (index: number): string => (index % 2 === 0 ? "#3d9d52" : "#338747");

const mapX = (x: number): number => PADDING + (x / 100) * (CANVAS_WIDTH - PADDING * 2);
const mapY = (y: number): number => PADDING + (y / 100) * (CANVAS_HEIGHT - PADDING * 2);

const drawPitch = (ctx: CanvasRenderingContext2D): void => {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const stripeWidth = (CANVAS_WIDTH - PADDING * 2) / 10;
  for (let i = 0; i < 10; i += 1) {
    ctx.fillStyle = stripeColor(i);
    ctx.fillRect(PADDING + stripeWidth * i, PADDING, stripeWidth + 1, CANVAS_HEIGHT - PADDING * 2);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;
  ctx.strokeRect(PADDING, PADDING, CANVAS_WIDTH - PADDING * 2, CANVAS_HEIGHT - PADDING * 2);

  const midX = CANVAS_WIDTH / 2;
  const midY = CANVAS_HEIGHT / 2;

  ctx.beginPath();
  ctx.moveTo(midX, PADDING);
  ctx.lineTo(midX, CANVAS_HEIGHT - PADDING);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(midX, midY, 62, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(midX, midY, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.strokeRect(PADDING, midY - 100, 130, 200);
  ctx.strokeRect(CANVAS_WIDTH - PADDING - 130, midY - 100, 130, 200);

  ctx.strokeRect(PADDING, midY - 55, 45, 110);
  ctx.strokeRect(CANVAS_WIDTH - PADDING - 45, midY - 55, 45, 110);

  ctx.fillStyle = "#d0d0d0";
  ctx.fillRect(PADDING - 8, midY - 35, 8, 70);
  ctx.fillRect(CANVAS_WIDTH - PADDING, midY - 35, 8, 70);
};

const drawPlayers = (params: {
  ctx: CanvasRenderingContext2D;
  frame: MatchFrame;
  nextFrame?: MatchFrame;
  t: number;
  homeTeam: Team;
  awayTeam: Team;
  playerMeta: Record<string, { number: number; name: string }>;
}): void => {
  for (const player of params.frame.players) {
    const next = params.nextFrame?.players.find((candidate) => candidate.playerId === player.playerId);

    const x = lerp(player.x, next?.x ?? player.x, params.t);
    const y = lerp(player.y, next?.y ?? player.y, params.t);

    const color = player.teamId === params.homeTeam.id ? params.homeTeam.color : params.awayTeam.color;
    const px = mapX(x);
    const py = mapY(y);

    params.ctx.beginPath();
    params.ctx.arc(px, py, 11.5, 0, Math.PI * 2);
    params.ctx.fillStyle = color;
    params.ctx.fill();

    params.ctx.lineWidth = player.hasBall ? 3 : 1;
    params.ctx.strokeStyle = player.hasBall ? "#ffd166" : "#f2f2f2";
    params.ctx.stroke();

    params.ctx.fillStyle = "#091017";
    params.ctx.font = "bold 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    params.ctx.textAlign = "center";
    params.ctx.fillText(String(params.playerMeta[player.playerId]?.number ?? "?"), px, py + 3);
  }
};

const drawBall = (params: { ctx: CanvasRenderingContext2D; frame: MatchFrame; nextFrame?: MatchFrame; t: number }): void => {
  const x = lerp(params.frame.ball.x, params.nextFrame?.ball.x ?? params.frame.ball.x, params.t);
  const y = lerp(params.frame.ball.y, params.nextFrame?.ball.y ?? params.frame.ball.y, params.t);

  const px = mapX(x);
  const py = mapY(y);

  params.ctx.beginPath();
  params.ctx.arc(px, py, 5.5, 0, Math.PI * 2);
  params.ctx.fillStyle = "#fffdf6";
  params.ctx.fill();
  params.ctx.strokeStyle = "#111";
  params.ctx.lineWidth = 1;
  params.ctx.stroke();
};

const drawEventTrail = (params: { ctx: CanvasRenderingContext2D; event?: MatchEvent }): void => {
  if (!params.event?.start || !params.event.end) {
    return;
  }

  const startX = mapX(params.event.start.x);
  const startY = mapY(params.event.start.y);
  const endX = mapX(params.event.end.x);
  const endY = mapY(params.event.end.y);

  params.ctx.beginPath();
  params.ctx.moveTo(startX, startY);
  params.ctx.lineTo(endX, endY);
  params.ctx.strokeStyle = params.event.type === "shot" || params.event.type === "goal" ? "#ffd166" : "rgba(255,255,255,0.75)";
  params.ctx.lineWidth = params.event.type === "goal" ? 4 : 2;
  params.ctx.setLineDash([8, 7]);
  params.ctx.stroke();
  params.ctx.setLineDash([]);
};

const drawLabels = (params: {
  ctx: CanvasRenderingContext2D;
  frame: MatchFrame;
  playerMeta: Record<string, { number: number; name: string }>;
}): void => {
  const carrierId = params.frame.ball.carrierPlayerId;
  if (!carrierId) {
    return;
  }

  const carrier = params.frame.players.find((player) => player.playerId === carrierId);
  if (!carrier) {
    return;
  }

  const meta = params.playerMeta[carrierId];
  if (!meta) {
    return;
  }

  const px = mapX(carrier.x);
  const py = mapY(carrier.y);

  const label = `${meta.name}`;

  params.ctx.font = "12px 'Trebuchet MS', Tahoma, sans-serif";
  const width = params.ctx.measureText(label).width + 12;

  params.ctx.fillStyle = "rgba(12, 18, 25, 0.8)";
  params.ctx.fillRect(px - width / 2, py - 27, width, 16);

  params.ctx.fillStyle = "#f8f8f8";
  params.ctx.textAlign = "center";
  params.ctx.fillText(label, px, py - 15);
};

export function Pitch2D({
  frame,
  nextFrame,
  frameDurationMs,
  homeTeam,
  awayTeam,
  playerMeta,
  currentEvent
}: Pitch2DProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frame) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let animationFrame = 0;
    const start = performance.now();

    const render = (now: number): void => {
      const t = nextFrame ? Math.min((now - start) / frameDurationMs, 1) : 0;

      drawPitch(ctx);
      drawEventTrail({ ctx, event: currentEvent });
      drawPlayers({
        ctx,
        frame,
        nextFrame,
        t,
        homeTeam,
        awayTeam,
        playerMeta
      });
      drawBall({ ctx, frame, nextFrame, t });
      drawLabels({ ctx, frame, playerMeta });

      if (nextFrame && t < 1) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [frame, nextFrame, frameDurationMs, homeTeam, awayTeam, playerMeta, currentEvent]);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/50 p-2">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="h-auto w-full rounded-lg bg-[#2a793f]"
      />
    </section>
  );
}
