import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import userRoutes from './routes/users.js';
import activityRoutes from './routes/activity.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check.
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity', activityRoutes);

// Fallback 404 for unknown API routes.
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Global error handler — guarantees a JSON body (never an HTML error page),
// so the frontend always gets a readable message instead of "Request failed".
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error.',
  });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('\n========================================');
    console.error('DATABASE CONNECTION FAILED — server NOT started.');
    console.error('Reason:', err.message);
    console.error('Check that backend/.env MONGO_URI is correct and that');
    console.error('your IP is allowlisted in MongoDB Atlas (Network Access).');
    console.error('While the server is down, every /api call returns 500.');
    console.error('========================================\n');
    process.exit(1);
  });
