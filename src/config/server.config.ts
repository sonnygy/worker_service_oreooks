import express from 'express';
import routes from "../routes/worker.route";
import { PORT } from '../config/env.config';

export default function createApp() {
    
  const server = express();

  server.use(express.json());
  server.use('api/', routes);
  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  })

  return server;
}