import { RedisEngineOptions } from './RedisEngine.types'
import { createClient, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis'
import { EngineInterface } from '@universal-packages/token-registry'

export default class RedisEngine implements EngineInterface {
  public readonly options: RedisEngineOptions
  public readonly client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>

  private isClientMine = false

  public constructor(options?: RedisEngineOptions) {
    this.options = { identifier: 'universal-registry', ...options }

    const globalClient = global[this.options.globalClient]

    this.isClientMine = !globalClient && !this.options.client
    this.client = globalClient || this.options.client || createClient(this.options)
  }

  public async initialize(): Promise<void> {
    if (this.isClientMine) await this.client.connect()
  }

  public async release(): Promise<void> {
    if (this.isClientMine) await this.client.disconnect()
  }

  public async clear(): Promise<void> {
    const keys = await this.client.keys(`${this.options.identifier}:*`)
    if (keys.length) await this.client.del(keys)
  }

  public async delete(token: string): Promise<void> {
    const tokenKey = this.generateSearchTokenKey(token)
    const actualTokenKey = (await this.client.keys(tokenKey))[0]

    await this.client.del(actualTokenKey)
  }

  public async get(token: string): Promise<Record<string, any>> {
    const tokenKey = this.generateSearchTokenKey(token)
    const actualTokenKey = (await this.client.keys(tokenKey))[0]

    if (actualTokenKey) {
      const serializedSubject = await this.client.get(actualTokenKey)

      return JSON.parse(serializedSubject)
    }
  }

  public async getAll(category: string): Promise<Record<string, any>> {
    const tokenKey = this.generateSearchCategoryKey(category)
    const tokens = await this.client.keys(tokenKey)

    if (tokens.length) {
      const serializedSubjects = await this.client.mGet(tokens)
      const subjects = serializedSubjects.map((serialized: string): Record<string, any> => JSON.parse(serialized))

      return tokens.reduce((final: Record<string, any>, token: string, index: number): Record<string, any> => {
        const tokenParts = token.split(':')
        const actualTokenKey = tokenParts[tokenParts.length - 1]
        final[actualTokenKey] = subjects[index]

        return final
      }, {})
    }
  }

  public async set(token: string, category: string, subject: Record<string, any>): Promise<void> {
    const serializedSubject = JSON.stringify(subject)
    const tokenKey = this.generateTokenKey(token, category)

    if (this.options.expireAfter) {
      await this.client.setEx(tokenKey, this.options.expireAfter, serializedSubject)
    } else {
      await this.client.set(tokenKey, serializedSubject)
    }
  }

  private generateTokenKey(token: string, category: string): string {
    return `${this.options.identifier}:${category}:${token}`
  }

  private generateSearchTokenKey(token: string): string {
    return `${this.options.identifier}:*:${token}`
  }

  private generateSearchCategoryKey(category: string): string {
    return `${this.options.identifier}:${category}:*`
  }
}
