import { Registry } from '@universal-packages/token-registry'
import { RedisEngine } from '../src'

let engine: RedisEngine

afterEach(async (): Promise<void> => {
  if (engine) {
    await engine.clear()
    await engine.release()
  }
})

describe('Registry::RedisEngine', (): void => {
  it('can gran a global client', async (): Promise<void> => {
    global['client'] = jest.fn()

    const engine = new RedisEngine({ globalClient: 'client', identifier: 'testing-registry' })

    expect(engine).toMatchObject({ client: global['client'] })
  })

  it('behaves as expected', async (): Promise<void> => {
    engine = new RedisEngine({ identifier: 'testing-registry' })

    const registry = new Registry({ engine })

    await registry.initialize()

    expect(registry.options.engine).toEqual(engine)

    const subject = { property: 'a' }
    const token = await registry.register(subject)

    expect(await registry.retrieve(token)).toEqual(subject)

    await registry.dispose(token)

    expect(await registry.retrieve(token)).toBeUndefined()

    const token1 = await registry.register(subject, 'user:1')
    const token2 = await registry.register(subject, 'user:2')
    const token3 = await registry.register(subject, 'user:2')

    await registry.update(token3, { ...subject, updated: true })

    expect(await registry.categories()).toEqual(['user:1', 'user:2'])
    expect(await registry.groupBy('user:1')).toEqual({ [token1]: subject })
    expect(await registry.groupBy('user:2')).toEqual({ [token2]: subject, [token3]: { ...subject, updated: true } })

    await registry.dispose(token2)
    expect(await registry.categories()).toEqual(['user:1', 'user:2'])
    expect(await registry.groupBy('user:1')).toEqual({ [token1]: subject })
    expect(await registry.groupBy('user:2')).toEqual({ [token3]: { ...subject, updated: true } })

    await registry.dispose(token1)
    expect(await registry.categories()).toEqual(['user:2'])
    expect(await registry.groupBy('user:1')).toBeUndefined()
    expect(await registry.groupBy('user:2')).toEqual({ [token3]: { ...subject, updated: true } })

    await registry.dispose(token3)
    expect(await registry.categories()).toEqual([])
    expect(await registry.groupBy('user:1')).toBeUndefined()
    expect(await registry.groupBy('user:2')).toBeUndefined()

    const token4 = await registry.register(subject, 'user:1')

    await registry.clear()

    expect(await registry.categories()).toEqual([])
    expect(await registry.retrieve(token4)).toBeUndefined()
  })
})
