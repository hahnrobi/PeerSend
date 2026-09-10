import { DefaultEventsMap, Server, Socket } from 'socket.io';
import {
  ClientReceivedMessages,
  ServerReceivedMessages,
  SocketMessageType,
} from '../../../libs/communication/src/lib/socket-messages';

interface SocketData {
  peerId?: string;
  room?: string;
}

type AppSocket = Socket<
  ServerReceivedMessages,
  ClientReceivedMessages,
  DefaultEventsMap,
  SocketData
>;

const sockets: Record<string, AppSocket> = {};

export const addSocket = (socket: AppSocket) => {
  sockets[socket.id] = socket;
};

export const removeSocket = (socket: AppSocket) => {
  delete sockets[socket.id];
};

export const getSocket = (id: string) => {
  return sockets[id];
};

const leaveCurrentRoom = (socket: AppSocket) => {
  const room = socket.data.room;
  if (!room) {
    return;
  }
  socket.leave(room);
  socket.to(room).emit(SocketMessageType.SV_USER_LEFT, socket.data.peerId);
  socket.data.room = undefined;
};

export const socketHandler = (io: Server, socket: AppSocket) => {
  console.log('Socket connected', socket.id);
  addSocket(socket);

  socket.on('disconnecting', () => {
    leaveCurrentRoom(socket);
  });
  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
    removeSocket(socket);
  });

  socket.on(SocketMessageType.CL_JOIN_ROOM, ({ room, peerId }, ack) => {
    console.log('User joined room', peerId, room);
    // A socket only ever belongs to one room at a time (fresh join, rejoin
    // after reconnect, or switching rooms) - always leave the previous one
    // first so membership never gets stale or duplicated.
    if (socket.data.room && socket.data.room !== room) {
      leaveCurrentRoom(socket);
    }
    socket.data.peerId = peerId;
    socket.data.room = room;
    socket.join(room);
    socket.to(room).emit(SocketMessageType.SV_USER_JOINED, peerId);
    ack?.(room);
  });

  socket.on(SocketMessageType.CL_LEAVE_ROOM, () => {
    console.log('User left room', socket.id, socket.data.room);
    leaveCurrentRoom(socket);
  });

  socket.on(SocketMessageType.CL_LIST_PEERS, (ack) => {
    const currentRoom = socket.data.room;
    console.log('Requesting peers', socket.id, currentRoom);
    if (!currentRoom) {
      console.log('Not in room.', socket.id);
      ack?.([]);
      return;
    }
    const room = io.sockets.adapter.rooms.get(currentRoom);
    if (!room) {
      console.log('Room not found.', socket.id);
      ack?.([]);
      return;
    }
    const peerIds = Array.from(room)
      .map((id) => io.sockets.sockets.get(id)?.data?.peerId)
      .filter((peerId): peerId is string => !!peerId);
    ack?.(peerIds);
  });
};
