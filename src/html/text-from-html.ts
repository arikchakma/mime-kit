import { decodeEntity } from './entities.ts';
import { STATE } from './state.ts';
import type { State } from './state.ts';
import { BLOCK_TAGS, SKIP_TAGS } from './tags.ts';

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
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
        if (SKIP_TAGS.has(name)) skipDepth--;
        return;
      }
      if (BLOCK_TAGS.has(name)) out += '\n';
      return;
    }

    if (skipDepth > 0) {
      if (SKIP_TAGS.has(name)) skipDepth++;
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
      out += '\x01' + attrs['href'] + '\x02';
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
      case STATE.TEXT:
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

      case STATE.TAG_OPEN:
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

      case STATE.TAG_NAME:
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

      case STATE.CLOSE_TAG_NAME:
        if (ch === '>') {
          flushTag();
          if (tagName.toLowerCase() === 'a' && skipDepth === 0) {
            const startMarker = out.lastIndexOf('\x01');
            if (startMarker !== -1) {
              const endMarker = out.indexOf('\x02', startMarker);
              if (endMarker !== -1) {
                const href = out.slice(startMarker + 1, endMarker);
                const before = out.slice(0, startMarker);
                const linkText = out.slice(endMarker + 1).trim();
                if (linkText && linkText !== href) {
                  out = before + linkText + ' (' + href + ')';
                } else {
                  out = before + (linkText || href);
                }
              }
            }
          }
          state = STATE.TEXT;
        } else if (ch !== ' ') {
          tagName += ch;
        }
        break;

      case STATE.BEFORE_ATTR_NAME:
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

      case STATE.ATTR_NAME:
        if (ch === '=') {
          state = STATE.BEFORE_ATTR_VALUE;
        } else if (isWhitespace(ch)) {
          state = STATE.AFTER_ATTR_NAME;
        } else if (ch === '>' || ch === '/') {
          commitAttr();
          if (ch === '>') {
            flushTag();
            state = STATE.TEXT;
          } else {
            state = STATE.SELF_CLOSING;
          }
        } else {
          attrName += ch;
        }
        break;

      case STATE.AFTER_ATTR_NAME:
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

      case STATE.BEFORE_ATTR_VALUE:
        if (ch === '"') {
          state = STATE.ATTR_VALUE_DOUBLE_QUOTED;
        } else if (ch === "'") {
          state = STATE.ATTR_VALUE_SINGLE_QUOTED;
        } else if (!isWhitespace(ch)) {
          attrValue = ch;
          state = STATE.ATTR_VALUE_UNQUOTED;
        }
        break;

      case STATE.ATTR_VALUE_DOUBLE_QUOTED:
        if (ch === '"') {
          commitAttr();
          state = STATE.BEFORE_ATTR_NAME;
        } else {
          attrValue += ch;
        }
        break;

      case STATE.ATTR_VALUE_SINGLE_QUOTED:
        if (ch === "'") {
          commitAttr();
          state = STATE.BEFORE_ATTR_NAME;
        } else {
          attrValue += ch;
        }
        break;

      case STATE.ATTR_VALUE_UNQUOTED:
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

      case STATE.SELF_CLOSING:
        if (ch === '>') {
          flushTag();
          state = STATE.TEXT;
        }
        break;
    }
  }

  // Clean up markers from unclosed <a> tags
  out = out.replace(/\x01[^\x02]*\x02/g, '');

  // Collapse whitespace within lines, normalize newlines
  out = out.replace(/[^\S\n]+/g, ' ');
  out = out.replace(/\n[^\S\n]*/g, '\n');
  out = out.replace(/\n{3,}/g, '\n\n');

  return out.trim();
}
