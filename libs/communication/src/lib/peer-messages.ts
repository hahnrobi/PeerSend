export enum PeerMessageType {
  PEER_INFO = 'PEER_INFO',
  FILE_OFFERS = 'FILE_OFFERS',
  UNOFFER_FILE = 'UNOFFER_FILE',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
}

export function requestMessageType(type: PeerMessageType) {
  return `${type}_req`;
}
export function responseMessageType(type: PeerMessageType) {
  return `${type}_res`;
}
