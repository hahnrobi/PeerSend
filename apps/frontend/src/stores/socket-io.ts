import { defineStore } from 'pinia';
import { connect, io, Socket } from 'socket.io-client';
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
import { ref, toRaw } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { generateUsername } from 'unique-username-generator';
import {
  compareFileOffers,
  compareFileOfferToFile,
  compareFiles,
  isFileOfferInArray,
  makeFileOffer,
  makeFileOfferId,
  saveFile,
  sendFile,
} from '@/utils/files';
import { env as envFn } from '@/utils/env';
import { FileOffer } from '@/definitions/file';

export interface PeerInfo {
  id: string;
  name?: string;
}

const downloadBuffers: Record<string, ArrayBuffer[]> = {};

export const useSocketIo = defineStore('socketStore', () => {
  const env = envFn();
  const name = useLocalStorage('PeerSend_username', generateUsername('', 3));
  const selfInfo = ref({ id: '', name: name.value });
  const socket = ref<Socket | null>(null);
  const peer = ref<Peer | null>(null);
  const peers = ref<Record<string, PeerInfo>>({});
  const peerConnections = ref<
    Record<string, { data: any; meta: DataConnection }>
  >({});
  const roomId = ref<string | null>(null);
  const isConnected = ref(false);
  const isConnecting = ref(false);
  const messages = ref<Array<{ event: string; data: any }>>([]);
  const offeredFiles = ref<Array<File>>([]);
  const userOffers = ref<Record<string, FileOffer[]>>({});
  const downloads = ref<
    Record<
      string,
      {
        fileOffer: FileOffer;
        receivedChunks: number;
        totalChunks: number;
      }
    >
  >({});

  const connect = async (url: string, options: object = {}): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (socket) resolve();
      if (isConnected) resolve();

      socket.value = io(url, options);
      console.log('[IO] Connecting...');
      isConnecting.value = true;

      socket.value.on('disconnect', () => {
        isConnected.value = false;
        console.log('[IO] Socket disconnected');
      });

      socket.value.on('connect', () => {
        isConnected.value = true;
        isConnecting.value = false;
        console.log('[IO] Socket connected');
        resolve();
      });

      socket.value.on(
        SocketMessageType.SV_USER_JOINED,
        async (userId: string) => {
          console.log('[IO] User joined', userId);
          const hasPeerInfo = userId in peers.value;
          if (hasPeerInfo) {
            return;
          }
          peers.value = { ...peers.value, [userId]: { id: userId } };
        }
      );
      socket.value.on(SocketMessageType.SV_USER_LEFT, (userId: string) => {
        console.log('[IO] User left', userId);
        const newPeers = { ...peers.value };
        delete newPeers[userId];
        peers.value = newPeers;
        console.log('[IO] Peers', newPeers);
        cleanupPeer(userId);
      });
    });
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      isConnected.value = false;
    }
  };

  const leaveRoom = (): void => {
    if (!socket.value) {
      throw new Error('Socket not connected');
    }
    const room = roomId.value;
    console.log('Leaving room', room);
    socket.value.emit(SocketMessageType.CL_LEAVE_ROOM, room);
    disconnectPeerConnections();
    peer.value?.destroy();
    offeredFiles.value = [];
    userOffers.value = {};
    peers.value = {};
    peerConnections.value = {};
    roomId.value = null;
  };

  const disconnectPeerConnections = (): void => {
    const pc = peerConnections.value;
    if (pc) {
      return;
    }
    const connections: { data: DataConnection; meta: DataConnection }[] =
      Object.values(pc);
    connections.map((conn) => {
      if ('data' in conn) {
        conn.data?.close();
      }
      if ('meta' in conn) {
        conn.meta?.close();
      }
    });
  };

  const joinRoom = async (room: string): Promise<void> => {
    if (!socket) {
      throw new Error('Socket not connected');
    }
    const name = useLocalStorage('PeerSend_username', generateUsername('', 3));
    selfInfo.value = { ...selfInfo.value, name: name.value };
    console.log("Creating peerjs instance: ", {
      host: env.VITE_PEERJS_CONNECT_HOST,
      path: env.VITE_PEERJS_CONNECT_PATH,
      port: parseInt(env.VITE_PEERJS_CONNECT_PORT!),
      secure: parseInt(env.VITE_PEERJS_CONNECT_SECURE!) === 1,
    });
    const hasPort = env.VITE_PEERJS_CONNECT_PORT!!;
    const p = new Peer('', {
      host: env.VITE_PEERJS_CONNECT_HOST,
      path: env.VITE_PEERJS_CONNECT_PATH,
      ...(hasPort ? {port: parseInt(env.VITE_PEERJS_CONNECT_PORT!)} : {}),
      secure: parseInt(env.VITE_PEERJS_CONNECT_SECURE!) === 1,
    });
    p.on('error', (err) => {
      console.error('Peer error happened: ', err);
    });
    p.on('error', (err) => {
      console.error('Peer error happened: ', err);
    });
    p.on('connection', (connection: DataConnection) => {
      console.log('[PEER] Connection received', connection);
      if (connection.metadata.communicationType === 'meta') {
        registerPeerConnection(connection.peer, connection, 'meta');
        return;
      }
      if (connection.metadata.communicationType === 'data') {
        registerPeerConnection(connection.peer, connection, 'data');
        return;
      }
    });
    peer.value = p;
    await initPeer(p);
    const peerId = p.id;
    console.log('Initializing Peer', peer);
    await _joinRoom(room, peerId);
    roomId.value = room;
    const _peers = ((await listRoomPeers()) || []).filter(
      (peerIdToCheck) => peerIdToCheck !== peerId
    );
    const _peersInfo = _peers.reduce(
      (acc, id) => ({ ...acc, [id]: { id } }),
      {} as Record<string, PeerInfo>
    );
    peers.value = _peersInfo;
    if (_peers.length > 0) {
      await Promise.all(_peers.map((peerId) => connectPeer(peerId)));
    }
    console.log('[IO] Room peers', _peersInfo);
  };

  const _joinRoom = async (room: string, peerId: string): Promise<void> => {
    const s = socket.value;
    if (!s) {
      throw new Error('Socket not connected');
    }
    return new Promise((resolve) => {
      s.emit(SocketMessageType.CL_JOIN_ROOM, { room, peerId });
      s.on(SocketMessageType.SV_JOIN_APPROVE, () => {
        resolve();
      });
    });
  };

  const listRoomPeers = async (): Promise<string[]> => {
    const s = socket.value;
    if (!s) {
      throw new Error('Socket not connected');
    }
    return new Promise((resolve) => {
      s.emit(SocketMessageType.CL_LIST_PEERS);
      s.on(SocketMessageType.SV_LIST_PEERS, (peers: string[]) => {
        resolve(peers);
      });
    });
  };
  const mergePeerInfos = (newPeerInfos: Array<PeerInfo>): void => {
    const peerInfos = { ...peers.value };
    newPeerInfos.forEach((peerInfo) => {
      const id = peerInfo.id;
      if (id in peerInfos) {
        peerInfos[id] = { ...peerInfos[id], ...peerInfo };
      } else {
        peerInfos[id] = peerInfo;
      }
    });
    peers.value = peerInfos;
  };

  const connectPeer = async (peerId: string): Promise<void> => {
    const p = peer.value;
    if (!p) {
      throw new Error('Peer not initialized');
    }
    console.log('[PEER] Connecting directly to peer', peerId);
    const metaConnection = p.connect(peerId, {
      label: `${peerId}_meta`,
      metadata: {
        communicationType: 'meta',
      },
      serialization: 'json',
      reliable: true,
    });
    registerPeerConnection(peerId, metaConnection, 'meta');

    const dataConnection = p.connect(peerId, {
      label: `${peerId}_data`,
      metadata: {
        communicationType: 'data',
      },
      serialization: 'binary',
      reliable: true,
    });
    registerPeerConnection(peerId, dataConnection, 'data');
  };
  const registerPeerConnection = (
    peerId: string,
    connection: DataConnection,
    communicationType: 'data' | 'meta'
  ): void => {
    console.log(
      '[PEER] Registering peer connection',
      peerId,
      communicationType
    );
    const pc = peerConnections.value || {};
    const existingPeerConnections = {
      ...pc[peerId],
      [communicationType]: connection,
    };
    peerConnections.value = {
      ...pc,
      [peerId]: existingPeerConnections,
    };

    if (communicationType === 'data') {
      connection.on('data', (data: any) => {
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
            const file = offeredFiles.value.find((file) =>
              compareFileOfferToFile(fileOffer, file)
            );
            if (!file) {
              console.warn('[PEER] File not found', fileOffer);
              return;
            }
            console.log('[PEER] Sending file', file);
            const dataConnection = getPeerConnection(peerId, 'data');
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
              const { [id]: _, ...currentDownloads } = { ...downloads.value };
              const state = {
                fileOffer: data.fileOffer,
                totalChunks: data.totalChunks,
                receivedChunks: downloadBuffers[id].length,
              };
              downloads.value = {
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
            const { [id]: _, ...currentDownloads } = { ...downloads.value };
            downloadBuffers[id] = [];
            downloads.value = currentDownloads;
            console.log('File transfer completed!');
          }
        }
      });
    }

    if (communicationType === 'meta') {
      connection.on('data', (data: any) => {
        if (typeof data !== 'object') {
          return;
        }
        if ('type' in data) {
          if (data.type === requestMessageType(PeerMessageType.PEER_INFO)) {
            console.log('[PEER] Sending peer info', toRaw(selfInfo.value));
            connection.send({
              type: responseMessageType(PeerMessageType.PEER_INFO),
              payload: toRaw(selfInfo.value),
            });
          }
          if (
            'payload' in data &&
            data.type === responseMessageType(PeerMessageType.PEER_INFO)
          ) {
            console.log('[PEER] Received peer info', data.payload);
            const peerInfo = data.payload as any;
            mergePeerInfos([{ ...peerInfo, id: peerId }]);
          }
          if (
            'payload' in data &&
            data.type === responseMessageType(PeerMessageType.FILE_OFFERS)
          ) {
            const userFileOffers = { ...userOffers.value };
            if (data.payload.length === 0) {
              return;
            }
            userFileOffers[peerId] = [
              ...(userFileOffers[peerId] || []),
              ...(data.payload as FileOffer[]),
            ];
            console.log('[PEER] Received file offers', data.payload);
            userOffers.value = userFileOffers;
          }
          if (
            'payload' in data &&
            data.type === responseMessageType(PeerMessageType.UNOFFER_FILE)
          ) {
            console.warn('[PEER] Unoffering file', data.payload);
            const unofferedFile = data.payload as File;
            const offeredFiles = userOffers.value[peerId];
            const index = offeredFiles.findIndex((offer) =>
              compareFileOffers(offer, makeFileOffer(unofferedFile))
            );
            if (index === -1) {
              return;
            }
            const newOfferedFiles = [...offeredFiles];
            newOfferedFiles.splice(index, 1);
            const userFileOffers = { ...userOffers.value };
            if (newOfferedFiles.length === 0) {
              delete userFileOffers[peerId];
            } else {
              userFileOffers[peerId] = newOfferedFiles;
            }
            userOffers.value = userFileOffers;
          }
        }
        console.log('[PEER] Meta connection received data', data);
      });
      checkPeerInfoAndRequest(peerId);
    }
  };
  const getPeerConnection = (
    peerId: string,
    type: 'data' | 'meta'
  ): DataConnection => {
    const pc = peerConnections.value || {};
    const peerConnection = pc[peerId];
    if (!peerConnection) {
      throw new Error('Connection not established');
    }
    return toRaw(peerConnection[type]);
  };

  const checkPeerInfoAndRequest = (peerId: string, forceRefresh = false) => {
    const peerInfo = peers.value[peerId];
    if (
      peerInfo?.name?.length &&
      !forceRefresh &&
      peerId !== socket.value!.id
    ) {
      return;
    }
    console.log('[PEER] Peer info missing for peer', peerId);
    setTimeout(() => {
      const metaConn = getPeerConnection(peerId, 'meta');
      metaConn.send({
        type: requestMessageType(PeerMessageType.PEER_INFO),
      });
      console.log('[PEER] Requesting peer info', metaConn);
      console.log('[PEER] Sending existing file offers.');
      sendFileOfferToPeer(peerId, offeredFiles.value.map(makeFileOffer));
    }, 1000);
  };
  const initPeer = async (peer: Peer): Promise<Peer> => {
    return new Promise((resolve, reject) => {
      peer.on('open', function (id) {
        console.log('My peer ID is: ' + id);
        resolve(peer);
      });
    });
  };
  const sendOfferedFilesToPeers = (offeredFiles: File[]): void => {
    const offers = offeredFiles.map((file) => makeFileOffer(file));
    const p = Object.keys(peers.value);
    p.map((peerId) => sendFileOfferToPeer(peerId, offers));
  };
  const sendFileOfferToPeer = (peerId: string, offers: FileOffer[]): void => {
    const p = peer.value;
    if (!p) {
      throw new Error('Peer not initialized');
    }
    console.log('[PEER] Sending file offer to peer', peerId);
    const connection = getPeerConnection(peerId, 'meta');
    connection.send({
      type: responseMessageType(PeerMessageType.FILE_OFFERS),
      payload: offers,
    });
  };
  const offerFiles = (files: File[]): void => {
    const of = offeredFiles.value;
    offeredFiles.value = [...of, ...files];
    sendOfferedFilesToPeers(files);
  };
  const unOfferFile = (file: File): void => {
    const of = offeredFiles.value;
    const index = of.findIndex((offer) => compareFiles(offer, file));
    if (index === -1) {
      return;
    }
    // Remove the file from the offered files inmutable array
    const newOfferedFiles = [...of];
    newOfferedFiles.splice(index, 1);
    offeredFiles.value = newOfferedFiles;
    const peerIds = Object.keys(peers.value);
    peerIds.map((peerId) => sendUnofferFileToPeer(peerId, file));
  };
  const sendUnofferFileToPeer = (peerId: string, file: File) => {
    const p = peer.value;
    if (!p) {
      throw new Error('Peer not initialized');
    }
    console.log('[PEER] Sending unoffer file to peer', peerId, file);
    const connection = getPeerConnection(peerId, 'meta');
    connection.send({
      type: responseMessageType(PeerMessageType.UNOFFER_FILE),
      payload: makeFileOffer(file),
    });
  };
  const requestFile = (peerId: string, fileOffer: FileOffer) => {
    const uo = userOffers.value;
    const isFileExists = isFileOfferInArray(fileOffer, uo[peerId]);
    if (!isFileExists) {
      throw new Error('Requested file does not exists. ' + fileOffer.name);
    }
    const dataConnection = getPeerConnection(peerId, 'data');
    console.log('[PEER] Requesting file to download', fileOffer);
    dataConnection.send({
      type: requestMessageType(PeerMessageType.FILE_DOWNLOAD),
      payload: fileOffer,
    });
  };
  const cleanupPeer = (peerId: string): void => {
    const pc = peerConnections.value || {};
    const connections = pc[peerId];
    const hasFileOffers = peerId in userOffers.value;
    if (connections) {
      Object.keys(connections).map((communicationType) => {
        const connection = connections[communicationType as 'data' | 'meta'];
        connection.close();
      });
      const { [peerId]: _, ...newConnections } = pc;
      peerConnections.value = newConnections;
    }
    if (hasFileOffers) {
      const { [peerId]: _, ...newUserOffers } = userOffers.value;
      userOffers.value = newUserOffers;
    }

    const { [peerId]: _, ...newPeerConnections } = pc;
    peerConnections.value = newPeerConnections;
  };
  const emit = (event: string, data: any): void => {
    if (socket.value) {
      socket.value.emit(event, data);
    }
  };

  return {
    name,
    selfInfo,
    socket,
    peer,
    peers,
    peerConnections,
    roomId,
    isConnected,
    isConnecting,
    messages,
    offeredFiles,
    userOffers,
    downloads,
    connect,
    joinRoom,
    disconnect,
    leaveRoom,
    offerFiles,
    unOfferFile,
    requestFile,
    sendFile,
  };
});
