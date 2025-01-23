export enum SocketMessageType {
  CL_JOIN_ROOM = 'cl_join',
  SV_JOIN_APPROVE = 'sv_join_approve',
  CL_LEAVE_ROOM = 'cl_leave',
  CL_LIST_PEERS = 'cl_list_peers',
  SV_LIST_PEERS = 'sv_list_peers',
  SV_USER_JOINED = 'sv_user_joined',
  SV_USER_LEFT = 'sv_user_left',
}

export interface ClientReceivedMessages {
  [SocketMessageType.SV_JOIN_APPROVE]: (room: string) => void
  [SocketMessageType.SV_USER_JOINED]: (peerId: string) => void
  [SocketMessageType.SV_USER_LEFT]: (peerId: string) => void
  [SocketMessageType.SV_LIST_PEERS]: (peerIds: string[]) => void

}
export interface ServerReceivedMessages {
  [SocketMessageType.CL_JOIN_ROOM]: (room: string, peerId: string) => void;
  [SocketMessageType.CL_LEAVE_ROOM]: (room: string, peerId: string) => void;
  [SocketMessageType.CL_LIST_PEERS]: () => void;
}
