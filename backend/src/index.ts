import 'dotenv/config';
import app from './app';
import { createServer } from 'http';
import { initializeChatSocket } from './realtime/chatSocket';

const PORT = Number(process.env.PORT) || 10000;
const server = createServer(app);

initializeChatSocket(server);

server.listen(PORT, () => {
    console.log(`\n🚀 ReUse Mart API running at http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health\n`);
});
