import dotenv from 'dotenv';
import express from 'express';
import routes from './routes';

dotenv.config({ path: './.env' });

const app = express();
app.use(express.json());

// Routes
app.use('/api/v1', routes);

export default app;
