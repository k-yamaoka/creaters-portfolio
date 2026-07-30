import { describe, expect, it } from "vitest";
import {
  detectDocKindByMagic,
  detectImageKindByMagic,
  detectVideoKindByMagic,
  getDocKindFromExt,
  getImageKindFromExt,
  getVideoKindFromExt,
} from "@/lib/upload-validation";

function bytes(...b: number[]): Uint8Array {
  return new Uint8Array(b);
}

describe("upload-validation: 拡張子判定", () => {
  it("画像 拡張子 ホワイトリスト", () => {
    expect(getImageKindFromExt("photo.jpg")).toBe("jpeg");
    expect(getImageKindFromExt("photo.JPEG")).toBe("jpeg");
    expect(getImageKindFromExt("logo.PNG")).toBe("png");
    expect(getImageKindFromExt("anim.gif")).toBe("gif");
    expect(getImageKindFromExt("hero.webp")).toBe("webp");
  });

  it("画像 拡張子 拒否 (bmp, tif, exe, 拡張子なし)", () => {
    expect(getImageKindFromExt("virus.exe")).toBeNull();
    expect(getImageKindFromExt("scan.bmp")).toBeNull();
    expect(getImageKindFromExt("legacy.tif")).toBeNull();
    expect(getImageKindFromExt("noext")).toBeNull();
  });

  it("動画 拡張子 ホワイトリスト", () => {
    expect(getVideoKindFromExt("clip.mp4")).toBe("mp4");
    expect(getVideoKindFromExt("clip.MOV")).toBe("mov");
    expect(getVideoKindFromExt("clip.webm")).toBe("webm");
  });

  it("動画 拡張子 拒否 (avi, mkv, flv)", () => {
    expect(getVideoKindFromExt("clip.avi")).toBeNull();
    expect(getVideoKindFromExt("clip.mkv")).toBeNull();
    expect(getVideoKindFromExt("clip.flv")).toBeNull();
  });

  it("PDF 拡張子", () => {
    expect(getDocKindFromExt("doc.pdf")).toBe("pdf");
    expect(getDocKindFromExt("doc.PDF")).toBe("pdf");
    expect(getDocKindFromExt("doc.docx")).toBeNull();
  });
});

describe("upload-validation: マジックナンバー画像", () => {
  it("JPEG (FF D8 FF)", () => {
    const b = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(detectImageKindByMagic(b)).toBe("jpeg");
  });

  it("PNG (89 50 4E 47)", () => {
    const b = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0);
    expect(detectImageKindByMagic(b)).toBe("png");
  });

  it("GIF87a / GIF89a", () => {
    const b1 = bytes(0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0, 0, 0, 0, 0, 0);
    const b2 = bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0);
    expect(detectImageKindByMagic(b1)).toBe("gif");
    expect(detectImageKindByMagic(b2)).toBe("gif");
  });

  it("WebP (RIFF ... WEBP)", () => {
    const b = bytes(
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50
    );
    expect(detectImageKindByMagic(b)).toBe("webp");
  });

  it("拡張子 jpg で 中身 PDF は 画像判定失敗", () => {
    const pdfBytes = bytes(0x25, 0x50, 0x44, 0x46, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(detectImageKindByMagic(pdfBytes)).toBeNull();
  });

  it("拡張子 png で 中身 EXE (MZ) は 画像判定失敗", () => {
    const exeBytes = bytes(0x4d, 0x5a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(detectImageKindByMagic(exeBytes)).toBeNull();
  });

  it("バイト長不足でも null (12 未満)", () => {
    expect(detectImageKindByMagic(bytes(0xff, 0xd8))).toBeNull();
  });
});

describe("upload-validation: マジックナンバー動画", () => {
  it("MP4 (bytes 4..8 = 'ftyp')", () => {
    const b = bytes(0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d);
    expect(detectVideoKindByMagic(b)).toBe("mp4");
  });

  it("MOV (ftyp + qt)", () => {
    const b = bytes(0, 0, 0, 0x14, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20);
    expect(detectVideoKindByMagic(b)).toBe("mov");
  });

  it("WebM (1A 45 DF A3)", () => {
    const b = bytes(0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(detectVideoKindByMagic(b)).toBe("webm");
  });

  it("拡張子 mp4 で 中身 テキスト は 動画判定失敗", () => {
    const txtBytes = bytes(0x48, 0x65, 0x6c, 0x6c, 0x6f, 0, 0, 0, 0, 0, 0, 0);
    expect(detectVideoKindByMagic(txtBytes)).toBeNull();
  });

  it("バイト長不足でも null", () => {
    expect(detectVideoKindByMagic(bytes(0, 0, 0))).toBeNull();
  });
});

describe("upload-validation: PDF マジックナンバー", () => {
  it("PDF (%PDF)", () => {
    expect(detectDocKindByMagic(bytes(0x25, 0x50, 0x44, 0x46))).toBe("pdf");
  });

  it("PDF 偽装 (docx zip ヘッダー 50 4B 03 04)", () => {
    expect(detectDocKindByMagic(bytes(0x50, 0x4b, 0x03, 0x04))).toBeNull();
  });

  it("空配列で null", () => {
    expect(detectDocKindByMagic(bytes())).toBeNull();
  });
});
