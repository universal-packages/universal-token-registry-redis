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

  public async set(token: string, subject: Record<string, any>): Promise<void> {
    const key = this.generateKey(token)
    const serializedSubject = typeof subject !== 'string' ? JSON.stringify(subject) : subject

    await this.client.set(key, serializedSubject)
  }

  public async get(token: string): Promise<Record<string, any>> {
    const key = this.generateKey(token)
    const serializedSubject = await this.client.get(key)

    try {
      return JSON.parse(serializedSubject)
    } catch {
      return serializedSubject as any
    }
  }

  public async delete(token: string): Promise<void> {
    const key = this.generateKey(token)
    await this.client.del(key)
  }

  private generateKey(token: string): string {
    return `${this.options.identifier}:${token}`
  }
}
