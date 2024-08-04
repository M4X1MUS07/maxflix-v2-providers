import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

const linkRegex = /file: ?"(http.*?)"/;
// the white space charecters may seem useless, but without them it breaks
export const filelionsScraper = makeEmbed({
  id: 'filelions',
  name: 'filelions',
  rank: 115,
  async scrape(ctx) {
    const mainPageRes = await ctx.proxiedFetcher.full<string>(ctx.url, {
      headers: {
        referer: ctx.url,
      },
    });
    const mainPage = mainPageRes.body;
    const streamUrl = mainPage.match(linkRegex) ?? [];
    const playlist = `https://m3u8.wafflehacker.io/m3u8-proxy?url=${encodeURIComponent(streamUrl[1])}`;
    if (!playlist) throw new Error('Stream url not found');

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});
