import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import config from './config/env.js';
import routes from './routes/index.js';
import errorMiddleware from './middleware/error.middleware.js';
import { generalLimiter, authLimiter, searchLimiter } from './middleware/rateLimit.middleware.js';
import { errorResponse } from './utils/apiResponse.js';
import mongoSanitize from 'express-mongo-sanitize';

const app = express();

// Security Headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// NoSQL Injection Protection
app.use(mongoSanitize());

// Request Logging
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Trust Proxy for correct rate limit IP extraction
app.set('trust proxy', 1);

//  Rate Limiters
app.use(generalLimiter);
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/search', searchLimiter);

// Routes
app.use('/api/v1', routes);

// 404 Handler
app.use((req, res) => {
  errorResponse(res, 404, `Route ${req.originalUrl} not found.`);
});

// Global Error Handler (must be last)
app.use(errorMiddleware);

export default app;
