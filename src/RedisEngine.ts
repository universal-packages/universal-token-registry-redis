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
    const key = this.generateTokenKey(token)
    const serializedSubject = await this.client.get(key)
    const entry = JSON.parse(serializedSubject)

    if (entry) {
      if (entry.category) {
        const categoryKey = this.generateCategoryKey(entry.category)
        this.client.lRem(categoryKey, 0, token)
      }

      const key = this.generateTokenKey(token)
      await this.client.del(key)
    }
  }

  public async get(token: string): Promise<Record<string, any>> {
    const key = this.generateTokenKey(token)
    const serializedSubject = await this.client.get(key)

    if (serializedSubject) return JSON.parse(serializedSubject).subject
  }

  public async getGroup(category: string): Promise<Record<string, any>> {
    const categoryKey = this.generateCategoryKey(category)
    const tokens = await this.client.lRange(categoryKey, 0, -1)

    if (tokens.length) {
      const keys = tokens.map((token: string): string => this.generateTokenKey(token))
      const serializedSubjects = await this.client.mGet(keys)
      const subjects = serializedSubjects.map((serialized: string): Record<string, any> => JSON.parse(serialized).subject)

      return tokens.reduce((final: Record<string, any>, token: string, index: number): Record<string, any> => {
        final[token] = subjects[index]

        return final
      }, {})
    }
  }

  public async listCategories(): Promise<string[]> {
    const baseKeys = await this.client.keys(`${this.options.identifier}:category:*`)

    return baseKeys.map((key: string): string => key.replace(`${this.options.identifier}:category:`, ''))
  }

  public async set(token: string, subject: Record<string, any>, category?: string): Promise<void> {
    const key = this.generateTokenKey(token)
    const serializedSubject = JSON.stringify({ subject, category })

    await this.client.set(key, serializedSubject)

    if (category) {
      const categoryKey = this.generateCategoryKey(category)
      await this.client.rPush(categoryKey, token)
    }
  }

  private generateTokenKey(token: string): string {
    return `${this.options.identifier}:${token}`
  }

  private generateCategoryKey(category: string): string {
    return `${this.options.identifier}:category:${category}`
  }
}
