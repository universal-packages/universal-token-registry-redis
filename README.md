# Token Registry Redis

[![npm version](https://badge.fury.io/js/@universal-packages%2Ftoken-registry-redis.svg)](https://www.npmjs.com/package/@universal-packages/token-registry-redis)
[![Testing](https://github.com/universal-packages/universal-token-registry-redis/actions/workflows/testing.yml/badge.svg)](https://github.com/universal-packages/universal-token-registry-redis/actions/workflows/testing.yml)
[![codecov](https://codecov.io/gh/universal-packages/universal-token-registry-redis/branch/main/graph/badge.svg?token=CXPJSN8IGL)](https://codecov.io/gh/universal-packages/universal-token-registry-redis)

Redis engine for [universal-token-registry](https://github.com/universal-packages/universal-token-registry).

## Install

```shell
npm install @universal-packages/token-registry-redis

npm install @universal-packages/token-registry
npm install redis
```

## RedisEngine

Just pass this engine to the registry to enable it to use ready as the storage engine.

```js
import { Registry } from '@universal-packages/universal-token-registry'
import { RedisEngine } from '@universal-packages/universal-token-registry-redis'

const registry = new Registry({ engine: 'redis', engineOptions: { host: 'localhost' } })

await registry.initialize()
```

### Options

`RedisEngine` takes the same [options](https://github.com/redis/node-redis/blob/master/docs/client-configuration.md) as the redis client.

Additionally takes the following ones:

- **`client`** `RedisClient`
  If you already have a client working in your app you can pass the instance here to not connect another client inside the instance.
- **`globalClient`** `String`
  If the redis client lives in a global variable, name it here.
- **`identifier`** `String`
  String to prepend for identifying the registry related keys.

## Typescript

This library is developed in TypeScript and shipped fully typed.

## Contributing

The development of this library happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving this library.

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Contributing Guide](./CONTRIBUTING.md)

### License

[MIT licensed](./LICENSE).
