import { Registry } from '@universal-packages/token-registry'
import { RedisEngine } from '../src'

describe('Registry::RedisEngine', (): void => {
  it('uses the memory engine by default', async (): Promise<void> => {
    const engine = new RedisEngine({ identifier: 'testing-registry' })

    await engine.connect()

    const registry = new Registry(engine)

    const subject = { property: 'a' }
    const token = await registry.register(subject)

    expect(registry.engine).toEqual(expect.any(RedisEngine))

    expect(await registry.retrieve(token)).toEqual(subject)

    await registry.dispose(token)

    expect(await registry.retrieve(token)).toBeNull()

    await engine.disconnect()
  })
})
