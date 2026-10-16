export interface ServerToClientEvents {
  [event: string]: (...args: any[]) => void;
}

export interface ClientToServerEvents {
  [event: string]: (...args: any[]) => void;
}

export interface InterServerEvents {
  [event: string]: (...args: any[]) => void;
}


export interface SocketData {
  id: string;
  name: string;
}