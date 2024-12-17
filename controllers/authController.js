const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const logger = require("../utils/logger");

const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// Register User
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: "User already exists with this email or username" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      email, 
      password: hashedPassword 
    });
    
    await user.save();
    
    // Generate token but don't send password in response
    const token = generateToken(user);
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      user_level: user.user_level
    };
    
    res.status(201).json({ token, user: userResponse });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ error: "Registration failed" });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = generateToken(user);
    res.json({ token, user });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ error: "Login failed" });
  }
};

// Google OAuth Login
exports.googleOAuth = async (req, res) => {
  const { tokenId } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name } = ticket.getPayload();
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ username: name, email });
      await user.save();
    }
    const token = generateToken(user);
    res.json({ token, user });
  } catch (error) {
    logger.error(`Google OAuth error: ${error.message}`);
    res.status(500).json({ error: "OAuth login failed" });
  }
};
