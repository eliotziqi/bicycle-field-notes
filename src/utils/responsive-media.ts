import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";
import { withBase } from "./urls";

// Explicit callers assign roles; discovering uploads never creates content entries.
const uploads = import.meta.glob<{ default: ImageMetadata }>("/public/media/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}");
const cache = new Map<string, Promise<ResponsiveMedia>>();
const imageSet = (items: [string, number][]) => [...new Map(items.map(([src, width]) => [width, src]))]
  .map(([width, src]) => `${src} ${width}w`).join(", ");
interface ResponsiveMedia {
  original: string; width: number; height: number;
  thumbnail: string; thumbnailSet: string; hero: string; heroSet: string;
}
export function responsiveMedia(reference: string): Promise<ResponsiveMedia> {
  const path = decodeURIComponent(reference.replace(/^.*?(?=\/media\/)/, ""));
  if (!cache.has(path)) cache.set(path, (async () => {
    const load = uploads[`/public${path}`];
    if (!load) throw new Error(`Select an existing raster image under public/media/: ${reference}`);
    const { default: image } = await load();
    const generate = (width: number, quality: number) => getImage({ src: image, width: Math.min(width, image.width), format: "webp", quality });
    const [small, thumbnail, medium, hero] = await Promise.all([generate(320, 80), generate(640, 80), generate(800, 85), generate(1600, 85)]);
    return {
      original: withBase(path), width: image.width, height: image.height,
      thumbnail: thumbnail.src,
      thumbnailSet: imageSet([[small.src, Math.min(320, image.width)], [thumbnail.src, Math.min(640, image.width)]]),
      hero: hero.src,
      heroSet: imageSet([[medium.src, Math.min(800, image.width)], [hero.src, Math.min(1600, image.width)]]),
    };
  })());
  return cache.get(path)!;
}
