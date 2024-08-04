import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 1;
    if (progress === 100) throw new NotFoundError('No data found for this show/movie');
    ctx.progress(progress);
  }, 100);

  let url = `https://nsbx.000000077.xyz/vault?tmdbId=${ctx.media.tmdbId}`; // :)
  if (ctx.media.type === 'show') url += `&season=${ctx.media.season.number}&episode=${ctx.media.episode.number}`;

  const response = await ctx.fetcher(url);

  if (response) return response as SourcererOutput;

  clearInterval(interval);
  throw new NotFoundError('No data found for this show/movie');
}

export const showboxScraper = makeSourcerer({
  id: 'showbox',
  name: 'Showbox',
  rank: 150,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeShow: comboScraper,
  scrapeMovie: comboScraper,
});
