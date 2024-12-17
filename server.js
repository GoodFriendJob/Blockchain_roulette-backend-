const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');

const dotenv = require("dotenv");
const session = require("express-session");
const morgan = require("morgan");
const { errorHandler } = require("./middlewares/errorHandler");
const rateLimiter = require("./middlewares/rateLimiter");
const logger = require("./utils/logger");
const { verifyToken } = require("./config/jwt");
const db = require("./config/db");

// Route imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const balanceRoutes = require("./routes/balanceRoutes");
const rewardsRoutes = require("./routes/rewardsRoutes");
const wagerRoutes = require("./routes/wagerRoutes");
const affiliateRoutes = require("./routes/affiliateRoutes");
const chatRoutes = require("./routes/chatRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const gameRoutes = require("./routes/gameRoutes");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
db()
.then(() => logger.info("Connected to MongoDB"))
.catch((err) => logger.error("MongoDB connection error:", err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev")); // Logging HTTP requests
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize Passport.js for OAuth
const passport = require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());

// Apply rate limiting to prevent abuse
app.use(rateLimiter.apiLimiter);

// JWT authentication middleware (protect routes)
// app.use(verifyToken);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/balances", balanceRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/api/wagers", wagerRoutes);
app.use("/api/affiliates", affiliateRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/game", gameRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
