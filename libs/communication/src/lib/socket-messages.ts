export enum SocketMessageType {
  CL_JOIN_ROOM = 'cl_join',
  CL_LEAVE_ROOM = 'cl_leave',
  CL_LIST_PEERS = 'cl_list_peers',
  SV_USER_JOINED = 'sv_user_joined',
  SV_USER_LEFT = 'sv_user_left',
}

export interface ClientReceivedMessages {
  [SocketMessageType.SV_USER_JOINED]: (peerId: string) => void
  [SocketMessageType.SV_USER_LEFT]: (peerId: string) => void
}
export interface ServerReceivedMessages {
  [SocketMessageType.CL_JOIN_ROOM]: (
    payload: { room: string; peerId: string },
    ack: (room: string) => void
  ) => void;
  [SocketMessageType.CL_LEAVE_ROOM]: () => void;
  [SocketMessageType.CL_LIST_PEERS]: (ack: (peerIds: string[]) => void) => void;
}
