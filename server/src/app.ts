import express from 'express';
import routes from './routes';
import { ErrorHandlerMiddleware } from './middlewares/errorHandler.middleware';

const app = express();
app.use(express.json());

// Routes
app.use('/api/v1', routes);

// Global error handler
app.use(ErrorHandlerMiddleware);

export default app;
