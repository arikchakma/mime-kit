const SKIP_TAGS = new Set(['style', 'script', 'head']);
const BLOCK_TAGS = new Set([
  'p',
  'div',
  'br',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'tr',
  'blockquote',
  'hr',
  'pre',
  'table',
]);

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

const enum State {
  Text,
  TagOpen,
  TagName,
  BeforeAttrName,
  AttrName,
  AfterAttrName,
  BeforeAttrValue,
  AttrValueDoubleQuoted,
  AttrValueSingleQuoted,
  AttrValueUnquoted,
  SelfClosing,
  CloseTagName,
}

function decodeEntity(entity: string): string {
  if (entity.startsWith('#x') || entity.startsWith('#X')) {
    return String.fromCharCode(Number.parseInt(entity.slice(2), 16));
  }
  if (entity.startsWith('#')) {
    return String.fromCharCode(Number(entity.slice(1)));
  }
  return ENTITIES[entity] ?? `&${entity};`;
}

export function textFromHtml(html: string): string {
  let out = '';
  let state: State = State.Text;
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
      // Store href — we'll append it when we see </a>
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

    if (inEntity && state === State.Text) {
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
      // Not a valid entity — flush as text
      out += '&' + entity;
      entity = '';
      inEntity = false;
      // Fall through to process current char
    }

    switch (state) {
      case State.Text:
        if (ch === '<') {
          state = State.TagOpen;
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

      case State.TagOpen:
        if (ch === '/') {
          isClose = true;
          state = State.CloseTagName;
        } else if (ch === '!' || ch === '?') {
          // Comment or doctype — skip to >
          const end = html.indexOf('>', i);
          i = end === -1 ? html.length - 1 : end;
          state = State.Text;
        } else {
          tagName += ch;
          state = State.TagName;
        }
        break;

      case State.TagName:
        if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
          state = State.BeforeAttrName;
        } else if (ch === '/') {
          state = State.SelfClosing;
        } else if (ch === '>') {
          flushTag();
          state = State.Text;
        } else {
          tagName += ch;
        }
        break;

      case State.CloseTagName:
        if (ch === '>') {
          flushTag();
          // Handle </a> — extract link text and href
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
          state = State.Text;
        } else if (ch !== ' ') {
          tagName += ch;
        }
        break;

      case State.BeforeAttrName:
        if (ch === '>') {
          commitAttr();
          flushTag();
          state = State.Text;
        } else if (ch === '/') {
          commitAttr();
          state = State.SelfClosing;
        } else if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r') {
          commitAttr();
          attrName = ch;
          state = State.AttrName;
        }
        break;

      case State.AttrName:
        if (ch === '=') {
          state = State.BeforeAttrValue;
        } else if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
          state = State.AfterAttrName;
        } else if (ch === '>' || ch === '/') {
          commitAttr();
          if (ch === '>') {
            flushTag();
            state = State.Text;
          } else {
            state = State.SelfClosing;
          }
        } else {
          attrName += ch;
        }
        break;

      case State.AfterAttrName:
        if (ch === '=') {
          state = State.BeforeAttrValue;
        } else if (ch === '>') {
          commitAttr();
          flushTag();
          state = State.Text;
        } else if (ch === '/') {
          commitAttr();
          state = State.SelfClosing;
        } else if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r') {
          commitAttr();
          attrName = ch;
          state = State.AttrName;
        }
        break;

      case State.BeforeAttrValue:
        if (ch === '"') {
          state = State.AttrValueDoubleQuoted;
        } else if (ch === "'") {
          state = State.AttrValueSingleQuoted;
        } else if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r') {
          attrValue = ch;
          state = State.AttrValueUnquoted;
        }
        break;

      case State.AttrValueDoubleQuoted:
        if (ch === '"') {
          commitAttr();
          state = State.BeforeAttrName;
        } else {
          attrValue += ch;
        }
        break;

      case State.AttrValueSingleQuoted:
        if (ch === "'") {
          commitAttr();
          state = State.BeforeAttrName;
        } else {
          attrValue += ch;
        }
        break;

      case State.AttrValueUnquoted:
        if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
          commitAttr();
          state = State.BeforeAttrName;
        } else if (ch === '>') {
          commitAttr();
          flushTag();
          state = State.Text;
        } else {
          attrValue += ch;
        }
        break;

      case State.SelfClosing:
        if (ch === '>') {
          flushTag();
          state = State.Text;
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
