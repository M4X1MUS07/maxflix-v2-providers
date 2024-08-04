import { doodScraper } from '@/providers/embeds/dood';
import { novaScraper } from '@/providers/embeds/nova';
import { alphaScraper, deltaScraper } from '@/providers/embeds/nsbx';
import { playm4uNMScraper } from '@/providers/embeds/playm4u/nm';
import { streamTapeScraper } from '@/providers/embeds/streamtape';
import { upstreamScraper } from '@/providers/embeds/upstream';
import { warezcdnembedMp4Scraper } from '@/providers/embeds/warezcdn/mp4';
import { soaperTvScraper } from '@/providers/sources/soapertv';
import { vidSrcToScraper } from '@/providers/sources/vidsrcto';
import { Stream } from '@/providers/streams';
import { IndividualEmbedRunnerOptions } from '@/runners/individualRunner';
import { ProviderRunnerOptions } from '@/runners/runner';

const SKIP_VALIDATION_CHECK_IDS = [
  warezcdnembedMp4Scraper.id,
  upstreamScraper.id,
  doodScraper.id,
  alphaScraper.id,
  deltaScraper.id,
  vidSrcToScraper.id,
  streamTapeScraper.id,
  novaScraper.id,
  playm4uNMScraper.id,
  soaperTvScraper.id,
];

export function isValidStream(stream: Stream | undefined): boolean {
  if (!stream) return false;
  if (stream.type === 'hls') {
    if (!stream.playlist) return false;
    return true;
  }
  if (stream.type === 'file') {
    const validQualities = Object.values(stream.qualities).filter((v) => v.url.length > 0);
    if (validQualities.length === 0) return false;
    return true;
  }

  // unknown file type
  return false;
}

export async function validatePlayableStream(
  stream: Stream,
  ops: ProviderRunnerOptions | IndividualEmbedRunnerOptions,
  sourcererId: string,
): Promise<Stream | null> {
  if (SKIP_VALIDATION_CHECK_IDS.includes(sourcererId)) return stream;

  if (stream.type === 'hls') {
    // dirty temp fix for base64 urls to prep for fmhy poll
    if (stream.playlist.startsWith('data:')) return stream;

    const result = await ops.proxiedFetcher.full(stream.playlist, {
      method: 'GET',
      headers: {
        ...stream.preferredHeaders,
        ...stream.headers,
      },
    });
    if (result.statusCode < 200 || result.statusCode >= 400) return null;
    return stream;
  }
  if (stream.type === 'file') {
    const validQualitiesResults = await Promise.all(
      Object.values(stream.qualities).map((quality) =>
        ops.proxiedFetcher.full(quality.url, {
          method: 'GET',
          headers: {
            ...stream.preferredHeaders,
            ...stream.headers,
            Range: 'bytes=0-1',
          },
        }),
      ),
    );
    // remove invalid qualities from the stream
    const validQualities = stream.qualities;
    Object.keys(stream.qualities).forEach((quality, index) => {
      if (validQualitiesResults[index].statusCode < 200 || validQualitiesResults[index].statusCode >= 400) {
        delete validQualities[quality as keyof typeof stream.qualities];
      }
    });

    if (Object.keys(validQualities).length === 0) return null;
    return { ...stream, qualities: validQualities };
  }
  return null;
}

export async function validatePlayableStreams(
  streams: Stream[],
  ops: ProviderRunnerOptions | IndividualEmbedRunnerOptions,
  sourcererId: string,
): Promise<Stream[]> {
  if (SKIP_VALIDATION_CHECK_IDS.includes(sourcererId)) return streams;

  return (await Promise.all(streams.map((stream) => validatePlayableStream(stream, ops, sourcererId)))).filter(
    (v) => v !== null,
  ) as Stream[];
}
