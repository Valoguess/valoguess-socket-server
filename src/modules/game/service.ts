import { getRoomById, saveRoom } from "../room/service.js";

import { AppError } from "@/shared/utils/error.js";
import { AGENTS } from "@/shared/consts/agents.js";
import type { Player, Room } from "@/shared/consts/types.js";
import { clearTurnTimer, restartTurnTimer, startTurnTimer } from "./timer.js";
import { DIFFICULTY_PERCENTAGES, QUESTIONS, type Question, type QuestionDifficulty, type QuestionId } from "@/shared/consts/questions.js";

function shuffle<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [
      result[j]!,
      result[i]!,
    ];
  }

  return result;
}

export function selectQuestionIds(
  count: number,
): QuestionId[] {
  const questionsByDifficulty: Record<
    QuestionDifficulty,
    QuestionId[]
  > = {
    low: [],
    medium: [],
    high: [],
  };

  for (const [id, question] of Object.entries(QUESTIONS)) {
    questionsByDifficulty[question.difficulty].push(id);
  }

  const lowCount = Math.round(
    count * DIFFICULTY_PERCENTAGES.low,
  );

  const mediumCount = Math.round(
    count * DIFFICULTY_PERCENTAGES.medium,
  );

  const highCount =
    count - lowCount - mediumCount;

  const selected: QuestionId[] = [
    ...shuffle(questionsByDifficulty.low).slice(
      0,
      lowCount,
    ),

    ...shuffle(questionsByDifficulty.medium).slice(
      0,
      mediumCount,
    ),

    ...shuffle(questionsByDifficulty.high).slice(
      0,
      highCount,
    ),
  ];

  return shuffle(selected);
}

export async function startGame(roomId: string, socketId: string): Promise<Room> {
  const room = await getRoomById(roomId);

  if (!room) {
    throw new AppError("Room not found");
  }

  if (room.state !== "waiting") {
    throw new AppError("Game cannot be started");
  }
  
  if (room.players.length < 2) {
    throw new AppError("Not enough players to start the game");
  }

  const player = room.players.find(p => p.socketId === socketId);
  if (!player) {
    throw new AppError("Player not found in the room");
  }

  if (player.id !== room.hostId) {
    throw new AppError("Only the host can start the game");
  }

  const currentTurn = room.players[Math.floor(Math.random() * 2)]!.id;

  room.state = "playing";
  room.game = {
    startedAt: Date.now(),
    currentTurn,
    turnNumber: 1,
    history: [],
    questionPool: selectQuestionIds(room.settings.questionCount),
    playerStates: {},
  };

  const availableAgents = [...AGENTS];
  for (const player of room.players) {
    const randomIndex = Math.floor(Math.random() * availableAgents.length);
    const secretAgent = availableAgents[randomIndex]!.id;
    availableAgents.splice(randomIndex, 1);

    room.game.playerStates[player.id] = {
      secretAgent,
      guess: null,
      nosRemaining: room.settings.maxNos,
      guessesRemaining: room.settings.maxGuesses,
    };
  }

  startTurnTimer(room.id, room.settings.timePerRound*1000)
  room.game.turnEndTime = Date.now() + room.settings.timePerRound * 1000;
  
  await saveRoom(room);
  return room;
}


export async function changeTurn(roomIdentifier: string | Room): Promise<Room> {

  let room =
    typeof roomIdentifier === "string"
      ? await getRoomById(roomIdentifier)
      : roomIdentifier;

  if (!room) {
    throw new AppError("Room not found");
  }

  if (room.state !== "playing") {
    throw new AppError("Game is not currently in progress");
  }

  if (!room.game) {
    throw new AppError("Game state is missing");
  }

  const currentTurn = room.game.currentTurn;
  const nextTurnPlayer = room.players.find((player) => player.id !== currentTurn);
  if (!nextTurnPlayer) {
    throw new AppError("Next turn player not found");
  }
  
  room.game.currentTurn = nextTurnPlayer.id;
  room.game.turnNumber++;
  
  room.game.turnEndTime = Date.now() + room.settings.timePerRound * 1000;
  restartTurnTimer(room.id, room.settings.timePerRound*1000);

  await saveRoom(room);
  return room;
}

export async function gameHeartbeat(roomId: string, socketId: string): Promise<void> {
  const room = await getRoomById(roomId);

  if (!room) {
    throw new AppError("Room not found");
  }

  const player = room.players.find(player => player.socketId === socketId);
  if (!player) {
    throw new AppError("Player not found in the room");
  }

  player.lastHeartbeatAt = Date.now();
  await saveRoom(room);
}


export async function finishGame(
  room: Room,
  winnerId?: string
) {

  if (winnerId) {
    room.game!.winnerId = winnerId;
  } else {
    delete room.game!.winnerId;
  }
  room.state = "finished";
  room.game!.endedAt = Date.now();

  clearTurnTimer(room.id);
  
  return await saveRoom(room);
}

export async function resetGame(roomId: string, socketId: string): Promise<Room> {
  const room = await getRoomById(roomId);

  if (!room) {
    throw new AppError("Room not found");
  }

  const player = room.players.find(player => player.socketId === socketId);
  if (player?.id !== room.hostId) {
    throw new AppError("Only the host can reset the game");
  }

  if (room.state !== "finished") {
    throw new AppError("Game is not finished");
  }

  room.state = "waiting";
  delete room.game;

  await saveRoom(room);
  return room;
}

export async function getCurrentPlayer(roomId: string, socketId: string): Promise<Player> {

  const room = await getRoomById(roomId);
  
  if (!room) {
    throw new AppError("Room not found");
  }

  if (room.state !== "playing") {
    throw new AppError("Game is not currently in progress");
  }

  const currentPlayer = room.players.find(player => player.socketId === socketId);

  if (!currentPlayer) {
    throw new AppError("Player not found in the room");
  }

  return currentPlayer;
}


export async function checkWinCon(roomId: string): Promise<{
  winner: boolean;
  winnerId: string | null;
} | null> {
  const room = await getRoomById(roomId);

  if (!room) {
    throw new AppError("Room not found");
  }

  if (room.state !== "playing") {
    throw new AppError("Game is not currently in progress");
  }

  const players = room.players;
  const playerStates = room.game!.playerStates;
  let winnerId: string | null = null;

  for (const player of players) {
    const state = playerStates[player.id]!;
    if (state.nosRemaining <= 0 || state.guessesRemaining <= 0) {
      if (state.guess === state.secretAgent) {
        winnerId = player.id;
        break;
      }
    }
  }

  return {
    winnerId,
    winner: winnerId !== null,  
  }; 
}