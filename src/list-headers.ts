import type { Email } from './parse.ts';

export type ListHeaders = {
  listId: string | undefined;
  unsubscribe: string[];
  post: string | undefined;
  archive: string | undefined;
};

function unwrap(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const match = value.match(/^<(.+)>$/);
  return match ? match[1] : value;
}

function parseAngleBracketList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  const results: string[] = [];
  const re = /<([^>]+)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    results.push(m[1]);
  }
  return results;
}

export function parseListHeaders(email: Email): ListHeaders {
  return {
    listId: unwrap(email.headers.get('list-id')),
    unsubscribe: parseAngleBracketList(email.headers.get('list-unsubscribe')),
    post: unwrap(email.headers.get('list-post')),
    archive: unwrap(email.headers.get('list-archive')),
  };
}
