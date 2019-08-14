/*eslint no-console: ["error", { allow: ["log"] }] */

// dependencies --------------------------------------------------
import Redis from 'ioredis'

let redis = null
let redlock = null

const logConnect = instance => console.log(
  'Connecting to Redis "redis://%s:%d/0"',
  instance.host,
  instance.port,
)
const logConnections = config => Array.isArray(config)
  ? config.forEach(logConnect)
  : logConnect(config)

const connect = async config => {
  return new Promise(resolve => {
    if (!redis) {

      logConnections(config)

      redis = new Redis.Cluster(config)
      redis.on('connect', () => {
        resolve(redis)
      })
    } else {
      resolve(redis)
    }
  })
}

export default { connect }
export { redis, redlock, connect }
