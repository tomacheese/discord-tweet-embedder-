import { Client, GatewayIntentBits, Partials } from 'discord.js'
import { Logger } from '@book000/node-utils'
import { Configuration } from './config'
import { Embedder } from './embedder'
import { Twitter } from '@book000/twitterts'

export class Discord {
  private config: Configuration
  public readonly client: Client
  private twitter: Twitter

  constructor(config: Configuration, twitter: Twitter) {
    const logger = Logger.configure('Discord.constructor')
    this.twitter = twitter
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.User],
    })
    this.client.on('ready', this.onReady.bind(this))

    const eventHandler = new Embedder(this)
    this.client.on('messageCreate', (message) => {
      eventHandler.onMessageCreate(message).catch((error: unknown) => {
        logger.error('❌ Failed to handle message', error as Error)
      })
    })

    this.client.login(config.get('discord').token).catch((error: unknown) => {
      const logger = Logger.configure('Discord.login')
      logger.error('❌ Failed to login to Discord', error as Error)
    })

    this.config = config
  }

  public getClient() {
    return this.client
  }

  public getTwitter() {
    return this.twitter
  }

  public getConfig() {
    return this.config
  }

  public async close() {
    await this.client.destroy()
  }

  onReady() {
    const logger = Logger.configure('Discord.onReady')
    logger.info(`👌 ready: ${this.client.user?.tag}`)
  }

  waitReady() {
    return new Promise<void>((resolve) => {
      if (this.client.isReady()) {
        resolve()
      }
      this.client.once('ready', () => {
        resolve()
      })
    })
  }
}
