import express from 'express';
import serverless from 'serverless-http';
import routes from './routes';

const app = express();

// CORS middleware - use environment variable for allowed origins
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Check if the origin is allowed
  if (CORS_ORIGIN === '*') {
    res.header('Access-Control-Allow-Origin', '*');
  } else {
    const allowedOrigins = CORS_ORIGIN.split(',').map(o => o.trim());
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
    }
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

// Routes
app.use(routes);

// Lambda handler (for AWS Lambda deployment)
export const handler = serverless(app);

// Local development server
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
