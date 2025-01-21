import { defineStore } from 'pinia';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  messages: Array<{ event: string; data: any }>;
}

export const useSocketIo = defineStore('socketStore', {
  state: (): SocketState => ({
    socket: null,
    isConnected: false,
    messages: [],
  }),

  actions: {
    // Initialize the Socket.IO connection
    connect(url: string, options: object = {}) {
      console.log("Socki", this.socket);
      if (this.socket) return;

      this.socket = io(url, options);
      console.log("Connecting...");

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('Socket connected');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('Socket disconnected');
      });

      // Catch all events for debugging or specific handling
      this.socket.onAny((event, data) => {
        console.log(`Event received: ${event}`, data);
        this.messages.push({ event, data });
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
