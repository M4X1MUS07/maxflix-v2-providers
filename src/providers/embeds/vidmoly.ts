import { EmbedOutput, makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

export const vidMolyScraper = makeEmbed({
  id: 'vidmoly',
  name: 'Vidmoly',
  rank: 194,
  async scrape(ctx) {
    let url = ctx.url;
    if (ctx.url.includes('primewire')) {
      const request = await ctx.proxiedFetcher.full(ctx.url);
      url = request.finalUrl;
    }

    // Match the URL pattern for vidmoly.to or vidmoly.me/w/[videoID]
    const idMatch = url.match(/https?:\/\/vidmoly\.(to|me)\/w\/([^?]+)/);
    if (!idMatch) {
      throw new NotFoundError('Invalid URL format');
    }

    const videoID = idMatch[2];
    const vidScrapeURL = `https://vidmoly.wafflehacker.io/scrape?id=${encodeURIComponent(videoID)}`;
    ctx.progress(50);
    const vidScrape = await ctx.fetcher(vidScrapeURL);
    ctx.progress(100);
    return vidScrape as EmbedOutput;
  },
});
