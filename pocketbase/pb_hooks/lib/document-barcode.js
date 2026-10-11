// Code 128 symbol widths (ISO/IEC 15417), cross-checked with ZXing Code128Reader:
// https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/oned/Code128Reader.java
const patterns = ['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112']
const encode = (value) => {
  if (!/^[\x20-\x7e]{1,100}$/.test(value)) throw new BadRequestError('Le code-barres doit contenir 1 à 100 caractères ASCII imprimables (sans accent).')
  // Numeric codes use set C to keep the bars wide enough on small labels.
  const numeric = /^\d+$/.test(value) && value.length % 2 === 0
  const codes = numeric ? [105, ...value.match(/../g).map(Number)] : [104, ...value.split('').map((char) => char.charCodeAt(0) - 32)]
  const checksum = codes.reduce((sum, code, index) => sum + code * (index || 1), 0) % 103
  codes.push(checksum, 106)
  return codes
}
const svg = (value, width, height) => {
  const codes = encode(value)
  let position = 10, bars = ''
  for (const code of codes) for (const [index, digit] of [...patterns[code]].entries()) {
    const size = Number(digit)
    if (index % 2 === 0) bars += `<rect x="${position}" y="0" width="${size}" height="100"/>`
    position += size
  }
  const modules = position + 10
  // Never silently squeeze an unscannable barcode into a tiny block.
  if (width / modules < 0.7 || height < 35) throw new BadRequestError('Agrandissez le bloc code-barres (largeur / hauteur) pour conserver une étiquette lisible.')
  const escape = (text) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
  return `<div class="document-barcode" style="background:#fff;color:#000;line-height:1;text-align:center;height:${height}px;white-space:nowrap"><svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escape(value)}" viewBox="0 0 ${modules} 100" preserveAspectRatio="none" style="display:block;width:100%;height:${height - 16}px;fill:#000;shape-rendering:crispEdges">${bars}</svg><span style="display:block;padding-top:3px;font:10px Inter,sans-serif;letter-spacing:1px">${escape(value)}</span></div>`
}
module.exports = { encode, svg }
