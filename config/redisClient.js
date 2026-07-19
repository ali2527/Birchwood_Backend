// config/redisClient.js
const { createClient } = require('redis');

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createClient();

    redisClient.on('error', (err) => {
      console.error('Redis Error:', err);
    });

    redisClient.connect()
      .then(() => {
        console.log('Redis Connected');
      })
      .catch((err) => {
        console.error('Error in Redis Connection', err);
      });
  }

  return redisClient;
};

module.exports = getRedisClient;
