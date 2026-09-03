"use client";

import { usePathname } from "next/navigation";

/**
 * (main) 配下の <main> ラッパー。
 *
 * - 通常ページ: Header (fixed h-20) の裏に内容が潜らないよう pt-20。
 * - Hero 動画ページ (/, /portfolios): Hero が viewport 最上部から動画でフル
 *   ブリードする構造なので pt-0。ヘッダーも同じ 2 ページで透過モードになる
 *   (src/components/layout/header.tsx の isHeroPage 判定と揃える)。
 *
 * Server Component の layout.tsx からだと usePathname が使えないので、
 * 小さな Client Wrapper として切り出している。
 */
export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isHeroPage = pathname === "/" || pathname === "/portfolios";
  return <main className={`flex-1 ${isHeroPage ? "pt-0" : "pt-20"}`}>{children}</main>;
}
