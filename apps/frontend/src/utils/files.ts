import { FileOffer } from '@/definitions/file';
import { DataConnection } from 'peerjs';
import {
  PeerMessageType,
  requestMessageType,
  responseMessageType,
} from '../../../../libs/communication/src/lib/peer-messages';

export const compareFiles = (fileA: File, fileB: File) => {
  return fileA.name === fileB.name && fileA.size === fileB.size;
};
export const compareFileOffers = (fileA: FileOffer, fileB: FileOffer) => {
  return fileA.name === fileB.name && fileA.size === fileB.size;
};
export const makeFileOffer = (file: File): FileOffer => {
  return {
    name: file.name,
    size: file.size,
    mime: file.type,
  };
};
export function formatFileSize(bytes: number, decimalPlaces = 2): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const factor = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(factor));

  return `${(bytes / Math.pow(factor, i)).toFixed(decimalPlaces)} ${units[i]}`;
}

export const compareFileOfferToFile = (
  fileOffer: FileOffer,
  file: File
): boolean => {
  return fileOffer.name === file.name && fileOffer.size === file.size;
};

export function isFileOfferInArray(
  file: FileOffer,
  files: FileOffer[]
): boolean {
  return files.findIndex((offer) => compareFileOffers(offer, file)) !== -1;
}

export function makeFileOfferId(fileOffer: FileOffer, peerId?: string) {
  if (peerId) {
    return `${peerId}_${fileOffer.name}_${fileOffer.size}`;
  }
  return `${fileOffer.name}_${fileOffer.size}`;
}

const CHUNK_SIZE = 64 * 1024; // 64KB chunk size

export const sendFile = (
  fileOffer: FileOffer,
  file: File,
  connection: DataConnection,
  updateProgress: (progress: number) => void
) => {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let currentChunk = 0;

  const sendChunk = () => {
    if (currentChunk < totalChunks) {
      const start = currentChunk * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunk = file.slice(start, end);

      const reader = new FileReader();
      reader.onload = () => {
        connection.send({
          type: responseMessageType(PeerMessageType.FILE_DOWNLOAD),
          fileOffer,
          chunk: reader.result,
          currentChunk,
          totalChunks,
        });
        currentChunk++;
        updateProgress((currentChunk / totalChunks) * 100);
        sendChunk(); // Send the next chunk
      };
      reader.readAsArrayBuffer(chunk);
    } else {
      connection.send({
        type: responseMessageType(PeerMessageType.FILE_DOWNLOAD),
        fileOffer,
        done: true,
      });
      console.log('File sent successfully!');
    }
  };

  sendChunk();
};

export const saveFile = (fileName: string, data: any) => {
  console.log("Save file", data);
  const blob = new Blob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
