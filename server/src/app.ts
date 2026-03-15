import express from 'express';
import routes from './routes';
import { ErrorHandlerMiddleware } from './middlewares/errorHandler.middleware';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1', routes);

// Global error handler
app.use(ErrorHandlerMiddleware);

export default app;
