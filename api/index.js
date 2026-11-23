// ============================================================
// Entry point para Vercel Serverless Functions
// ============================================================
const serverless = require('serverless-http');
const app = require('../app');

module.exports = serverless(app);
