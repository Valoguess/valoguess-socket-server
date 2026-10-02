export interface Player {
  id: string;
  name: string;
  gameId?: string | null;
  partyId?: string | null;
  socketId?: string | null;
  lastHeartbeatAt: number;
}