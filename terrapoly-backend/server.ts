import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from 'dotenv';
import { setupSocketHandlers } from './gameHandler';

config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.send({ status: 'OK', version: '1.0' });
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT as number, '0.0.0.0', () => {
    console.log(`[Terra 2030] Backend Server listening on 0.0.0.0:${PORT} (Accessible on LAN!)`);
});
