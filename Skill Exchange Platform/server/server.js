const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const connectDB = require('./utils/db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const teamRoutes = require('./routes/teams');

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/teams', teamRoutes);

// Serve static frontend (optional)
app.use(express.static(path.join(__dirname, '..')));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('DB connection failed', err);
  process.exit(1);
});
