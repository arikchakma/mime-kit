export function textFromHtml(html: string): string {
  let text = html;

  // Remove style and script blocks
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Convert links: <a href="URL">text</a> → text (URL)
  text = text.replace(
    /<a\s[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, url: string, label: string) => {
      const clean = label.replace(/<[^>]*>/g, '').trim();
      return clean && clean !== url ? `${clean} (${url})` : url;
    }
  );

  // Block-level breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(?:p|div|h[1-6]|li|tr|blockquote)>/gi, '\n');

  // Strip remaining tags
  text = text.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&#(\d+);/g, (_, code: string) =>
    String.fromCharCode(Number(code))
  );
  text = text.replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16))
  );

  // Collapse whitespace within lines, preserve newlines
  text = text.replace(/[^\S\n]+/g, ' ');
  text = text.replace(/\n\s*/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}
