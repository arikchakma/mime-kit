import { decodeEntity } from './entities.ts';
import { STATE } from './state.ts';
import type { State } from './state.ts';
import { BLOCK_TAGS, SKIP_TAGS } from './tags.ts';

const LINK_START = '\x01';
const LINK_END = '\x02';

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

function resolveLink(raw: string): string {
  const startMarker = raw.lastIndexOf(LINK_START);
  if (startMarker === -1) {
    return raw;
  }

  const endMarker = raw.indexOf(LINK_END, startMarker);
  if (endMarker === -1) {
    return raw;
  }

  const href = raw.slice(startMarker + 1, endMarker);
  const before = raw.slice(0, startMarker);
  const linkText = raw.slice(endMarker + 1).trim();

  if (linkText && linkText !== href) {
    return before + linkText + ' (' + href + ')';
  }
  return before + (linkText || href);
}

export function textFromHtml(html: string): string {
  let out = '';
  let state: State = STATE.TEXT;
  let tagName = '';
  let isClose = false;
  let skipDepth = 0;

  let attrName = '';
  let attrValue = '';
  let attrs: Record<string, string> = {};

  let entity = '';
  let inEntity = false;

  function flushTag(): void {
    const name = tagName.toLowerCase();

    if (isClose) {
      if (skipDepth > 0) {
        if (SKIP_TAGS.has(name)) {
          skipDepth--;
        }
        return;
      }
      if (BLOCK_TAGS.has(name)) {
        out += '\n';
      }
      return;
    }

    if (skipDepth > 0) {
      if (SKIP_TAGS.has(name)) {
        skipDepth++;
      }
      return;
    }

    if (SKIP_TAGS.has(name)) {
      skipDepth++;
      return;
    }

    if (name === 'br' || name === 'hr') {
      out += '\n';
      return;
    }

    if (name === 'a' && attrs['href']) {
      out += LINK_START + attrs['href'] + LINK_END;
    }
  }

  function commitAttr(): void {
    if (attrName) {
      attrs[attrName.toLowerCase()] = attrValue;
      attrName = '';
      attrValue = '';
    }
  }

  for (let i = 0; i < html.length; i++) {
    const ch = html[i];

    if (inEntity && state === STATE.TEXT) {
      if (ch === ';') {
        out += decodeEntity(entity);
        entity = '';
        inEntity = false;
        continue;
      }
      if (entity.length < 10 && ch !== ' ' && ch !== '<') {
        entity += ch;
        continue;
      }
      out += '&' + entity;
      entity = '';
      inEntity = false;
    }

    switch (state) {
      case STATE.TEXT: {
        if (ch === '<') {
          state = STATE.TAG_OPEN;
          tagName = '';
          isClose = false;
          attrs = {};
        } else if (ch === '&' && skipDepth === 0) {
          inEntity = true;
          entity = '';
        } else if (skipDepth === 0) {
          out += ch;
        }
        break;
      }

      case STATE.TAG_OPEN: {
        if (ch === '/') {
          isClose = true;
          state = STATE.CLOSE_TAG_NAME;
        } else if (ch === '!' || ch === '?') {
          const end = html.indexOf('>', i);
          i = end === -1 ? html.length - 1 : end;
          state = STATE.TEXT;
        } else {
          tagName += ch;
          state = STATE.TAG_NAME;
        }
        break;
      }

      case STATE.TAG_NAME: {
        if (isWhitespace(ch)) {
          state = STATE.BEFORE_ATTR_NAME;
        } else if (ch === '/') {
          state = STATE.SELF_CLOSING;
        } else if (ch === '>') {
          flushTag();
          state = STATE.TEXT;
        } else {
          tagName += ch;
        }
        break;
      }

      case STATE.CLOSE_TAG_NAME: {
        if (ch === '>') {
          flushTag();
          if (tagName.toLowerCase() === 'a' && skipDepth === 0) {
            out = resolveLink(out);
          }
          state = STATE.TEXT;
        } else if (ch !== ' ') {
          tagName += ch;
        }
        break;
      }

      case STATE.BEFORE_ATTR_NAME: {
        if (ch === '>') {
          commitAttr();
          flushTag();
          state = STATE.TEXT;
        } else if (ch === '/') {
          commitAttr();
          state = STATE.SELF_CLOSING;
        } else if (!isWhitespace(ch)) {
          commitAttr();
          attrName = ch;
          state = STATE.ATTR_NAME;
        }
        break;
      }

      case STATE.ATTR_NAME: {
        if (ch === '=') {
          state = STATE.BEFORE_ATTR_VALUE;
        } else if (isWhitespace(ch)) {
          state = STATE.AFTER_ATTR_NAME;
        } else if (ch === '>') {
          commitAttr();
          flushTag();
          state = STATE.TEXT;
        } else if (ch === '/') {
          commitAttr();
          state = STATE.SELF_CLOSING;
        } else {
          attrName += ch;
        }
        break;
      }

      case STATE.AFTER_ATTR_NAME: {
        if (ch === '=') {
          state = STATE.BEFORE_ATTR_VALUE;
        } else if (ch === '>') {
          commitAttr();
          flushTag();
          state = STATE.TEXT;
        } else if (ch === '/') {
          commitAttr();
          state = STATE.SELF_CLOSING;
        } else if (!isWhitespace(ch)) {
          commitAttr();
          attrName = ch;
          state = STATE.ATTR_NAME;
        }
        break;
      }

      case STATE.BEFORE_ATTR_VALUE: {
        if (ch === '"') {
          state = STATE.ATTR_VALUE_DOUBLE_QUOTED;
        } else if (ch === "'") {
          state = STATE.ATTR_VALUE_SINGLE_QUOTED;
        } else if (!isWhitespace(ch)) {
          attrValue = ch;
          state = STATE.ATTR_VALUE_UNQUOTED;
        }
        break;
      }

      case STATE.ATTR_VALUE_DOUBLE_QUOTED: {
        if (ch === '"') {
          commitAttr();
          state = STATE.BEFORE_ATTR_NAME;
        } else {
          attrValue += ch;
        }
        break;
      }

      case STATE.ATTR_VALUE_SINGLE_QUOTED: {
        if (ch === "'") {
          commitAttr();
          state = STATE.BEFORE_ATTR_NAME;
        } else {
          attrValue += ch;
        }
        break;
      }

      case STATE.ATTR_VALUE_UNQUOTED: {
        if (isWhitespace(ch)) {
          commitAttr();
          state = STATE.BEFORE_ATTR_NAME;
        } else if (ch === '>') {
          commitAttr();
          flushTag();
          state = STATE.TEXT;
        } else {
          attrValue += ch;
        }
        break;
      }

      case STATE.SELF_CLOSING: {
        if (ch === '>') {
          flushTag();
          state = STATE.TEXT;
        }
        break;
      }
    }
  }

  const markerPattern = new RegExp(
    `${LINK_START}[^${LINK_END}]*${LINK_END}`,
    'g'
  );
  out = out.replace(markerPattern, '');

  out = out.replace(/[^\S\n]+/g, ' ');
  out = out.replace(/\n[^\S\n]*/g, '\n');
  out = out.replace(/\n{3,}/g, '\n\n');

  return out.trim();
}
