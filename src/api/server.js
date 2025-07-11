/**
 * Express Server for Nexus API
 * 
 * This file sets up the Express server for the Nexus API.
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import workspaceRoutes from './workspaceRoutes.js';
import { createCheckoutSession } from './createCheckoutSession.js';
import { handleStripeWebhook } from './stripeWebhook.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Special handling for Stripe webhooks
app.post('/api/webhooks/stripe', bodyParser.raw({ type: 'application/json' }), handleStripeWebhook);

// API routes
app.use('/api', workspaceRoutes);
app.post('/api/billing/create-checkout-session', createCheckoutSession);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
});
