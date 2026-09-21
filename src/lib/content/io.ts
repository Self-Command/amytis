import fs from 'fs';
import path from 'path';
import { siteConfig } from '../../../site.config';

/**
 * Content-tree filesystem access and filename conventions.
 * Tests read their committed fixture tree so production content remains clean.
 */
const contentRootPath = process.env.NODE_ENV === 'test'
  ? path.join(process.cwd(), 'tests', 'fixtures', 'content')
  : path.join(process.cwd(), 'content');

export const contentDirectory = path.join(contentRootPath, 'posts');
export const pagesDirectory = contentRootPath;
export const seriesDirectory = path.join(contentRootPath, 'series');
export const booksDirectory = path.join(contentRootPath, 'books');
export const flowsDirectory = path.join(contentRootPath, 'flows');
export const notesDirectory = path.join(contentRootPath, 'notes');

const LOCALE_DIR_SHAPE = /^[a-z]{2}(-[A-Z]{2})?$/;
const CONTENT_TYPE_DIRS = new Set(['posts', 'series', 'books', 'flows', 'notes']);

export type ContentDomain = 'posts' | 'series' | 'books' | 'flows' | 'notes' | 'pages';

export function contentRoot(locale: string): string {
  return locale === siteConfig.i18n.defaultLocale ? pagesDirectory : path.join(pagesDirectory, locale);
}

export function domainDir(domain: ContentDomain, locale: string): string {
  const root = contentRoot(locale);
  return domain === 'pages' ? root : path.join(root, domain);
}

export function treePathFor(fullPath: string, locale: string): string {
  const rel = path.relative(contentRoot(locale), fullPath).split(path.sep).join('/');
  return rel.replace(/\.(mdx?|rst)$/, '').replace(/\/(index|README)$/, '');
}

export function legacyLocaleSuffix(fileName: string, locales: string[]): string | null {
  const base = fileName.replace(/\.(mdx?|rst)$/, '');
  if (base === fileName) return null;
  const parts = base.split('.');
  if (parts.length < 2) return null;
  const suffix = parts[parts.length - 1];
  return locales.includes(suffix) ? suffix : null;
}

export function assertNotLegacyLocaleSibling(fileName: string, parentDir: string): void {
  const suffix = legacyLocaleSuffix(fileName, siteConfig.i18n.locales);
  if (!suffix) return;
  const relDir = path.relative(process.cwd(), parentDir).split(path.sep).join('/');
  const hint = suffix === siteConfig.i18n.defaultLocale
    ? `Default-locale content belongs in the base file — drop the ".${suffix}" suffix.`
    : `Move it into the content/${suffix}/ tree at the same relative path.`;
  throw new Error(`[amytis] Locale sibling files are no longer supported: ${relDir}/${fileName}. ${hint}`);
}

export function assertKnownLocale(locale: string): void {
  if (locale === siteConfig.i18n.defaultLocale) return;
  if (siteConfig.i18n.enabled && siteConfig.i18n.locales.includes(locale)) return;
  throw new Error(`[amytis] Unknown content locale "${locale}" — it is not configured.`);
}

export function classifyContentRootDir(
  name: string,
  config: { locales: string[]; defaultLocale: string; enabled: boolean },
): 'content-type' | 'locale' | 'ignored' {
  if (CONTENT_TYPE_DIRS.has(name)) return 'content-type';
  if (!LOCALE_DIR_SHAPE.test(name)) return 'ignored';
  if (name === config.defaultLocale) {
    throw new Error(`[amytis] content/${name}/ is the default locale — default-locale content lives at the content/ root.`);
  }
  if (!config.enabled || !config.locales.includes(name)) {
    throw new Error(`[amytis] Unknown locale directory content/${name}/.`);
  }
  return 'locale';
}

export function validateLocaleTreeEntry(locale: string, entryName: string): void {
  if (entryName === 'flows') {
    throw new Error(`[amytis] content/${locale}/flows/ is not supported yet — flow locale trees are deferred.`);
  }
  if (!CONTENT_TYPE_DIRS.has(entryName) && LOCALE_DIR_SHAPE.test(entryName)) {
    throw new Error(`[amytis] Nested locale directory content/${locale}/${entryName}/ is invalid.`);
  }
}

let activeLocalesCache: string[] | null = null;

export function getActiveContentLocales(): string[] {
  if (process.env.NODE_ENV === 'production' && activeLocalesCache) return activeLocalesCache;
  const { defaultLocale, locales, enabled } = siteConfig.i18n;
  const active = [defaultLocale];
  if (fs.existsSync(pagesDirectory)) {
    for (const entry of fs.readdirSync(pagesDirectory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (classifyContentRootDir(entry.name, { locales, defaultLocale, enabled }) !== 'locale') continue;
      for (const treeEntry of fs.readdirSync(path.join(pagesDirectory, entry.name), { withFileTypes: true })) {
        if (treeEntry.isDirectory()) validateLocaleTreeEntry(entry.name, treeEntry.name);
      }
      active.push(entry.name);
    }
  }
  if (process.env.NODE_ENV === 'production') activeLocalesCache = active;
  return active;
}

export function readUtf8File(filePath: string): string {
  return fs.readFileSync(/* turbopackIgnore: true */ filePath, 'utf8');
}

export function isMarkdownFilename(name: string): boolean { return name.endsWith('.md') || name.endsWith('.mdx'); }
export function isRstFilename(name: string): boolean { return name.endsWith('.rst'); }

export function parseSlugAndDate(rawName: string): { slug: string; dateFromFileName?: string } {
  const match = rawName.match(/^(\d{4}-\d{2}-\d{2})-(.*)$/);
  return match ? { dateFromFileName: match[1], slug: siteConfig.posts?.includeDateInUrl ? rawName : match[2] } : { slug: rawName };
}

export function assertSafeSeriesSlug(seriesSlug: string): void {
  if (!seriesSlug || path.isAbsolute(seriesSlug)) throw new Error(`[amytis] Invalid series slug "${seriesSlug}".`);
  const segments = seriesSlug.split(/[\\/]/);
  if (segments.length !== 1 || segments[0] === '.' || segments[0] === '..') throw new Error(`[amytis] Invalid series slug "${seriesSlug}".`);
}