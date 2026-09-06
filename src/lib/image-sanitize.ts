/**
 * PORT-015: 画像アップロード時の EXIF / メタデータ除去。
 *
 * 目的: GPS 位置情報 (EXIF GPS IFD) や 撮影機材の 個人特定情報 が 公開画像に
 * 埋め込まれたまま流出することを防ぐ。sharp / exifr 系ライブラリを 使わず
 * pure JS でセグメント/チャンクレベルの 除去 を行うことで:
 *   - Vercel Function bundle サイズを 増やさない
 *   - native binary 依存 (sharp) が 必要な エッジ環境でも動く
 *   - 動作範囲が 「バイナリを受け取ってメタデータだけ削って返す」に閉じるので、
 *     ピクセルデコード ミスによる 破壊事故が起きない
 *
 * 対応フォーマット:
 *   JPEG : APP0/APP1/APP2〜APPF (EXIF, XMP, Photoshop 等) + COM をスキップ、
 *          SOI + SOS/画像本体 + EOI を再結合
 *   PNG  : eXIf / iTXt / tEXt / zTXt チャンクをスキップ、他は全て保持
 *   WebP : RIFF コンテナから EXIF / XMP チャンクをスキップ
 *   GIF  : メタデータ標準がなく (Application Extension は動画/コメント用途で
 *          通常 個人特定情報を持たないため) そのまま返す
 *
 * 全て 単一パス Uint8Array 処理、O(n) 時間 / O(n) メモリ (in-place 縮小)。
 */

import type { AllowedImageKind } from "./upload-validation";

/**
 * JPEG から APP0/APP1/APP2〜APPF (EXIF/XMP/ICC/Photoshop 等) と COM を除去。
 *
 * JPEG は SOI (FFD8) から始まり、複数のセグメントが続き、最後に SOS (FFDA) 以降
 * 画像本体 + EOI (FFD9) で終わる。各セグメント は:
 *   FF xx LL LL  (LL LL は Big-Endian 16bit、自身の 2byte 含む長さ)
 * ただし RSTn (FFD0-FFD7) と TEM (FF01) は 長さ フィールドなし。
 *
 * SOS 以降は 画像本体 (エントロピー符号化 データ) で、途中に FF がありうるが
 * FF00 は 「0 バイトの stuff」、FFDx は restart marker として扱う。ここは
 * バイト列を そのまま コピー。
 */
function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    // 不正 JPEG は そのまま返す (magic 検証は 呼出元で通過済み前提)
    return bytes;
  }

  const out: number[] = [0xff, 0xd8]; // SOI
  let i = 2;
  const n = bytes.length;

  while (i < n) {
    // マーカー先頭は 0xFF、fill バイト 0xFF が続くことがあるので skip
    if (bytes[i] !== 0xff) {
      // 不正 stream。残りをそのままコピーして終了
      for (; i < n; i++) out.push(bytes[i]);
      break;
    }
    // 連続する 0xFF fill を消費、最後の 1 個をマーカー先頭とみなす
    let j = i;
    while (j < n && bytes[j] === 0xff) j++;
    if (j >= n) break;
    const marker = bytes[j];
    i = j + 1; // marker の次バイト位置

    // 長さフィールドを持たない マーカー (SOI, EOI, RSTn, TEM)
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) {
      out.push(0xff, marker);
      if (marker === 0xd9) break; // EOI で終了
      continue;
    }
    if (marker >= 0xd0 && marker <= 0xd7) {
      // RSTn — 長さなし
      out.push(0xff, marker);
      continue;
    }

    // 長さフィールド (Big-Endian, 自身を含む)
    if (i + 1 >= n) break;
    const segLen = (bytes[i] << 8) | bytes[i + 1];
    if (segLen < 2 || i + segLen > n) {
      // 不正長 — 残りをそのままコピーして終了
      out.push(0xff, marker, bytes[i], bytes[i + 1]);
      i += 2;
      for (; i < n; i++) out.push(bytes[i]);
      break;
    }

    // メタデータ系マーカーは丸ごと skip
    //   APP0-APPF : 0xE0-0xEF (EXIF は APP1, XMP は APP1, ICC は APP2, IPTC 等 APP13)
    //   COM       : 0xFE
    if ((marker >= 0xe0 && marker <= 0xef) || marker === 0xfe) {
      i += segLen; // marker と長さ含めて丸ごとスキップ
      continue;
    }

    // それ以外 (DQT, DHT, SOF, SOS, DRI 等) はコピー
    out.push(0xff, marker);
    for (let k = 0; k < segLen; k++) out.push(bytes[i + k]);
    i += segLen;

    // SOS の場合、以降は画像本体 → EOI までそのままコピー
    if (marker === 0xda) {
      while (i < n) {
        out.push(bytes[i]);
        if (
          bytes[i] === 0xff &&
          i + 1 < n &&
          bytes[i + 1] === 0xd9 // EOI
        ) {
          out.push(bytes[i + 1]);
          i += 2;
          break;
        }
        i++;
      }
      break;
    }
  }

  return new Uint8Array(out);
}

/**
 * PNG から eXIf / iTXt / tEXt / zTXt チャンクを除去。
 *
 * PNG は 8byte シグネチャ (89 50 4E 47 0D 0A 1A 0A) + 複数チャンク で構成:
 *   [length:4] [type:4] [data:length] [crc:4]
 * length は Big-Endian、type は 4byte ASCII (大文字/小文字で 重要度/private 判別)。
 */
function stripPngMetadata(bytes: Uint8Array): Uint8Array {
  const SIG_LEN = 8;
  if (bytes.length < SIG_LEN) return bytes;

  const out: number[] = [];
  for (let i = 0; i < SIG_LEN; i++) out.push(bytes[i]);
  let i = SIG_LEN;
  const n = bytes.length;

  const SKIP = new Set(["eXIf", "iTXt", "tEXt", "zTXt"]);

  while (i + 8 <= n) {
    const length =
      (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3];
    const type =
      String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
    const chunkTotal = 4 + 4 + length + 4; // length + type + data + crc
    if (i + chunkTotal > n) break;

    if (!SKIP.has(type)) {
      for (let k = 0; k < chunkTotal; k++) out.push(bytes[i + k]);
    }
    i += chunkTotal;
    if (type === "IEND") break;
  }

  return new Uint8Array(out);
}

/**
 * WebP から EXIF / XMP チャンクを除去。
 *
 * WebP は RIFF コンテナ:
 *   "RIFF" [size:4LE] "WEBP" [chunks...]
 * 各チャンク: [fourcc:4] [size:4LE] [data:size] [pad:0 or 1]
 *   size が odd の場合 パディング 1 byte あり。
 */
function stripWebpMetadata(bytes: Uint8Array): Uint8Array {
  if (
    bytes.length < 12 ||
    bytes[0] !== 0x52 || // R
    bytes[1] !== 0x49 || // I
    bytes[2] !== 0x46 || // F
    bytes[3] !== 0x46 || // F
    bytes[8] !== 0x57 || // W
    bytes[9] !== 0x45 || // E
    bytes[10] !== 0x42 || // B
    bytes[11] !== 0x50 // P
  ) {
    return bytes;
  }

  const chunks: number[] = [];
  let i = 12;
  const n = bytes.length;

  const SKIP = new Set(["EXIF", "XMP "]);

  while (i + 8 <= n) {
    const fourcc = String.fromCharCode(
      bytes[i],
      bytes[i + 1],
      bytes[i + 2],
      bytes[i + 3]
    );
    const size =
      bytes[i + 4] |
      (bytes[i + 5] << 8) |
      (bytes[i + 6] << 16) |
      (bytes[i + 7] << 24);
    const pad = size & 1;
    const chunkTotal = 8 + size + pad;
    if (i + chunkTotal > n) break;

    if (!SKIP.has(fourcc)) {
      for (let k = 0; k < chunkTotal; k++) chunks.push(bytes[i + k]);
    }
    i += chunkTotal;
  }

  // 新しい RIFF size を再計算 (WEBP + chunks の byte 数)
  const newRiffSize = 4 + chunks.length; // "WEBP" + payload
  const header: number[] = [
    0x52, 0x49, 0x46, 0x46,
    newRiffSize & 0xff,
    (newRiffSize >> 8) & 0xff,
    (newRiffSize >> 16) & 0xff,
    (newRiffSize >> 24) & 0xff,
    0x57, 0x45, 0x42, 0x50,
  ];
  return new Uint8Array([...header, ...chunks]);
}

/**
 * 種別に応じて メタデータを 除去。失敗時 (parse エラー等) は 保守的に
 * 元の bytes を そのまま返す (upload そのものは失敗させない)。
 * caller は 除去後の bytes を Storage に upload する。
 */
export function stripImageMetadata(
  bytes: Uint8Array,
  kind: AllowedImageKind
): Uint8Array {
  try {
    switch (kind) {
      case "jpeg":
        return stripJpegMetadata(bytes);
      case "png":
        return stripPngMetadata(bytes);
      case "webp":
        return stripWebpMetadata(bytes);
      case "gif":
        // GIF はメタデータ 標準を持たない (Application Extension は主に
        // ループ制御用で 個人特定情報を持たないため そのまま返す)
        return bytes;
      default:
        return bytes;
    }
  } catch {
    return bytes;
  }
}
