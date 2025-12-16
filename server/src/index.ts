import http from 'http';
import { config } from './config.js';
import { makeApp } from './http/app.js';
import { attachSocket } from './ws/server.js';

const app = makeApp();
const server = http.createServer(app);
attachSocket(server);

server.listen(config.port, '0.0.0.0', () => {
  console.log(`YourVoice host up on http://0.0.0.0:${config.port}`);
});
