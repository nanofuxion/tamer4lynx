// server.ts

import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8008 });

wss.on('connection', ws => {
  console.log('Client connected');
  // Reduced delay for sending the welcome message
  setTimeout(() => {
    ws.send(`Welcome to the WebSocket server!`);
  }, 1000); // 1 second

  ws.on('message', message => {
    console.log(`Received: ${message}`);
    ws.send(`Echo: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});

console.log('WebSocket server started on port 8008');