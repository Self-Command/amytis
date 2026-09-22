import { visit } from 'unist-util-visit';
import sizeOf from 'image-size';
import path from 'path';
import fs from 'fs';
import { Root, Element } from 'hast';
import { getCdnImageUrl } from './image-utils';
import { siteConfig } from '../../site.config';

interface Options {
  slug?: string;
  cdnBaseUrl?: string;
}

function getBasePath(): string {
  try {
    const pathname = new URL(siteConfig.baseUrl).pathname;
    return pathname === '/'
      ? ''
      : `/${pathname.replace(/^\/+|\/+$/g, '')}`;
  } catch {
    return '';
  }
}

function withBasePath(src: string): string {
  const basePath = getBasePath();

  if (
    !basePath ||
    !src.startsWith('/') ||
    src.startsWith('//')
  ) {
    return src;
  }

  if (
    src === basePath ||
    src.startsWith(`${basePath}/`)
  ) {
    return src;
  }

  return `${basePath}${src}`;
}

export default function rehypeImageMetadata(options: Options) {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (
        node.tagName !== 'img' ||
        !node.properties ||
        typeof node.properties.src !== 'string'
      ) {
        return;
      }

      const src = node.properties.src as string;

      // External / protocol-relative URLs must never be modified.
      if (
        src.startsWith('http://') ||
        src.startsWith('https://') ||
        src.startsWith('//')
      ) {
        return;
      }

      let imagePath = '';
      let publicPath = '';

      if (src.startsWith('./') && options.slug) {
        // Relative path: slug is the full public-relative base path
        // (e.g. posts/my-post, books/my-book, flows/2026/01/15).
        const relative = src.substring(2);

        // BasePath is a URL prefix only; it must NOT be added to the filesystem path.
        imagePath = path.resolve('public', options.slug, relative);
        publicPath = `/${options.slug}/${relative}`;
      } else if (
        options.slug &&
        !src.startsWith('/') &&
        !src.startsWith('../') &&
        !src.startsWith('data:') &&
        !src.startsWith('#')
      ) {
        // Bare relative path: resolve against the content slug root.
        imagePath = path.resolve('public', options.slug, src);
        publicPath = `/${options.slug}/${src}`;
      } else if (src.startsWith('/')) {
        // Absolute path from public/.
        imagePath = path.resolve('public', src.substring(1));
        publicPath = src;
      } else {
        return;
      }

      // Add the Next.js deployment basePath to local browser URLs.
      // For this site:
      //   /posts/foo/image.png
      // becomes:
      //   /amytis/posts/foo/image.png
      publicPath = withBasePath(publicPath);

      // Apply CDN prefix after basePath resolution.
      node.properties.src = getCdnImageUrl(
        publicPath,
        options.cdnBaseUrl ?? '',
      );

      // Enrich with dimensions only when the file exists locally.
      try {
        if (
          imagePath &&
          fs.existsSync(/* turbopackIgnore: true */ imagePath)
        ) {
          const buffer = fs.readFileSync(
            /* turbopackIgnore: true */ imagePath,
          );

          const dimensions = sizeOf(buffer);

          if (dimensions) {
            node.properties.width = dimensions.width;
            node.properties.height = dimensions.height;
          }
        }
      } catch {
        // Silently ignore dimension probing failures.
      }
    });
  };
}
