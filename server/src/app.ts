import express from 'express';
import routes from './routes';
import { ErrorHandlerMiddleware } from './middlewares/errorHandler.middleware';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './config/env';

const app = express();
app.use(
  cors({
    origin: env.APP_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1', routes);

// Global error handler
app.use(ErrorHandlerMiddleware);

export default app;
