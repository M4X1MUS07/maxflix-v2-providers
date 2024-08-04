import { EmbedOutput, makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

export const streamTapeScraper = makeEmbed({
  id: 'streamtape',
  name: 'StreamTape',
  rank: 199,
  async scrape(ctx) {
    let url = ctx.url;
    if (ctx.url.includes('primewire')) {
      const request = await ctx.proxiedFetcher.full(ctx.url);
      url = request.finalUrl;
    }
    ctx.progress(25);
    // Match the URL pattern for streamtape.com/v/[videoID]/[optionalSuffix]
    const idMatch = url.match(/https?:\/\/streamtape\.com\/v\/([^/]+)\/?.*/);
    if (!idMatch) {
      throw new NotFoundError('Invalid URL format');
    }

    const videoID = idMatch[1];
    const vidScrapeURL = `https://streamscrape.wafflehacker.io/scrape?id=${encodeURIComponent(videoID)}`;
    ctx.progress(50);
    const vidScrape = await ctx.fetcher(vidScrapeURL);
    ctx.progress(100);
    return vidScrape as EmbedOutput;
  },
});
