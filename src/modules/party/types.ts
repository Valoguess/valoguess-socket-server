export type Party = {
  id: string;
  leaderId: string;
  members: PartyMember[];
}

export interface PartyMember {
  id: string;
  name: string;
  socketId: string;
}
