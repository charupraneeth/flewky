import { Socket } from "socket.io-client";

export interface GlobalState {
  IO: Socket;
}

export interface Message {
  content: string;
  isAuthor: boolean;
}
