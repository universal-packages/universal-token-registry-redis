import { RedisClientOptions, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis'

export interface RedisEngineOptions extends RedisClientOptions {
  client?: RedisClientType<RedisModules, RedisFunctions, RedisScripts>
  globalClient?: string
  identifier?: string
  expireAfter?: number
}
