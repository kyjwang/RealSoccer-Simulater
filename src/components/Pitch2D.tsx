"use client";

import { useEffect, useRef } from "react";

import { clamp, lerp } from "@/engine/probability";
import type { MatchEvent } from "@/types/event";
import type { MatchFrame } from "@/types/match";
import type { Team } from "@/types/team";

type Pitch2DProps = {
  frame?: MatchFrame;
  nextFrame?: MatchFrame;
  interpolationT: number;
  homeTeam: Team;
  awayTeam: Team;
  playerMeta: Record<string, { number: number; name: string }>;
  currentEvent?: MatchEvent;
};

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;
const PADDING = 40;

const mapX = (x: number): number => PADDING + (x / 100) * (CANVAS_WIDTH - PADDING * 2);
const mapY = (y: number): number => PADDING + (y / 100) * (CANVAS_HEIGHT - PADDING * 2);

const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const drawPitch = (ctx: CanvasRenderingContext2D): void => {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Stadium surround — dark stands
  const surroundGrad = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 80,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7
  );
  surroundGrad.addColorStop(0, "#0f291a");
  surroundGrad.addColorStop(0.55, "#0a1a12");
  surroundGrad.addColorStop(1, "#060e0a");
  ctx.fillStyle = surroundGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Pitch grass with stripe pattern
  const pitchLeft = PADDING;
  const pitchTop = PADDING;
  const pitchRight = CANVAS_WIDTH - PADDING;
  const pitchBottom = CANVAS_HEIGHT - PADDING;
  const pitchW = pitchRight - pitchLeft;
  const pitchH = pitchBottom - pitchTop;

  // Base grass
  const grassBase = ctx.createLinearGradient(pitchLeft, pitchTop, pitchRight, pitchBottom);
  grassBase.addColorStop(0, "#207a42");
  grassBase.addColorStop(0.5, "#1e8a48");
  grassBase.addColorStop(1, "#207a42");
  ctx.fillStyle = grassBase;
  ctx.fillRect(pitchLeft, pitchTop, pitchW, pitchH);

  // Grass stripes (every other stripe slightly darker)
  const stripeCount = 12;
  const stripeW = pitchW / stripeCount;
  for (let i = 0; i < stripeCount; i += 2) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
    ctx.fillRect(pitchLeft + i * stripeW, pitchTop, stripeW, pitchH);
  }

  // Subtle grass texture noise
  ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
  for (let i = 0; i < 200; i++) {
    const rx = pitchLeft + Math.random() * pitchW;
    const ry = pitchTop + Math.random() * pitchH;
    ctx.fillRect(rx, ry, 1, 1);
  }

  // Pitch outline — crisp white lines
  ctx.strokeStyle = "rgba(240, 253, 244, 0.92)";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(pitchLeft, pitchTop, pitchW, pitchH);

  // Halfway line
  const midX = CANVAS_WIDTH / 2;
  ctx.beginPath();
  ctx.moveTo(midX, pitchTop);
  ctx.lineTo(midX, pitchBottom);
  ctx.stroke();

  // Center circle
  const midY = CANVAS_HEIGHT / 2;
  ctx.beginPath();
  ctx.arc(midX, midY, 64, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.beginPath();
  ctx.arc(midX, midY, 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(240, 253, 244, 0.95)";
  ctx.fill();

  // Penalty areas
  ctx.strokeRect(pitchLeft, midY - 105, 135, 210);
  ctx.strokeRect(pitchRight - 135, midY - 105, 135, 210);

  // Goal areas (6-yard box)
  ctx.strokeRect(pitchLeft, midY - 58, 48, 116);
  ctx.strokeRect(pitchRight - 48, midY - 58, 48, 116);

  // Penalty spots
  ctx.beginPath();
  ctx.arc(pitchLeft + 92, midY, 3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(240, 253, 244, 0.9)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(pitchRight - 92, midY, 3, 0, Math.PI * 2);
  ctx.fill();

  // Penalty arcs
  ctx.beginPath();
  ctx.arc(pitchLeft + 92, midY, 50, -0.55, 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(pitchRight - 92, midY, 50, Math.PI - 0.55, Math.PI + 0.55);
  ctx.stroke();

  // Corner arcs
  const cornerR = 10;
  ctx.beginPath();
  ctx.arc(pitchLeft, pitchTop, cornerR, 0, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(pitchRight, pitchTop, cornerR, Math.PI / 2, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(pitchLeft, pitchBottom, cornerR, -Math.PI / 2, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(pitchRight, pitchBottom, cornerR, Math.PI, Math.PI * 1.5);
  ctx.stroke();

  // Goal nets (subtle)
  ctx.strokeStyle = "rgba(240, 253, 244, 0.2)";
  ctx.lineWidth = 1.5;
  // Left goal
  ctx.strokeRect(pitchLeft - 14, midY - 38, 14, 76);
  // Right goal
  ctx.strokeRect(pitchRight, midY - 38, 14, 76);

  // Goal net cross-hatch
  ctx.strokeStyle = "rgba(240, 253, 244, 0.08)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 7; i++) {
    const gy = midY - 38 + (76 / 7) * i;
    ctx.beginPath();
    ctx.moveTo(pitchLeft - 14, gy);
    ctx.lineTo(pitchLeft, gy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pitchRight, gy);
    ctx.lineTo(pitchRight + 14, gy);
    ctx.stroke();
  }
  for (let i = 0; i < 2; i++) {
    const gx = pitchLeft - 14 + 7 + i * 7;
    ctx.beginPath();
    ctx.moveTo(gx, midY - 38);
    ctx.lineTo(gx, midY + 38);
    ctx.stroke();
    const gx2 = pitchRight + 7 + i * 7;
    ctx.beginPath();
    ctx.moveTo(gx2, midY - 38);
    ctx.lineTo(gx2, midY + 38);
    ctx.stroke();
  }
};

const playerPosition = (params: {
  player: MatchFrame["players"][number];
  nextPlayer?: MatchFrame["players"][number];
  t: number;
}): { x: number; y: number } => ({
  x: lerp(params.player.x, params.nextPlayer?.x ?? params.player.x, params.t),
  y: lerp(params.player.y, params.nextPlayer?.y ?? params.player.y, params.t)
});

const drawPlayers = (params: {
  ctx: CanvasRenderingContext2D;
  frame: MatchFrame;
  nextFrame?: MatchFrame;
  t: number;
  homeTeam: Team;
  awayTeam: Team;
  playerMeta: Record<string, { number: number; name: string }>;
}): void => {
  const { ctx } = params;
  const nextById = new Map((params.nextFrame?.players ?? []).map((player) => [player.playerId, player]));

  for (const player of params.frame.players) {
    const position = playerPosition({
      player,
      nextPlayer: nextById.get(player.playerId),
      t: params.t
    });
    const color = player.teamId === params.homeTeam.id ? params.homeTeam.color : params.awayTeam.color;
    const px = mapX(position.x);
    const py = mapY(position.y);

    // Shadow
    ctx.beginPath();
    ctx.ellipse(px + 1.5, py + 2, 11, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fill();

    // Player dot
    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Ring
    ctx.strokeStyle = player.hasBall ? "#fbbf24" : "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = player.hasBall ? 3 : 1.5;
    ctx.stroke();

    // Jersey number
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px 'Oswald', 'Arial Narrow', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(params.playerMeta[player.playerId]?.number ?? "?"), px, py);
  }
};

const interpolateBall = (params: {
  frame: MatchFrame;
  nextFrame?: MatchFrame;
  t: number;
  currentEvent?: MatchEvent;
}): { x: number; y: number } => {
  if (
    params.currentEvent?.start &&
    params.currentEvent.end &&
    (params.currentEvent.type === "pass" ||
      params.currentEvent.type === "shot" ||
      params.currentEvent.type === "goal" ||
      params.currentEvent.type === "dribble" ||
      params.currentEvent.type === "carry")
  ) {
    const start = params.currentEvent.start;
    const end = params.currentEvent.end;
    const controlX = lerp(start.x, end.x, 0.5);
    const controlYOffset = params.currentEvent.type === "shot" || params.currentEvent.type === "goal" ? -8 : -3.5;
    const controlY = lerp(start.y, end.y, 0.5) + controlYOffset;
    const t = params.t;
    const u = 1 - t;
    return {
      x: u * u * start.x + 2 * u * t * controlX + t * t * end.x,
      y: u * u * start.y + 2 * u * t * controlY + t * t * end.y
    };
  }

  return {
    x: lerp(params.frame.ball.x, params.nextFrame?.ball.x ?? params.frame.ball.x, params.t),
    y: lerp(params.frame.ball.y, params.nextFrame?.ball.y ?? params.frame.ball.y, params.t)
  };
};

const drawBall = (params: {
  ctx: CanvasRenderingContext2D;
  frame: MatchFrame;
  nextFrame?: MatchFrame;
  t: number;
  currentEvent?: MatchEvent;
}): void => {
  const ball = interpolateBall(params);
  const px = mapX(ball.x);
  const py = mapY(ball.y);
  const { ctx } = params;

  // Shadow
  ctx.beginPath();
  ctx.ellipse(px + 1, py + 2, 5.5, 3.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fill();

  // Ball
  ctx.beginPath();
  ctx.arc(px, py, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = "#f0fdf4";
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Pentagon pattern hint
  ctx.beginPath();
  ctx.arc(px, py, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  ctx.fill();
};

const drawEventTrail = (params: { ctx: CanvasRenderingContext2D; event?: MatchEvent; t: number }): void => {
  if (!params.event?.start || !params.event.end) {
    return;
  }

  const { ctx } = params;
  const startX = mapX(params.event.start.x);
  const startY = mapY(params.event.start.y);
  const endX = mapX(lerp(params.event.start.x, params.event.end.x, params.t));
  const endY = mapY(lerp(params.event.start.y, params.event.end.y, params.t));

  // Glow
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = params.event.type === "goal"
    ? "rgba(251, 191, 36, 0.25)"
    : params.event.type === "shot"
      ? "rgba(251, 191, 36, 0.18)"
      : "rgba(240, 253, 244, 0.12)";
  ctx.lineWidth = params.event.type === "goal" ? 8 : 5;
  ctx.stroke();

  // Main trail
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = params.event.type === "shot" || params.event.type === "goal"
    ? "#fbbf24"
    : "rgba(240, 253, 244, 0.8)";
  ctx.lineWidth = params.event.type === "goal" ? 3.5 : 2;
  ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
};

const drawLabels = (params: {
  ctx: CanvasRenderingContext2D;
  frame: MatchFrame;
  nextFrame?: MatchFrame;
  t: number;
  playerMeta: Record<string, { number: number; name: string }>;
  currentEvent?: MatchEvent;
}): void => {
  const { ctx } = params;
  const carrierId = params.frame.ball.carrierPlayerId;
  if (!carrierId) {
    return;
  }

  const current = params.frame.players.find((player) => player.playerId === carrierId);
  if (!current) {
    return;
  }

  const next = params.nextFrame?.players.find((player) => player.playerId === carrierId);
  const x = mapX(lerp(current.x, next?.x ?? current.x, params.t));
  const y = mapY(lerp(current.y, next?.y ?? current.y, params.t));
  const label = params.playerMeta[carrierId]?.name;
  if (!label) {
    return;
  }

  // Name tag
  ctx.font = "600 11px 'Inter', 'Segoe UI', sans-serif";
  const width = ctx.measureText(label).width + 14;
  ctx.fillStyle = "rgba(5, 13, 9, 0.82)";
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - 30, width, 18, 3);
  ctx.fill();
  ctx.fillStyle = "#ecfdf5";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y - 21);

  // Event chip
  if (params.currentEvent) {
    const chip = `${params.currentEvent.minute}' ${params.currentEvent.type.toUpperCase()}`;
    ctx.font = "600 10px 'Oswald', 'Arial Narrow', sans-serif";
    const chipW = ctx.measureText(chip).width + 16;
    const chipX = PADDING + 10;
    const chipY = PADDING + 10;

    ctx.fillStyle = "rgba(5, 13, 9, 0.85)";
    ctx.beginPath();
    ctx.roundRect(chipX, chipY, chipW, 22, 4);
    ctx.fill();

    ctx.strokeStyle = params.currentEvent.type === "goal"
      ? "rgba(251, 191, 36, 0.5)"
      : "rgba(52, 211, 153, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = params.currentEvent.type === "goal" ? "#fbbf24" : "#6ee7b7";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(chip, chipX + 8, chipY + 11);
  }
};

export function Pitch2D({
  frame,
  nextFrame,
  interpolationT,
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

    const t = nextFrame ? easeInOutCubic(clamp(interpolationT, 0, 1)) : 0;
    drawPitch(ctx);
    drawEventTrail({ ctx, event: currentEvent, t });
    drawPlayers({
      ctx,
      frame,
      nextFrame,
      t,
      homeTeam,
      awayTeam,
      playerMeta
    });
    drawBall({ ctx, frame, nextFrame, t, currentEvent });
    drawLabels({ ctx, frame, nextFrame, t, playerMeta, currentEvent });
  }, [awayTeam, currentEvent, frame, homeTeam, interpolationT, nextFrame, playerMeta]);

  return (
    <section className="overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-stadium via-surface to-stadium p-1.5 shadow-pitch">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="h-auto w-full rounded-lg" />
    </section>
  );
}
