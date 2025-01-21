/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import http from  'http';
import * as path from 'path';
import { Server } from "socket.io";


const app = express();


app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to peersend-api!' });
});

const port = process.env.PORT || 3333;
const server = http.createServer(app);

const io = new Server(server);
console.log("SocketIO");
io.on('connection', (socket) => {
  console.log('a user connected' , socket.id);
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.on('error', console.error);

server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
