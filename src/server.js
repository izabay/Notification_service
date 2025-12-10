require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/health', require('./routes/health'));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler (before error middleware)
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res) => {
  // eslint-disable-next-line no-console
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server only when run directly (prevents listen during tests)
if (require.main === module) {
  // eslint-disable-next-line no-console
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
