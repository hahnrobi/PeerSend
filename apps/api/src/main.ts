/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import http from  'http';
import * as path from 'path';
import { Server } from "socket.io";
import { socketHandler } from './SocketManager';
import {ExpressPeerServer} from 'peer';


const app = express();


app.use('/assets', express.static(path.join(__dirname, 'assets')));


app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to peersend-api!' });
});

const port = process.env.PORT || 3333;
const server = http.createServer(app);

app.use('/peerjs', ExpressPeerServer(server, {
  debug: true
} as any))

const io = new Server(server);
console.log("SocketIO");
io.on('connection', (socket) => socketHandler(io, socket));

server.on('error', console.error);

server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
