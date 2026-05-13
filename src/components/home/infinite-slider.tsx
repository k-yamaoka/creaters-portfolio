"use client";

import Image from "next/image";
import { MiniFlower } from "@/components/ui/illustrations";

const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=250&fit=crop",
    alt: "企業VP",
    tag: "Corporate",
  },
  {
    src: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop",
    alt: "YouTube動画",
    tag: "YouTube",
  },
  {
    src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=250&fit=crop",
    alt: "広告・CM",
    tag: "Commercial",
  },
  {
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=250&fit=crop",
    alt: "ウェディング",
    tag: "Wedding",
  },
  {
    src: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=250&fit=crop",
    alt: "SNS動画",
    tag: "Social",
  },
  {
    src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=250&fit=crop",
    alt: "ドキュメンタリー",
    tag: "Doc",
  },
  {
    src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=250&fit=crop",
    alt: "ミュージックビデオ",
    tag: "MV",
  },
  {
    src: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=400&h=250&fit=crop",
    alt: "イベント撮影",
    tag: "Event",
  },
];

export function InfiniteSlider() {
  const allSlides = [...SLIDES, ...SLIDES];

  return (
    <section className="relative overflow-hidden bg-paper-deep py-16">
      {/* Edge labels */}
      <div className="mx-auto mb-8 flex max-w-container items-center justify-between px-6 lg:px-10">
        <span className="eyebrow">— SHOWREEL</span>
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-ink-muted">
          <span aria-hidden className="text-accent-500">
            <MiniFlower size={16} />
          </span>
          {SLIDES.length.toString().padStart(2, "0")} works in motion
        </span>
      </div>

      <div className="group/slider relative overflow-hidden">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-paper-deep to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-paper-deep to-transparent" />

        <div className="flex animate-scroll gap-5 group-hover/slider:[animation-play-state:paused]">
          {allSlides.map((slide, i) => (
            <figure
              key={`${slide.alt}-${i}`}
              className="group/card relative h-[220px] w-[320px] shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-ink/0 transition-all duration-300 hover:-translate-y-1 hover:border-ink sm:h-[240px] sm:w-[360px]"
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                sizes="360px"
              />
              {/* Top tag */}
              <figcaption className="absolute left-3 top-3 z-10 flex items-center gap-2">
                <span className="rounded-pill bg-accent-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-ink">
                  {slide.tag}
                </span>
              </figcaption>
              {/* Bottom title */}
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink/90 via-ink/50 to-transparent px-4 pb-4 pt-12">
                <p className="text-base font-black tracking-tight text-paper">
                  {slide.alt}
                </p>
              </div>
              {/* Hover tint */}
              <div className="absolute inset-0 z-0 bg-primary-500/0 transition-colors duration-300 group-hover/card:bg-primary-500/10" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
