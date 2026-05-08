"use client";

import Image from "next/image";

const SLIDES = [
  { src: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=250&fit=crop", alt: "企業VP", tag: "Corporate" },
  { src: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop", alt: "YouTube動画", tag: "YouTube" },
  { src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=250&fit=crop", alt: "広告・CM", tag: "Commercial" },
  { src: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=250&fit=crop", alt: "ウェディング", tag: "Wedding" },
  { src: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=250&fit=crop", alt: "SNS動画", tag: "Social" },
  { src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=250&fit=crop", alt: "ドキュメンタリー", tag: "Doc" },
  { src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=250&fit=crop", alt: "ミュージックビデオ", tag: "MV" },
  { src: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=400&h=250&fit=crop", alt: "イベント撮影", tag: "Event" },
];

export function InfiniteSlider() {
  const allSlides = [...SLIDES, ...SLIDES];

  return (
    <section className="relative border-y border-ink/15 bg-paper-deep py-14">
      {/* Edge labels */}
      <div className="mx-auto mb-8 flex max-w-container items-baseline justify-between px-6 lg:px-[6.25rem]">
        <span className="eyebrow">— Showreel</span>
        <span className="font-display text-xs uppercase tracking-[0.3em] text-ink-muted">
          {SLIDES.length.toString().padStart(2, "0")} works in motion
        </span>
      </div>

      <div className="group/slider relative overflow-hidden">
        {/* Edge fades to bg color */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-paper-deep to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-paper-deep to-transparent" />

        <div className="flex animate-scroll gap-6 group-hover/slider:[animation-play-state:paused]">
          {allSlides.map((slide, i) => (
            <figure
              key={`${slide.alt}-${i}`}
              className="group/card relative h-[200px] w-[320px] shrink-0 cursor-pointer overflow-hidden border border-ink/0 transition-all duration-300 hover:border-ink sm:h-[220px] sm:w-[360px]"
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-cover grayscale transition-all duration-700 group-hover/card:grayscale-0"
                sizes="360px"
              />
              {/* Top tag */}
              <figcaption className="absolute left-3 top-3 z-10 flex items-center gap-2">
                <span className="bg-ink px-2 py-1 font-display text-[10px] uppercase tracking-[0.2em] text-paper">
                  {slide.tag}
                </span>
              </figcaption>
              {/* Bottom title */}
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent px-4 pb-4 pt-12">
                <p className="font-display text-base font-medium tracking-tight text-paper">
                  {slide.alt}
                </p>
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 z-0 bg-primary-500/0 transition-colors duration-300 group-hover/card:bg-primary-500/10" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
