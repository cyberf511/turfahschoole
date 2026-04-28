'use client';

import { useState, useEffect } from 'react';
import type { SiteContent } from '@/actions/content';

interface Props {
  heroImages: SiteContent[];
}

export function LandingClient({ heroImages }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  if (heroImages.length === 0) return null;

  return (
    <>
      {heroImages.map((img, i) => (
        <div
          key={img.id}
          className={`landing-hero__slide ${i === currentIndex ? 'landing-hero__slide--active' : ''}`}
          style={{ backgroundImage: `url(${img.image_url})` }}
        />
      ))}
      {heroImages.length > 1 && (
        <div className="landing-hero__dots">
          {heroImages.map((_, i) => (
            <button
              key={i}
              className={`landing-hero__dot ${i === currentIndex ? 'landing-hero__dot--active' : ''}`}
              onClick={() => setCurrentIndex(i)}
              aria-label={`صورة ${i + 1}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
