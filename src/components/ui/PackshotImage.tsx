"use client";

import clsx from "clsx";
import { useState } from "react";

interface PackshotImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

export function PackshotImage({
  src,
  alt,
  width = 800,
  height = 600,
  priority = false,
  className,
}: PackshotImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc =
    !src || failedSrc === src ? "/products/fallback.svg" : src;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      onError={() => setFailedSrc(src)}
      className={clsx(
        "block h-full w-full object-cover select-none",
        className,
      )}
    />
  );
}
