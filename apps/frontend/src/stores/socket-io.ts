import { defineStore } from 'pinia';
import { io, Socket } from 'socket.io-client';
import {
  ClientReceivedMessages,
  ServerReceivedMessages,
} from 'communication/src/lib/socket-messages';
import { SocketMessageType } from '../../../../libs/communication/src/lib/socket-messages';
import Peer, { DataConnection } from 'peerjs';
import {
  PeerMessageType,
  requestMessageType,
  responseMessageType,
} from '../../../../libs/communication/src/lib/peer-messages';
import { toRaw } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { generateUsername } from 'unique-username-generator';
import {
  compareFileOfferToFile,
  compareFiles,
  isFileOfferInArray,
  makeFileOffer,
  makeFileOfferId,
  saveFile,
  sendFile,
} from '@/utils/files';
import { FileOffer } from '@/definitions/file';

export interface PeerInfo {
  id: string;
  name?: string;
}

interface SocketState {
  selfInfo: PeerInfo;
  socket: Socket<ClientReceivedMessages, ServerReceivedMessages> | null;
  peer: Peer | null;
  peers: Record<string, PeerInfo>;
  peerConnections?: Record<string, { data: any; meta: DataConnection }>;
  roomId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  messages: Array<{ event: string; data: any }>;
  offeredFiles: Array<File>;
  userOffers: Record<string, FileOffer[]>;
  downloads: Record<
    string,
    {
      fileOffer: FileOffer;
      receivedChunks: number;
      totalChunks: number;
    }
  >;
}

const downloadBuffers: Record<string, ArrayBuffer[]> = {};

export const useSocketIo = defineStore('socketStore', {
  state: (): SocketState => {
    const name = useLocalStorage('PeerSend_username', generateUsername('', 3));
    return {
      selfInfo: { id: '', name: name.value },
      socket: null,
      peer: null,
      peers: {},
      peerConnections: {},
      roomId: null,
      isConnected: false,
      isConnecting: false,
      messages: [],
      offeredFiles: [],
      userOffers: {},
      downloads: {},
    };
  },

  actions: {
    // Initialize the Socket.IO connection
    async connect(url: string, options: object = {}): Promise<void> {
      return new Promise((resolve, reject) => {
        if (this.socket) resolve();
        if (this.isConnected) resolve();

        this.socket = io(url, options);
        console.log('[IO] Connecting...');
        this.isConnecting = true;

        this.socket.on('disconnect', () => {
          this.isConnected = false;
          console.log('[IO] Socket disconnected');
        });

        // Catch all events for debugging or specific handling
        this.socket.onAny((event, data) => {
          console.log(`[IO] Event received: ${event}`, data);
          this.messages.push({ event, data });
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          this.isConnecting = false;
          console.log('[IO] Socket connected');
          resolve();
        });
      });
    },

    // Disconnect from the server
    disconnect() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
      }
    },

    leaveRoom() {
      if (!this.socket) {
        throw new Error('Socket not connected');
      }
      const room = this.roomId;
      console.warn('Leaving room', room);
      this.socket.emit(SocketMessageType.CL_LEAVE_ROOM, room);
      this.disconnectConnections();
      this.peer?.destroy();
      this.offeredFiles = [];
      this.userOffers = {};
      this.peers = {};
      this.peerConnections = {};
      this.roomId = null;
    },

    disconnectConnections(): void {
      const peerConnections = this.peerConnections;
      if(!peerConnections){
        return;
      }
      const connections = Object.values(peerConnections);
      connections.map((conn) => {
        if('data' in conn) {
          conn.data.close();
        }
        if('meta' in conn) {
          conn.meta.close();
        }
      })
    },

    async joinRoom(room: string): Promise<void> {
      const socket = this.socket;
      if (!socket) {
        throw new Error('Socket not connected');
      }
      const name = useLocalStorage('PeerSend_username', generateUsername('', 3));
      console.warn("Name: ", name);
      this.selfInfo = {...this.selfInfo, name: name.value};
      console.log('[IO] Joining room: ', room);
      if (!this.socket) {
        throw new Error('Socket not connected');
      }
      const peer = new Peer("", {
        host: '/',
        path: '/peerjs',
        secure: true,
      });
      peer.on('error', (err) => {
        console.error('Peer error happened: ', err);
      });
      peer.on('connection', (connection: DataConnection) => {
        console.log('[PEER] Connection received', connection);
        if (connection.metadata.communicationType === 'meta') {
          this.registerPeerConnection(connection.peer, connection, 'meta');
          return;
        }
        if (connection.metadata.communicationType === 'data') {
          this.registerPeerConnection(connection.peer, connection, 'data');
          return;
        }
      });
      this.peer = peer;
      await this.initPeer(peer);
      const peerId = this.peer.id;
      console.log('Initializing Peer', peer);
      await this._joinRoom(room, peerId);
      this.roomId = room;
      const peers = ((await this.listRoomPeers()) || []).filter(
        (peerIdToCheck) => peerIdToCheck !== peerId
      );
      const peersInfo = peers.reduce(
        (acc, id) => ({ ...acc, [id]: { id } }),
        {} as Record<string, PeerInfo>
      );
      this.peers = peersInfo;
      socket.on(SocketMessageType.SV_USER_JOINED, async (userId: string) => {
        console.log('[IO] User joined', userId);
        const hasPeerInfo = peer.id in peersInfo;
        if (hasPeerInfo) {
          return;
        }
        this.peers = { ...this.peers, [userId]: { id: userId } };
        //await this.connectPeer(userId);
        //this.requestPeerInfo(userId);
      });
      socket.on(SocketMessageType.SV_USER_LEFT, (userId: string) => {
        console.log('[IO] User left', userId);
        const newPeers = { ...this.peers };
        delete newPeers[userId];
        this.peers = newPeers;
        console.log('[IO] Peers', newPeers);
        this.cleanupPeer(userId);
      });
      if (peers.length > 0) {
        await Promise.all(peers.map((peerId) => this.connectPeer(peerId)));
      }
      console.log('[IO] Room peers', peersInfo);
      return;
    },
    async _joinRoom(room: string, peerId: string): Promise<void> {
      const socket = this.socket;
      if (!socket) {
        throw new Error('Socket not connected');
      }
      return new Promise((resolve) => {
        socket.emit(SocketMessageType.CL_JOIN_ROOM, {room, peerId});
        socket.on(SocketMessageType.SV_JOIN_APPROVE, () => {
          resolve();
        });
      });
    },

    async listRoomPeers(): Promise<string[]> {
      const socket = this.socket;
      if (!socket) {
        throw new Error('Socket not connected');
      }
      return new Promise((resolve) => {
        socket.emit(SocketMessageType.CL_LIST_PEERS);
        socket.on(SocketMessageType.SV_LIST_PEERS, (peers: string[]) => {
          resolve(peers);
        });
      });
    },

    mergePeerInfos(newPeerInfos: Array<PeerInfo>) {
      const peerInfos = { ...this.peers };
      newPeerInfos.forEach((peerInfo) => {
        const id = peerInfo.id;
        if (id in peerInfos) {
          peerInfos[id] = { ...peerInfos[id], ...peerInfo };
        } else {
          peerInfos[id] = peerInfo;
        }
      });
      this.peers = peerInfos;
    },

    async connectPeer(peerId: string): Promise<void> {
      const peer = this.peer;
      if (!peer) {
        throw new Error('Peer not initialized');
      }
      console.log('[PEER] Connecting directly to peer', peerId);
      const peerConnections = this.peerConnections || {};
      const metaConnection = peer.connect(peerId, {
        label: `${peerId}_meta`,
        metadata: {
          communicationType: 'meta',
        },
        serialization: 'json',
        reliable: true,
      });
      this.registerPeerConnection(peerId, metaConnection, 'meta');

      const dataConnection = peer.connect(peerId, {
        label: `${peerId}_data`,
        metadata: {
          communicationType: 'data',
        },
        serialization: 'binary',
        reliable: true,
      });
      this.registerPeerConnection(peerId, dataConnection, 'data');
    },

    registerPeerConnection(
      peerId: string,
      connection: DataConnection,
      communicationType: 'data' | 'meta'
    ) {
      console.log(
        '[PEER] Registering peer connection',
        peerId,
        communicationType
      );
      const peerConnections = this.peerConnections || {};
      const existingPeerConnections = {
        ...peerConnections[peerId],
        [communicationType]: connection,
      };
      this.peerConnections = {
        ...peerConnections,
        [peerId]: existingPeerConnections,
      };

      if (communicationType === 'data') {
        connection.on('data', (data) => {
          if (typeof data !== 'object') {
            return;
          }
          if ('type' in data) {
            if (
              'payload' in data &&
              data.type === requestMessageType(PeerMessageType.FILE_DOWNLOAD)
            ) {
              console.log('[PEER] Received download request', data.payload);
              const fileOffer = data.payload as FileOffer;
              const file = this.offeredFiles.find((file) =>
                compareFileOfferToFile(fileOffer, file)
              );
              if (!file) {
                console.warn('[PEER] File not found', fileOffer);
                return;
              }
              console.log('[PEER] Sending file', file);
              const dataConnection = this.getPeerConnection(peerId, 'data');
              sendFile(fileOffer, file, dataConnection, (progress) => {
                console.log('[PEER] File sending progress', progress);
              });
            }
            if (
              'chunk' in data &&
              data.type === responseMessageType(PeerMessageType.FILE_DOWNLOAD)
            ) {
              console.log('[PEER] Receiving file parts...', data);
              const id = makeFileOfferId(data.fileOffer, peerId);
              if (data.chunk) {
                if (!downloadBuffers[id]) {
                  downloadBuffers[id] = [];
                }

                downloadBuffers[id].push(data.chunk);
                const { [id]: _, ...currentDownloads } = { ...this.downloads };
                const state = {
                  fileOffer: data.fileOffer,
                  totalChunks: data.totalChunks,
                  receivedChunks: downloadBuffers[id].length,
                };
                this.downloads = {
                  ...currentDownloads,
                  [id]: state,
                };
              }
              if (downloadBuffers[id].length === data.totalChunks) {
                console.log('File received successfully!');
              }
            } else if (data.done) {
              const id = makeFileOfferId(data.fileOffer, peerId);
              saveFile(data.fileOffer.name, downloadBuffers[id]);
              const { [id]: _, ...currentDownloads } = { ...this.downloads };
              downloadBuffers[id] = [];
              this.downloads = currentDownloads;
              console.log('File transfer completed!');
            }
          }
          //console.warn('[PEER] Data connection received data', data);
        });
      }

      if (communicationType === 'meta') {
        connection.on('data', (data) => {
          if (typeof data !== 'object') {
            return;
          }
          if ('type' in data) {
            if (data.type === requestMessageType(PeerMessageType.PEER_INFO)) {
              console.log('[PEER] Sending peer info', toRaw(this.selfInfo));
              connection.send({
                type: responseMessageType(PeerMessageType.PEER_INFO),
                payload: toRaw(this.selfInfo),
              });
            }
            if (
              'payload' in data &&
              data.type === responseMessageType(PeerMessageType.PEER_INFO)
            ) {
              console.log('[PEER] Received peer info', data.payload);
              const peerInfo = data.payload as any;
              this.mergePeerInfos([{ ...peerInfo, id: peerId }]);
            }
            if (
              'payload' in data &&
              data.type === responseMessageType(PeerMessageType.FILE_OFFERS)
            ) {
              const userFileOffers = { ...this.userOffers };
              if (data.payload.length === 0) {
                return;
              }
              userFileOffers[peerId] = [
                ...(userFileOffers[peerId] || []),
                ...(data.payload as FileOffer[]),
              ];
              console.log('[PEER] Received file offers', data.payload);
              this.userOffers = userFileOffers;
            }
            if (
              'payload' in data &&
              data.type === responseMessageType(PeerMessageType.UNOFFER_FILE)
            ) {
              console.warn('[PEER] Unoffering file', data.payload);
              const unofferedFile = data.payload as File;
              const offeredFiles = this.userOffers[peerId];
              const index = offeredFiles.findIndex((offer) =>
                compareFiles(offer, unofferedFile)
              );
              if (index === -1) {
                return;
              }
              // Remove the file from the offered files inmutable array
              const newOfferedFiles = [...offeredFiles];
              newOfferedFiles.splice(index, 1);
              const userFileOffers = { ...this.userOffers };
              if (newOfferedFiles.length === 0) {
                delete userFileOffers[peerId];
              } else {
                userFileOffers[peerId] = newOfferedFiles;
              }
              this.userOffers = userFileOffers;
            }
          }
          console.warn('[PEER] Meta connection received data', data);
        });
        this.checkPeerInfoAndRequest(peerId);
      }
    },

    getPeerConnection(peerId: string, type: 'data' | 'meta'): DataConnection {
      const peerConnections = this.peerConnections || {};
      const peerConnection = peerConnections[peerId];
      if (!peerConnection) {
        throw new Error('Connection not established');
      }
      return toRaw(peerConnection[type]);
    },

    checkPeerInfoAndRequest(peerId: string, forceRefresh = false) {
      const peerInfo = this.peers[peerId];
      if (
        peerInfo?.name?.length &&
        !forceRefresh &&
        peerId !== this.socket!.id
      ) {
        return;
      }
      console.log('[PEER] Peer info missing for peer', peerId);
      setTimeout(() => {
        const metaConn = this.getPeerConnection(peerId, 'meta');
        metaConn.send({
          type: requestMessageType(PeerMessageType.PEER_INFO),
        });
        console.warn('[PEER] Requesting peer info', metaConn);
        console.log('[PEER] Sending existing file offers.');
        this.sendFileOfferToPeer(peerId, this.offeredFiles.map(makeFileOffer));
      }, 1000);
    },

    async initPeer(peer: Peer): Promise<Peer> {
      return new Promise((resolve, reject) => {
        peer.on('open', function (id) {
          console.log('My peer ID is: ' + id);
          resolve(peer);
        });
      });
    },

    sendOfferedFilesToPeers(offeredFiles: File[]) {
      const offers = offeredFiles.map((file) => makeFileOffer(file));
      const peers = Object.keys(this.peers);
      peers.map((peerId) => this.sendFileOfferToPeer(peerId, offers));
    },
    sendFileOfferToPeer(peerId: string, offers: FileOffer[]) {
      const peer = this.peer;
      if (!peer) {
        throw new Error('Peer not initialized');
      }
      console.log('[PEER] Sending file offer to peer', peerId);
      const connection = this.getPeerConnection(peerId, 'meta');
      connection.send({
        type: responseMessageType(PeerMessageType.FILE_OFFERS),
        payload: offers,
      });
    },

    offerFiles(files: File[]) {
      const offeredFiles = this.offeredFiles;
      this.offeredFiles = [...offeredFiles, ...files];
      this.sendOfferedFilesToPeers(files);
    },

    unofferFile(file: File) {
      const offeredFiles = this.offeredFiles;
      const index = offeredFiles.findIndex((offer) =>
        compareFiles(offer, file)
      );
      if (index === -1) {
        return;
      }
      // Remove the file from the offered files inmutable array
      const newOfferedFiles = [...offeredFiles];
      newOfferedFiles.splice(index, 1);
      this.offeredFiles = newOfferedFiles;
      const peerIds = Object.keys(this.peers);
      peerIds.map((peerId) => this.sendUnofferFileToPeer(peerId, file));
    },

    sendUnofferFileToPeer(peerId: string, file: File) {
      const peer = this.peer;
      if (!peer) {
        throw new Error('Peer not initialized');
      }
      console.log('[PEER] Sending unoffer file to peer', peerId, file);
      const connection = this.getPeerConnection(peerId, 'meta');
      connection.send({
        type: responseMessageType(PeerMessageType.UNOFFER_FILE),
        payload: makeFileOffer(file),
      });
    },

    requestFile(peerId: string, fileOffer: FileOffer) {
      const userOffers = this.userOffers;
      const isFileExists = isFileOfferInArray(fileOffer, userOffers[peerId]);
      if (!isFileExists) {
        throw new Error('Requested file does not exists. ' + fileOffer.name);
      }
      const dataConnection = this.getPeerConnection(peerId, 'data');
      console.log('[PEER] Requesting file to download', fileOffer);
      dataConnection.send({
        type: requestMessageType(PeerMessageType.FILE_DOWNLOAD),
        payload: fileOffer,
      });
    },

    cleanupPeer(peerId: string) {
      const peerConnections = this.peerConnections || {};
      const connections = peerConnections[peerId];
      const hasFileOffers = peerId in this.userOffers;
      if (connections) {
        Object.keys(connections).map((communicationType) => {
          const connection = connections[communicationType as 'data' | 'meta'];
          connection.close();
        });
        const { [peerId]: _, ...newConnections } = peerConnections;
        this.peerConnections = newConnections;
      }
      if (hasFileOffers) {
        const { [peerId]: _, ...newUserOffers } = this.userOffers;
        this.userOffers = newUserOffers;
      }

      const { [peerId]: _, ...newPeerConnections } = this.peerConnections;
      this.peerConnections = newPeerConnections;
    },

    // Emit an event to the server
    emit(event: string, data: any) {
      if (this.socket) {
        this.socket.emit(event, data);
      }
    },

    // Listen for a specific event
    on(event: string, callback: (data: any) => void) {
      if (this.socket) {
        this.socket.on(event, callback);
      }
    },

    // Remove listener for a specific event
    off(event: string) {
      if (this.socket) {
        this.socket.off(event);
      }
    },
  },
});
