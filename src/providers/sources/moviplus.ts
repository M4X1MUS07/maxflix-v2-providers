// todo: tv shows
// I just forgot about tv shows
// and they are gonna need a lot of season and episode parsing
// and i dont feel like doing that now
import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { compareMedia } from '@/utils/compare';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://arbplus.net';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const searchPage = await ctx.proxiedFetcher('/', {
    baseUrl,
    query: {
      s: ctx.media.title,
    },
  });

  const search$ = load(searchPage);
  const searchResults: { title: string; year?: number; id: string }[] = [];

  search$('.item-box').each((_, element) => {
    const [, title, year] =
      search$(element)
        .find('a')
        .attr('title')
        ?.match(/^(.*?)\s*(?:\(?\s*(\d{4})(?:\s*-\s*\d{0,4})?\s*\)?)?\s*$/) || [];
    const id = search$(element).find('span').first().attr('data-itemid');
    if (!title || !id) return;

    searchResults.push({ title, year: year ? Number(year) : undefined, id });
  });

  const id = searchResults.find((x) => x && compareMedia(ctx.media, x.title, x.year))?.id;
  if (!id) throw new NotFoundError('No watchable item found');

  const apiRes: { embed_url: string } = await ctx.proxiedFetcher('/wp-admin/admin-ajax.php', {
    baseUrl,
    method: 'POST',
    body: new URLSearchParams({
      action: 'zeta_player_ajax',
      post: id,
      nume: '1',
      type: 'mv',
    }),
  });
  if (!apiRes.embed_url) throw new Error('No sources found');

  const iframeUrl = load(apiRes.embed_url)('iframe').attr('src');
  if (!iframeUrl) throw new Error('iFrame Url not found');

  const iframePage$ = load(await ctx.proxiedFetcher(iframeUrl));

  const links: string[] = [];
  iframePage$('.dropdown-item').each((_, element) => {
    const link = iframePage$(element).attr('href');
    if (link?.startsWith('https:')) links.push(link);
  });

  const embeds: SourcererEmbed[] = [];

  for (const url of links) {
    if (links.includes(url)) {
      const origin = new URL(url).hostname;

      let embedId;
      switch (origin) {
        case 'vidker.com':
          embedId = 'vidker';
          break;
        default:
          embedId = undefined;
      }

      if (!embedId) continue;
      embeds.push({ embedId, url });
    }
  }

  return {
    embeds,
  };
}

export const moviplusScraper = makeSourcerer({
  id: 'moviplus',
  name: 'MoviPlus',
  rank: 92,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
});
