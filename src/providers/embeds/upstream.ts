import { EmbedOutput, makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

export const upstreamScraper = makeEmbed({
  id: 'upstream',
  name: 'UpStream',
  rank: 160,
  async scrape(ctx) {
    let url = ctx.url;
    if (ctx.url.includes('primewire')) {
      const request = await ctx.proxiedFetcher.full(ctx.url);
      url = request.finalUrl;
    }

    const idMatch = url.match(/https:\/\/upstream\.to\/(.+)$/);
    if (!idMatch) {
      throw new NotFoundError('Invalid URL format');
    }

    const videoID = idMatch[1];
    const vidScrapeURL = `https://upstream.wafflehacker.io/scrape?id=${encodeURIComponent(videoID)}`;
    ctx.progress(50);
    const vidScrape = await ctx.fetcher(vidScrapeURL);
    ctx.progress(100);
    return vidScrape as EmbedOutput;
  },
});
