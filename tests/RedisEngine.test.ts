import { Registry } from '@universal-packages/token-registry'
import { RedisEngine } from '../src'

let engine: RedisEngine

afterEach(async (): Promise<void> => {
  await engine.clear()
  await engine.disconnect()
})

describe('Registry::RedisEngine', (): void => {
  it('uses the memory engine by default', async (): Promise<void> => {
    engine = new RedisEngine({ identifier: 'testing-registry' })

    await engine.connect()

    const registry = new Registry(engine)

    const subject = { property: 'a' }
    const token = await registry.register(subject)

    expect(registry.engine).toEqual(expect.any(RedisEngine))

    expect(await registry.retrieve(token)).toEqual(subject)

    await registry.dispose(token)

    expect(await registry.retrieve(token)).toBeUndefined()

    const token1 = await registry.register(subject, 'user:1')
    const token2 = await registry.register(subject, 'user:2')
    const token3 = await registry.register(subject, 'user:2')

    expect((await registry.categories()).sort()).toEqual(['user:2', 'user:1'].sort())
    expect(await registry.groupBy('user:1')).toEqual({ [token1]: subject })
    expect(await registry.groupBy('user:2')).toEqual({ [token2]: subject, [token3]: subject })

    await registry.dispose(token2)
    expect((await registry.categories()).sort()).toEqual(['user:2', 'user:1'].sort())
    expect(await registry.groupBy('user:1')).toEqual({ [token1]: subject })
    expect(await registry.groupBy('user:2')).toEqual({ [token3]: subject })

    await registry.dispose(token1)
    expect(await registry.categories()).toEqual(['user:2'])
    expect(await registry.groupBy('user:1')).toBeUndefined()
    expect(await registry.groupBy('user:2')).toEqual({ [token3]: subject })

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
