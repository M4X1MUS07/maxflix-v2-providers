import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { Caption, getCaptionTypeFromUrl, labelToLanguageCode } from '@/providers/captions';
import { FileBasedStream } from '@/providers/streams';
import { getValidQualityFromString } from '@/utils/quality';

export const vidkerScraper = makeEmbed({
  id: 'vidker',
  name: 'VidKer',
  rank: 93,
  async scrape(ctx) {
    const embed = await ctx.proxiedFetcher<string>(ctx.url);

    const sourcesMatch = embed.match(/sources:\s*(\[.*?\])/)?.[1];
    const tracksMatch = embed.match(/tracks:\s*(\[[^\]]*\])/)?.[1];
    if (!sourcesMatch) throw new Error('No sources found');

    const sources: { file: string; label: string }[] = JSON.parse(sourcesMatch.replace(/(\w+):"(\S*?)"/g, '"$1":"$2"'));
    const tracks: { file: string; label: string }[] = JSON.parse(
      tracksMatch?.replace(/\s+/g, '').replace(/(\w+):"(\S*?)"/g, '"$1":"$2"') ?? '[]',
    );

    const qualities = sources.reduce(
      (acc, source) => {
        const validQuality = getValidQualityFromString(source.label);
        acc[validQuality] = {
          type: 'mp4',
          url: `${source.file}`,
        };
        return acc;
      },
      {} as FileBasedStream['qualities'],
    );

    const captions: Caption[] = [];

    for (const caption of tracks) {
      const language = labelToLanguageCode(caption.label);
      const captionType = getCaptionTypeFromUrl(caption.file);
      if (!language || !captionType) continue;
      captions.push({
        id: caption.file,
        url: caption.file,
        type: captionType,
        language,
        hasCorsRestrictions: false,
      });
    }

    return {
      stream: [
        {
          id: 'primary',
          type: 'file',
          qualities,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});
