import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { Caption, getCaptionTypeFromUrl, labelToLanguageCode } from '@/providers/captions';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

interface Source {
  name: string;
  data: {
    stream: string;
    subtitle: Array<{ lang: string; file: string }>;
  };
}

interface ApiResponse {
  sources: Source[];
  url: string;
}

const universalScraper = async (ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> => {
  const apiRes: ApiResponse = await ctx.fetcher<ApiResponse>(
    `https://vidsrcto-two.vercel.app/vidsrc/${ctx.media.tmdbId}`,
    {
      query: {
        ...(ctx.media.type === 'show' && {
          s: ctx.media.season.number.toString(),
          e: ctx.media.episode.number.toString(),
        }),
      },
    },
  );

  const vidplaySource = apiRes.sources.find((source) => source.name === 'F2Cloud');
  if (!vidplaySource || !vidplaySource.data.stream) {
    throw new NotFoundError('No stream found.');
  }

  const vidplayStreamURL = vidplaySource.data.stream;
  const proxiedStreamURL = `https://m3u8.wafflehacker.io/m3u8-proxy?url=${encodeURIComponent(vidplayStreamURL)}`;
  const subtitles = Array.isArray(vidplaySource.data.subtitle) ? vidplaySource.data.subtitle : [];

  const captions: Caption[] =
    subtitles?.map((sub) => {
      const language = labelToLanguageCode(sub.lang) || 'und'; // Provide a default value if null
      const captionType = getCaptionTypeFromUrl(sub.file) || 'vtt'; // Set a default value for captionType

      return {
        id: sub.file,
        url: sub.file,
        type: captionType,
        language,
        hasCorsRestrictions: false,
      };
    }) || [];

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: proxiedStreamURL,
        captions,
        flags: [flags.CORS_ALLOWED],
      },
    ],
  };
};

export const vidSrcToScraper = makeSourcerer({
  id: 'vidsrcto',
  name: 'VidSrcTo',
  disabled: true,
  scrapeMovie: universalScraper,
  scrapeShow: universalScraper,
  flags: [flags.CORS_ALLOWED],
  rank: 135,
});
