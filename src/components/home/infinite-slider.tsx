"use client";

import Image from "next/image";

const SLIDES = [
  { src: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=250&fit=crop", alt: "企業VP" },
  { src: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop", alt: "YouTube動画" },
  { src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=250&fit=crop", alt: "広告・CM" },
  { src: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=250&fit=crop", alt: "ウェディング" },
  { src: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=250&fit=crop", alt: "SNS動画" },
  { src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=250&fit=crop", alt: "ドキュメンタリー" },
  { src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=250&fit=crop", alt: "ミュージックビデオ" },
  { src: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=400&h=250&fit=crop", alt: "イベント撮影" },
];

export function InfiniteSlider() {
  // Duplicate slides for seamless loop
  const allSlides = [...SLIDES, ...SLIDES];

  return (
    <div className="relative overflow-hidden bg-[#F8F8F8] py-10">
      {/* Gradient masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#F8F8F8] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#F8F8F8] to-transparent" />

      <div className="flex animate-scroll gap-5">
        {allSlides.map((slide, i) => (
          <div
            key={`${slide.alt}-${i}`}
            className="relative h-[180px] w-[300px] shrink-0 overflow-hidden rounded-2xl shadow-card sm:h-[200px] sm:w-[340px]"
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover"
              sizes="340px"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
              <p className="text-sm font-bold text-white">{slide.alt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
