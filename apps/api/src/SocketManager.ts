import { DefaultEventsMap, Server, Socket } from 'socket.io';
import {
  ClientReceivedMessages,
  ServerReceivedMessages,
  SocketMessageType,
} from '../../../libs/communication/src/lib/socket-messages';

const sockets: Record<
  string,
  Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
> = {};

export const addSocket = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  sockets[socket.id] = socket;
};

export const removeSocket = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  delete sockets[socket.id];
};

export const getSocket = (id: string) => {
  return sockets[id];
};

const getUserRooms = (socket: Socket) => {
  const userRooms = Array.from(socket.rooms);
  return userRooms.filter((room) => room !== socket.id);
};
const sendUserLeftMessagesToRooms = (socket: Socket) => {
  const peerId = socket.data.peerId;
  const userRooms = getUserRooms(socket);
  console.log('User rooms', userRooms);
  userRooms.forEach((room) => {
    socket.to(room).emit(SocketMessageType.SV_USER_LEFT, peerId);
  });
};
const sendUserLeftMessageToRoom = (socket: Socket, room: string) => {
  const userId = socket.id;
  socket.to(room).emit(SocketMessageType.SV_USER_LEFT, socket.data.peerId);
};
const sendUserJoinedMessagesToRoom = (socket: Socket, room: string) => {
  socket.to(room).emit(SocketMessageType.SV_USER_JOINED, socket.data.peerId);
};

export const socketHandler = (
  io: Server,
  socket: Socket<
    ServerReceivedMessages,
    ClientReceivedMessages,
    DefaultEventsMap,
    any
  >
) => {
  console.log('Socket connected', socket.id);
  addSocket(socket);
  socket.on('disconnecting', () => {
    sendUserLeftMessagesToRooms(socket);
  });
  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
    removeSocket(socket);
  });

  socket.on(SocketMessageType.CL_JOIN_ROOM, ({room, peerId}: any) => {
    console.log('User joined room', peerId, room);
    socket.join(room);
    socket.data = {peerId};
    socket.emit(SocketMessageType.SV_JOIN_APPROVE, room);
    sendUserJoinedMessagesToRoom(socket, room);
  });
  socket.on(SocketMessageType.CL_LEAVE_ROOM, (room: string) => {
    console.log('User left room', socket.id, room);
    sendUserLeftMessageToRoom(socket, room);
    socket.leave(room);
  });

  socket.on(SocketMessageType.CL_LIST_PEERS, () => {
    const currentRoomId = Array.from(socket.rooms).pop();
    console.log('Requesting peers', socket.id, currentRoomId);
    if (!currentRoomId || currentRoomId === socket.id) {
      console.log('Not in room.', socket.id);
      return;
    }
    const room = io.sockets.adapter.rooms.get(currentRoomId);
    if (!room) {
      console.log('Room not found.', socket.id);
      return;
    }
    const ids = Array.from(room);
    if(!ids?.length) {
      return;
    }
    const peerIds = ids.map((id) => io.sockets.sockets.get(id)?.data?.peerId);
    socket.emit(SocketMessageType.SV_LIST_PEERS, peerIds);
  });
};
