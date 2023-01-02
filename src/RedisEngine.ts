import { RedisEngineOptions } from './RedisEngine.types'
import { createClient, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis'
import { EngineInterface } from '@universal-packages/token-registry'

export default class RedisEngine implements EngineInterface {
  public readonly options: RedisEngineOptions
  public readonly client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>

  private isPubMine = false

  public constructor(options?: RedisEngineOptions) {
    this.options = { identifier: 'universal-registry', ...options }
    this.isPubMine = !this.options.client
    this.client = this.isPubMine ? createClient(this.options) : this.options.client
  }

  public async connect(): Promise<void> {
    if (this.client) await this.client.connect()
  }

  public async disconnect(): Promise<void> {
    if (this.client) await this.client.disconnect()
  }

  public async clear(): Promise<void> {
    const keys = await this.client.keys(`${this.options.identifier}:*`)
    if (keys.length) await this.client.del(keys)
  }

  public async delete(token: string): Promise<void> {
    const tokenCategoryKey = this.generateTokenCategoryKey(token)
    const category = await this.client.get(tokenCategoryKey)

    if (category) {
      const categoryKey = this.generateCategoryKey(category)
      await this.client.sRem(categoryKey, token)
    }

    const tokenKey = this.generateTokenKey(token)

    await this.client.del([tokenKey, tokenCategoryKey])
  }

  public async get(token: string): Promise<Record<string, any>> {
    const tokenKey = this.generateTokenKey(token)
    const serializedSubject = await this.client.get(tokenKey)

    if (serializedSubject) return JSON.parse(serializedSubject)
  }

  public async getGroup(category: string): Promise<Record<string, any>> {
    const categoryKey = this.generateCategoryKey(category)
    const tokens = await this.client.sMembers(categoryKey)

    if (tokens.length) {
      const keys = tokens.map((token: string): string => this.generateTokenKey(token))
      const serializedSubjects = await this.client.mGet(keys)
      const subjects = serializedSubjects.map((serialized: string): Record<string, any> => JSON.parse(serialized))

      return tokens.reduce((final: Record<string, any>, token: string, index: number): Record<string, any> => {
        final[token] = subjects[index]

        return final
      }, {})
    }
  }

  public async listCategories(): Promise<string[]> {
    const baseKeys = await this.client.keys(`${this.options.identifier}:category:*`)

    return baseKeys.map((key: string): string => key.replace(`${this.options.identifier}:category:`, '')).sort()
  }

  public async set(token: string, subject: Record<string, any>, category?: string): Promise<void> {
    const serializedSubject = JSON.stringify(subject)
    const tokenKey = this.generateTokenKey(token)

    await this.client.set(tokenKey, serializedSubject)

    if (category) {
      const categoryKey = this.generateCategoryKey(category)
      await this.client.sAdd(categoryKey, token)

      const tokenCategoryKey = this.generateTokenCategoryKey(token)
      await this.client.set(tokenCategoryKey, category)
    }
  }

  private generateCategoryKey(category: string): string {
    return `${this.options.identifier}:category:${category}`
  }

  private generateTokenKey(token: string): string {
    return `${this.options.identifier}:${token}`
  }

  private generateTokenCategoryKey(token: string): string {
    return `${this.options.identifier}:${token}:category`
  }
}
