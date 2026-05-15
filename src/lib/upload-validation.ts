/**
 * アップロードファイルの拡張子 + Content-Type + マジックナンバー検証
 *
 * - 拡張子はホワイトリスト
 * - Content-Type はクライアント制御可能なので最小チェックのみ
 * - 先頭バイトのマジックナンバーで実体を確認する (一番改ざんに強い)
 */

export type AllowedImageKind = "jpeg" | "png" | "gif" | "webp";
export type AllowedVideoKind = "mp4" | "mov" | "webm";

const IMAGE_EXT: Record<string, AllowedImageKind> = {
  jpg: "jpeg",
  jpeg: "jpeg",
  png: "png",
  gif: "gif",
  webp: "webp",
};

const VIDEO_EXT: Record<string, AllowedVideoKind> = {
  mp4: "mp4",
  mov: "mov",
  webm: "webm",
};

/** 拡張子をホワイトリストから引いて種別を返す。許可外なら null */
export function getImageKindFromExt(name: string): AllowedImageKind | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXT[ext] ?? null;
}
export function getVideoKindFromExt(name: string): AllowedVideoKind | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXT[ext] ?? null;
}

/**
 * 先頭バイトのマジックナンバー判定。
 * 信頼できる方法でクライアント差し替え検知 (jpg を装った exe など) ができる。
 */
export function detectImageKindByMagic(
  bytes: Uint8Array
): AllowedImageKind | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  // GIF: 47 49 46 38 (37|39) 61 ("GIF87a" / "GIF89a")
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "gif";
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return "webp";
  }
  return null;
}

export function detectVideoKindByMagic(
  bytes: Uint8Array
): AllowedVideoKind | null {
  if (bytes.length < 12) return null;
  // MP4 / MOV: bytes 4..8 == "ftyp"
  if (
    bytes[4] === 0x66 && // f
    bytes[5] === 0x74 && // t
    bytes[6] === 0x79 && // y
    bytes[7] === 0x70 // p
  ) {
    // 多くの mp4 / mov は ftyp box の major brand で差別化されるが、
    // 本サイトでは両者ともポートフォリオ用途として許容する。
    // bytes 8..12 が "qt  " なら mov、それ以外は mp4 と分類。
    if (
      bytes[8] === 0x71 &&
      bytes[9] === 0x74 &&
      bytes[10] === 0x20 &&
      bytes[11] === 0x20
    ) {
      return "mov";
    }
    return "mp4";
  }
  // WebM: 1A 45 DF A3 (EBML header)
  if (
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return "webm";
  }
  return null;
}
