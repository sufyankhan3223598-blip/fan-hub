"""Downscales/re-encodes textures embedded in GLB files (keeps geometry & animations intact)."""
import io, json, struct, sys
from PIL import Image

def shrink(src, dst, max_size=1024, quality=82):
    data = open(src, 'rb').read()
    magic, ver, length = struct.unpack_from('<III', data, 0)
    off = 12; chunks = []
    while off < length:
        clen, ctype = struct.unpack_from('<II', data, off)
        chunks.append((ctype, data[off + 8: off + 8 + clen])); off += 8 + clen
    gltf = json.loads(chunks[0][1]); binc = chunks[1][1] if len(chunks) > 1 else b''
    views = gltf.get('bufferViews', [])
    replaced = {}
    for img in gltf.get('images', []):
        if 'bufferView' not in img: continue
        bv = views[img['bufferView']]
        raw = binc[bv.get('byteOffset', 0): bv.get('byteOffset', 0) + bv['byteLength']]
        im = Image.open(io.BytesIO(raw)); im.load()
        has_alpha = im.mode in ('RGBA', 'LA') and im.getextrema()[-1][0] < 255
        if max(im.size) > max_size:
            im.thumbnail((max_size, max_size), Image.LANCZOS)
        out = io.BytesIO()
        if has_alpha:
            im.save(out, 'PNG', optimize=True); img['mimeType'] = 'image/png'
        else:
            im.convert('RGB').save(out, 'JPEG', quality=quality, optimize=True); img['mimeType'] = 'image/jpeg'
        replaced[img['bufferView']] = out.getvalue()
    newbin = bytearray()
    for i, bv in enumerate(views):
        blob = replaced.get(i) or binc[bv.get('byteOffset', 0): bv.get('byteOffset', 0) + bv['byteLength']]
        while len(newbin) % 4: newbin.append(0)
        bv['byteOffset'] = len(newbin); bv['byteLength'] = len(blob); newbin += blob
    while len(newbin) % 4: newbin.append(0)
    gltf['buffers'][0]['byteLength'] = len(newbin)
    js = json.dumps(gltf, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    total = 12 + 8 + len(js) + 8 + len(newbin)
    with open(dst, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(newbin), 0x004E4942)); f.write(newbin)

if __name__ == '__main__':
    shrink(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 1024)
