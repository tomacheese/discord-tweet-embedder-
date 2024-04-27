import { APIEmbed, ChannelType, Message } from 'discord.js'
import { Discord } from './discord'
import { FullUser, TrimmedUser } from 'twitter-d'

export class Embedder {
  private discord: Discord

  private readonly twitterDomainTweetUrlRegex =
    /https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/

  private readonly xDomainTweetUrlRegex =
    /https?:\/\/x\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/

  constructor(discord: Discord) {
    this.discord = discord
  }

  public async onMessageCreate(message: Message) {
    // サーバ以外は無視 & メンバーが取得できない場合は無視
    if (!message.guild || !message.member) return
    // Botは無視
    if (message.author.bot) return
    // サーバのテキストチャンネルとスレッド以外は無視
    if (
      message.channel.type !== ChannelType.GuildText &&
      message.channel.type !== ChannelType.PublicThread &&
      message.channel.type !== ChannelType.PrivateThread
    )
      return

    // メッセージにツイートのURLが含まれていない場合は無視
    const tweetId = this.getTweetIdFromUrl(message.content)
    if (!tweetId) return

    const twitter = this.discord.getTwitter()

    let embed: APIEmbed | null = null
    try {
      const tweet = await twitter.getTweet({
        tweetId,
      })

      if (!this.isFullUser(tweet.user)) {
        throw new Error('tweet.user is not FullUser')
      }

      embed = {
        url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
        description: tweet.full_text,
        author: {
          name: tweet.user.name + ` (@${tweet.user.screen_name})`,
          url: `https://twitter.com/${tweet.user.screen_name}`,
          icon_url: tweet.user.profile_image_url_https,
        },
        fields: [
          {
            name: '💖 Likes',
            value: tweet.favorite_count.toString(),
            inline: true,
          },
          {
            name: '🔁 Retweets',
            value: tweet.retweet_count.toString(),
            inline: true,
          },
        ],
        footer: {
          text: 'Twitter',
          icon_url: 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png',
        },
        color: 0x1d_a1_f2,
        timestamp: new Date(tweet.created_at).toISOString(),
      }
      const tweetMedia = tweet.extended_entities?.media ?? []
      if (tweetMedia.length > 0) {
        embed.image = {
          url: tweetMedia[0].media_url_https,
        }
      }
    } catch (error) {
      embed = {
        description: 'ツイートの取得に失敗しました',
        fields: [
          {
            name: 'ErrorName',
            value: (error as Error).name,
          },
          {
            name: 'ErrorMessage',
            value: (error as Error).message,
          },
        ],
        color: 0xff_00_00,
      }
    }

    await message.channel.send({
      embeds: [embed],
      reply: {
        messageReference: message,
      },
      allowedMentions: {
        repliedUser: false,
      },
    })
  }

  private getTweetIdFromUrl(content: string) {
    const twitterDomainTweetUrlMatch = content.match(
      this.twitterDomainTweetUrlRegex
    )
    if (twitterDomainTweetUrlMatch) {
      return twitterDomainTweetUrlMatch[3]
    }

    const xDomainTweetUrlMatch = content.match(this.xDomainTweetUrlRegex)
    if (xDomainTweetUrlMatch) {
      return xDomainTweetUrlMatch[3]
    }

    return null
  }

  private isFullUser(user: TrimmedUser | FullUser): user is FullUser {
    return 'screen_name' in user
  }
}
