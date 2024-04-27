import { ConfigFramework } from '@book000/node-utils'

export interface ConfigInterface {
  discord: {
    token: string
  }
  twitter: {
    username: string
    password: string
    otpSecret: string
  }
}

export class Configuration extends ConfigFramework<ConfigInterface> {
  protected validates(): Record<string, (config: ConfigInterface) => boolean> {
    return {
      'discord is required': (config) => !!config.discord,
      'discord.token is required': (config) => !!config.discord.token,
      'discord.token must be a string': (config) =>
        typeof config.discord.token === 'string',
      'twitter is required': (config) => !!config.twitter,
      'twitter.username is required': (config) => !!config.twitter.username,
      'twitter.username must be a string': (config) =>
        typeof config.twitter.username === 'string',
      'twitter.password is required': (config) => !!config.twitter.password,
      'twitter.password must be a string': (config) =>
        typeof config.twitter.password === 'string',
      'twitter.otpSecret is required': (config) => !!config.twitter.otpSecret,
      'twitter.otpSecret must be a string': (config) =>
        typeof config.twitter.otpSecret === 'string',
    }
  }
}
