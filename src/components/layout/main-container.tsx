"use client";

import { usePathname } from "next/navigation";

/**
 * (main) 配下の <main> ラッパー。
 *
 * - 通常ページ: Header (fixed h-20) の裏に内容が潜らないよう pt-20。
 * - home (`/`): Hero が viewport 最上部から動画でフルブリードする構造のため pt-0。
 *
 * Server Component の layout.tsx からだと usePathname が使えないので、
 * 小さな Client Wrapper として切り出している。
 */
export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isHome = pathname === "/";
  return <main className={`flex-1 ${isHome ? "pt-0" : "pt-20"}`}>{children}</main>;
}
