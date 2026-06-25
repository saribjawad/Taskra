import express from 'express';
import routes from './routes';
import { ErrorHandlerMiddleware } from './middlewares/errorHandler.middleware';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();
app.use(
  cors({
    origin: 'http://localhost:4000',
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
