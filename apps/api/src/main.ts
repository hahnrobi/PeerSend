import express from 'express';
import http from 'http';
import * as path from 'path';
import { Server } from 'socket.io';
import { socketHandler } from './SocketManager';
import { ExpressPeerServer } from 'peer';

const app = express();

const isProduction = process.env.NODE_ENV === 'production';


app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to peersend-api!' });
});

const port = process.env.PORT || 3333;
const server = http.createServer(app);

app.use('/peerjs', ExpressPeerServer(server));

if (isProduction) {
  app.use(express.static(path.join(__dirname, '../frontend')));
  app.all('*', function(req, res){
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });
}

const io = new Server(server);
console.log('SocketIO');
io.on('connection', (socket) => socketHandler(io, socket));

server.on('error', console.error);

server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received.');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received.');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
