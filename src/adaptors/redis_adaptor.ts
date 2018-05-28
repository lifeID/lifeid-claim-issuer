import * as Redis from "ioredis"; // eslint-disable-line import/no-unresolved
import * as R from "ramda";

const client = new Redis(process.env.REDIS_URL, {
  keyPrefix: "claims:"
});

function grantKeyFor(id: string) {
  return `grant:${id}`;
}

interface InterfaceRedisAdapter {
  name: string;
}

class RedisAdapter implements InterfaceRedisAdapter {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }

  public key(id: string) {
    return `${this.name}:${id}`;
  }

  public async destroy(id: string) {
    const key = this.key(id);
    const grantId = await client.hget(key, "grantId");
    const tokens = await client.lrange(grantKeyFor(grantId), 0, -1);
    const deletions = tokens.map((token: string) => client.del(token));
    deletions.push(client.del(key));
    await deletions;
  }

  public consume(id: string) {
    return client.hset(this.key(id), "consumed", Math.floor(Date.now() / 1000));
  }

  public async find(id: string) {
    const data = await client.hgetall(this.key(id));
    if (R.isEmpty(data)) {
      return undefined;
    } else if (data.dump !== undefined) {
      return JSON.parse(data.dump);
    }
    return data;
  }

  public upsert(id: string, payload: any, expiresIn: number) {
    const key = this.key(id);
    let toStore = payload;

    // Clients are not simple objects where value is always a string
    // redis does only allow string values =>
    // work around it to keep the adapter interface simple
    if (this.name === "Client" || this.name === "Session") {
      toStore = { dump: JSON.stringify(payload) };
    }

    const multi = client.multi();

    console.log("stored: ", key, toStore);
    multi.hmset(key, toStore);

    if (expiresIn) {
      multi.expire(key, expiresIn);
    }

    if (toStore.grantId) {
      const grantKey = grantKeyFor(toStore.grantId);
      multi.rpush(grantKey, key);
    }

    return multi.exec();
  }
}

export { RedisAdapter, InterfaceRedisAdapter };
