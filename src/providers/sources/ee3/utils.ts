import { load } from 'cheerio';

import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { parseSetCookie } from '@/utils/cookie';

import { baseUrl } from './common';
import { loginResponse } from './types';

export async function login(
  user: string,
  pass: string,
  ctx: ShowScrapeContext | MovieScrapeContext,
): Promise<string | null> {
  const req = await ctx.proxiedFetcher.full<string>('/login', {
    baseUrl,
    method: 'POST',
    body: new URLSearchParams({ user, pass, action: 'login' }),
    readHeaders: ['Set-Cookie'],
  });
  const res: loginResponse = JSON.parse(req.body);

  const cookie = parseSetCookie(
    // It retruns a cookie even when the login failed
    // I have the backup cookie here just in case
    res.status === 1 ? req.headers.get('Set-Cookie') ?? '' : 'PHPSESSID=mk2p73c77qc28o5i5120843ruu;',
  );

  return cookie.PHPSESSID.value;
}

export function parseSearch(body: string): { title: string; year: number; id: string }[] {
  const result: { title: string; year: number; id: string }[] = [];

  const $ = load(body);
  $('div').each((_, element) => {
    const title = $(element).find('.title').text().trim();
    const year = parseInt($(element).find('.details span').first().text().trim(), 10);
    const id = $(element).find('.control-buttons').attr('data-id');

    if (title && year && id) {
      result.push({ title, year, id });
    }
  });

  return result;
}
