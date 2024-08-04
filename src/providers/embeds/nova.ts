import { EmbedOutput, makeEmbed } from '@/providers/base';
import { baseUrl } from '@/providers/sources/whvx';
import { NotFoundError } from '@/utils/errors';

export const novaScraper = makeEmbed({
  id: 'nova',
  name: 'Nova',
  rank: 670,
  disabled: false,
  async scrape(ctx) {
    let progress = 50;
    const interval = setInterval(() => {
      if (progress < 100) {
        progress += 1;
        ctx.progress(progress);
      }
    }, 100);

    try {
      const search = await ctx.fetcher(`${baseUrl}/search?query=${encodeURIComponent(ctx.url)}`);
      if (search.statusCode === 404) {
        throw new Error('No files found');
      }
      const result = await ctx.fetcher(`${baseUrl}/source?resourceId=${encodeURIComponent(search.url)}`);
      if (result.statusCode === 404) {
        throw new Error('No streams found');
      }
      clearInterval(interval);
      ctx.progress(100);
      return result as EmbedOutput;
    } catch (error) {
      clearInterval(interval);
      ctx.progress(100);
      throw new NotFoundError('Failed to search');
    }
  },
});
