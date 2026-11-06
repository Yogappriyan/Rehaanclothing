import React, { useState, useEffect, useRef } from 'react';
import { createBoutiqueSvgFallback, optimizeCdnUrl, CATEGORY_CDN_MIRRORS } from '../utils/imageStream';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
  category?: string;
  productName?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc,
  category,
  productName,
  alt = 'House Of Rehaan Garment',
  className = '',
  loading = 'lazy',
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(() => optimizeCdnUrl(src, 800));
  const [isLoaded, setIsLoaded] = useState(false);
  const failureStep = useRef(0);

  // Sync if src prop changes
  useEffect(() => {
    failureStep.current = 0;
    setIsLoaded(false);
    setCurrentSrc(optimizeCdnUrl(src, 800));
  }, [src]);

  const handleError = () => {
    failureStep.current += 1;

    // Step 1: Try fallbackSrc prop if provided
    if (failureStep.current === 1 && fallbackSrc && fallbackSrc !== currentSrc) {
      setCurrentSrc(optimizeCdnUrl(fallbackSrc, 800));
      return;
    }

    // Step 2: Try alternate CDN mirror for this category
    if (failureStep.current <= 2 && category && CATEGORY_CDN_MIRRORS[category]) {
      const mirrors = CATEGORY_CDN_MIRRORS[category];
      const nextMirror = mirrors.find((m) => m !== currentSrc);
      if (nextMirror) {
        setCurrentSrc(nextMirror);
        return;
      }
    }

    // Step 3: Try local public fashion assets
    if (failureStep.current <= 3 && currentSrc !== '/lookbook-banner.jpg' && currentSrc !== '/hero-banner.jpg') {
      setCurrentSrc('/lookbook-banner.jpg');
      return;
    }

    // Step 4: Final rock-solid guarantee - embedded SVG that CANNOT fail
    const svgFallback = createBoutiqueSvgFallback(productName || (alt as string), category);
    setCurrentSrc(svgFallback);
    setIsLoaded(true);
  };

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      loading={loading}
      onLoad={() => setIsLoaded(true)}
      onError={handleError}
      className={`${className} transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-80'
      }`}
    />
  );
};
