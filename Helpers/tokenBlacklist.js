const jwt = require('jsonwebtoken');
const getRedisClient = require('../config/redisClient.js');

// Function to blacklist a JWT token
const blackListToken = async (token) => {
  const decoded = jwt.decode(token);

  if (!decoded || !decoded.exp) {
    throw new Error("Invalid token");
  }
  
  console.log(`set token : bl_${token}`)
  

  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const ttl = decoded.exp - now; // Time left until token expires

  if (ttl > 0) {
    const client = getRedisClient();
    try {
      await client.set(`bl_${token}`, "loggedOut", { EX: ttl });
      console.log(`Token blacklisted for ${ttl} seconds`);
    } catch (err) {
      console.error("Error blacklisting token:", err);
    }
  } else {
    console.log("Token already expired, no need to blacklist");
  }
};

// Function to check if a token is blacklisted
const isTokenBlacklisted = async (token) => {
  const client = getRedisClient();
  
  const keys = await client.keys('bl_*');

 

  for (const key of keys) {
    const value = await client.get(key);
    console.log({ key, value });
  }

 
  
  const cleanedToken = token.replace('Bearer ', '');

  try {
    const result = await client.get(`bl_${cleanedToken}`);
    
    console.log(result);
    return result === "loggedOut";
  } catch (err) {
    console.error("Error checking token blacklist:", err);
    return false;
  }
};

module.exports = { blackListToken, isTokenBlacklisted };
