import { Socket } from "socket.io-client";

export interface GlobalState {
  IO: Socket;
  email: string;
}

export interface Jiglag {
  email: string;
  token: string;
}

export interface Message {
  content: string;
  isAuthor: boolean;
}
