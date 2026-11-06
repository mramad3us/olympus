// OLYMPUS tests: a PNG reader for the browser tests' screenshots (8-bit RGB or RGBA, not interlaced: what headless Chrome writes).
//
// A test that must read the picture the player sees (the splash's ink beyond its iris) takes a screenshot
// and reads its pixels here: the chunks' IDAT joined and inflated (node's zlib), each row unfiltered
// (None, Sub, Up, Average, Paeth), RGB widened to RGBA. PNG.read(buffer) → { w, h, data: Uint8Array RGBA }.
// Not a module of the game: node only, nothing in src imports it.
import zlib from 'node:zlib';

const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };

export const PNG = {
  read(buf) {
    let o = 8, w = 0, h = 0, depth = 0, type = 0;
    const idat = [];
    while (o < buf.length) {
      const len = buf.readUInt32BE(o), kind = buf.toString('ascii', o + 4, o + 8), body = buf.subarray(o + 8, o + 8 + len);
      if (kind === 'IHDR') { w = body.readUInt32BE(0); h = body.readUInt32BE(4); depth = body[8]; type = body[9]; if (body[12]) throw new Error('png-read: interlaced'); }
      else if (kind === 'IDAT') idat.push(body);
      else if (kind === 'IEND') break;
      o += 12 + len;
    }
    if (depth !== 8 || (type !== 2 && type !== 6)) throw new Error(`png-read: depth ${depth}, type ${type}`);
    const bpp = type === 6 ? 4 : 3, stride = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat)), px = new Uint8Array(stride * h), data = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
      const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = y * stride;
      for (let i = 0; i < stride; i++) {
        const a = i >= bpp ? px[row + i - bpp] : 0, b = y ? px[row - stride + i] : 0, c = i >= bpp && y ? px[row - stride + i - bpp] : 0;
        px[row + i] = (src[i] + (f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? paeth(a, b, c) : 0)) & 255;
      }
    }
    for (let i = 0; i < w * h; i++) { data[i * 4] = px[i * bpp]; data[i * 4 + 1] = px[i * bpp + 1]; data[i * 4 + 2] = px[i * bpp + 2]; data[i * 4 + 3] = bpp === 4 ? px[i * bpp + 3] : 255; }
    return { w, h, data };
  },
};
