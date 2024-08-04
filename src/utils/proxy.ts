import { flags } from '@/entrypoint/utils/targets';
import { Stream } from '@/providers/streams';

export function requiresProxy(stream: Stream): boolean {
  if (!stream.flags.includes(flags.CORS_ALLOWED) && !!(stream.headers && Object.keys(stream.headers).length > 0))
    return true;
  return false;
}

export function setupProxy(stream: Stream): Stream {
  const headers = stream.headers && Object.keys(stream.headers).length > 0 ? stream.headers : undefined;

  const options = {
    ...(stream.type === 'hls' && { depth: stream.proxyDepth ?? 0 }),
  };

  const payload: {
    type?: 'hls' | 'mp4';
    url?: string;
    headers?: Record<string, string>;
    options?: { depth?: 0 | 1 | 2 };
  } = {
    headers,
    options,
  };

  if (stream.type === 'hls') {
    payload.type = 'hls';
    payload.url = stream.playlist;
    stream.playlist = `https://proxy.nsbx.ru/proxy?${new URLSearchParams({ payload: Buffer.from(JSON.stringify(payload)).toString('base64url') })}`;
  }

  if (stream.type === 'file') {
    payload.type = 'mp4';
    Object.entries(stream.qualities).forEach((entry) => {
      payload.url = entry[1].url;
      entry[1].url = `https://proxy.nsbx.ru/proxy?${new URLSearchParams({ payload: Buffer.from(JSON.stringify(payload)).toString('base64url') })}`;
    });
  }

  stream.headers = {};
  stream.flags = [flags.CORS_ALLOWED];
  return stream;
}
