// Text that the standard PDF fonts can draw (pure). They cover Western European letters
// (Irish fadas are fine). Other letters become their nearest plain letter (ż → z, Ł → L) so a
// name never breaks the file. For full Unicode (e.g. Cyrillic), embed a font with @pdf-lib/fontkit.
const WIN_ANSI = /[ -~ -ÿ–—‘’“”•€]/;
const EXTRA: Record<string, string> = { Ł: 'L', ł: 'l', Đ: 'D', đ: 'd', Ħ: 'H', ħ: 'h', ı: 'i', Œ: 'OE', œ: 'oe', ẞ: 'SS' };

export function pdfSafeText(s: string): string {
  return Array.from(s.normalize('NFC'), (ch) => {
    if (WIN_ANSI.test(ch)) return ch;
    if (EXTRA[ch]) return EXTRA[ch];
    const plain = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return plain && Array.from(plain).every((c) => WIN_ANSI.test(c)) ? plain : '?';
  }).join('');
}
