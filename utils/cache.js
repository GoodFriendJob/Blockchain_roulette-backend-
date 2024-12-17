const redis = require("redis");
const logger = require("./logger");

const redisClient = redis.createClient({
  password: 'I8CzLY1x3L7tDANQEJKHn1YMIGGAolJM',
  socket: {
      host: 'redis-10542.c264.ap-south-1-1.ec2.redns.redis-cloud.com',
      port: 10542
  }
});
redisClient.on("error", (err) => logger.error(`Redis error: ${err}`));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info("Redis connected");
  } catch (err) {
    logger.error(`Redis connection failed: ${err}`);
  }
};

module.exports = { redisClient, connectRedis };


