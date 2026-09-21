import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';
import { siteConfig } from '../../../site.config';
import { byDateDesc } from '../sort';
import { extractContentMetrics } from '../text-metrics';
import type { Heading } from './types';
import { domainDir, treePathFor, getActiveContentLocales, assertKnownLocale, readUtf8File } from './io';
import { createProdKeyedMemo } from './cache';
import { dateField, draftField, tagsField, invalidFrontmatterError } from './schema';

/**
 * Flows: daily notes stored as content/flows/YYYY/MM/DD.{md,mdx}
 * (or DD/index.{md,mdx}). The slug IS the date path.
 */

const DEFAULT_LOCALE = siteConfig.i18n.defaultLocale;

const FlowSchema = z.object({
  title: z.string().optional(),
  date: dateField.optional(),
  tags: tagsField,
  draft: draftField,
  commentable: z.boolean().optional(),
});

export interface FlowData {
  slug: string;
  date: string;
  title: string;
  tags: string[];
  draft: boolean;
  commentable?: boolean;
  content: string;
  excerpt: string;
  headings: Heading[];
  /** Locale tree this flow was loaded from (siteConfig.i18n.defaultLocale for the content/ root tree). */
  locale: string;
  /** Tree-relative, extension-stripped source identity — the twin key across locale trees (io.treePathFor). */
  treePath: string;
}

/** Visibility policy shared by getAllFlows and getFlowBySlug: hide drafts in
 *  production and future-dated entries while showFuturePosts is off — direct
 *  slug access must not bypass what listings hide. */
function isFlowVisible(flow: FlowData): boolean {
  if (process.env.NODE_ENV === 'production' && flow.draft) return false;
  if (!siteConfig.posts?.showFuturePosts) {
    if (new Date(flow.date) > new Date()) return false;
  }
  return true;
}

function parseFlowFile(fullPath: string, slug: string, locale: string): FlowData {
  const fileContents = readUtf8File(fullPath);
  const { data: rawData, content } = matter(fileContents);

  const parsed = FlowSchema.safeParse(rawData);
  if (!parsed.success) {
    throw invalidFrontmatterError('flow frontmatter', fullPath, parsed.error);
  }
  const data = parsed.data;

  const h1Match = content.match(/^\s*#\s+(.+)/);
  const { contentWithoutH1, excerpt, headings } = extractContentMetrics(content, { withCounts: false });
  const date = data.date || slug.replace(/\//g, '-'); // slug is YYYY/MM/DD, convert to YYYY-MM-DD

  return {
    slug,
    date,
    title: data.title?.trim() || h1Match?.[1]?.trim() || date, // frontmatter(non-empty) → H1 → date
    tags: data.tags,
    draft: data.draft,
    commentable: data.commentable,
    content: contentWithoutH1,
    excerpt,
    headings,
    locale,
    treePath: treePathFor(fullPath, locale),
  };
}

const allFlowsMemo = createProdKeyedMemo<string, FlowData[]>();

export function getAllFlows(locale: string = DEFAULT_LOCALE): FlowData[] {
  assertKnownLocale(locale);
  // Prod-only memo: dev re-reads every call so HMR sees fresh flows.
  return allFlowsMemo.get(locale, () => {
    const localeFlowsDir = domainDir('flows', locale);
    if (!fs.existsSync(localeFlowsDir)) return [];

    const flows: FlowData[] = [];

    // Walk content/<locale>/flows/YYYY/MM/ structure
    const yearDirs = fs.readdirSync(localeFlowsDir, { withFileTypes: true });
    for (const yearEntry of yearDirs) {
      if (!yearEntry.isDirectory() || !/^\d{4}$/.test(yearEntry.name)) continue;
      const yearPath = path.join(localeFlowsDir, yearEntry.name);

      const monthDirs = fs.readdirSync(yearPath, { withFileTypes: true });
      for (const monthEntry of monthDirs) {
        if (!monthEntry.isDirectory() || !/^\d{2}$/.test(monthEntry.name)) continue;
        const monthPath = path.join(yearPath, monthEntry.name);

        const dayItems = fs.readdirSync(monthPath, { withFileTypes: true });
        for (const dayItem of dayItems) {
          const rawName = dayItem.name.replace(/\.mdx?$/, '');
          if (!/^\d{2}$/.test(rawName)) continue;

          const year = yearEntry.name;
          const month = monthEntry.name;
          const day = rawName;
          const slug = `${year}/${month}/${day}`;
          let fullPath = '';

          if (dayItem.isFile() && (dayItem.name.endsWith('.md') || dayItem.name.endsWith('.mdx'))) {
            fullPath = path.join(monthPath, dayItem.name);
          } else if (dayItem.isDirectory()) {
            const indexMdx = path.join(monthPath, dayItem.name, 'index.mdx');
            const indexMd = path.join(monthPath, dayItem.name, 'index.md');
            if (fs.existsSync(indexMdx)) fullPath = indexMdx;
            else if (fs.existsSync(indexMd)) fullPath = indexMd;
            else continue;
          } else {
            continue;
          }

          flows.push(parseFlowFile(fullPath, slug, locale));
        }
      }
    }

    return flows.filter(isFlowVisible).sort(byDateDesc);
  });
}

function visibleOrNull(flow: FlowData): FlowData | null {
  return isFlowVisible(flow) ? flow : null;
}

export function getFlowBySlug(slug: string, locale: string = DEFAULT_LOCALE): FlowData | null {
  assertKnownLocale(locale);
  const localeFlowsDir = domainDir('flows', locale);
  if (!fs.existsSync(localeFlowsDir)) return null;

  // slug format: "YYYY/MM/DD"
  const parts = slug.split('/');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;

  const basePath = path.join(localeFlowsDir, year, month);
  if (!fs.existsSync(basePath)) return null;

  // Try flat file
  const mdxPath = path.join(basePath, `${day}.mdx`);
  const mdPath = path.join(basePath, `${day}.md`);
  if (fs.existsSync(mdxPath)) return visibleOrNull(parseFlowFile(mdxPath, slug, locale));
  if (fs.existsSync(mdPath)) return visibleOrNull(parseFlowFile(mdPath, slug, locale));

  // Try folder
  const indexMdx = path.join(basePath, day, 'index.mdx');
  const indexMd = path.join(basePath, day, 'index.md');
  if (fs.existsSync(indexMdx)) return visibleOrNull(parseFlowFile(indexMdx, slug, locale));
  if (fs.existsSync(indexMd)) return visibleOrNull(parseFlowFile(indexMd, slug, locale));

  return null;
}

export function getFlowsByYear(year: string, locale: string = DEFAULT_LOCALE): FlowData[] {
  return getAllFlows(locale).filter(f => f.slug.startsWith(`${year}/`));
}

export function getFlowsByMonth(year: string, month: string, locale: string = DEFAULT_LOCALE): FlowData[] {
  return getAllFlows(locale).filter(f => f.slug.startsWith(`${year}/${month}/`));
}

export function getFlowsByTag(tag: string, locale: string = DEFAULT_LOCALE): FlowData[] {
  return getAllFlows(locale).filter(f =>
    f.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
  );
}

export function getAdjacentFlows(slug: string, locale: string = DEFAULT_LOCALE): { prev: FlowData | null; next: FlowData | null } {
  const allFlows = getAllFlows(locale); // sorted newest-first
  const index = allFlows.findIndex(f => f.slug === slug);
  if (index === -1) return { prev: null, next: null };

  return {
    prev: index < allFlows.length - 1 ? allFlows[index + 1] : null, // older
    next: index > 0 ? allFlows[index - 1] : null, // newer
  };
}

export function getRecentFlows(limit: number = 5, locale: string = DEFAULT_LOCALE): FlowData[] {
  return getAllFlows(locale).slice(0, limit);
}

export function getFlowTags(locale: string = DEFAULT_LOCALE): Record<string, number> {
  const allFlows = getAllFlows(locale);
  const tags: Record<string, number> = {};
  allFlows.forEach((flow) => {
    flow.tags.forEach((tag) => {
      const normalizedTag = tag.toLowerCase();
      tags[normalizedTag] = (tags[normalizedTag] || 0) + 1;
    });
  });
  return tags;
}

// ─── cross-tree aggregation ──────────────────────────────────────────────────

const aggregatedFlowsMemo = createProdKeyedMemo<string, FlowData[]>();

/**
 * The default tree plus every locale tree's ORIGINAL flows, deduplicated by
 * treePath in [default, …locales] order so a twin counts once. Mirrors
 * notes.getNotesWithLocaleOriginals — the shared domain for the global
 * taxonomy surfaces (tags, feed, search).
 */
export function getFlowsWithLocaleOriginals(): FlowData[] {
  return aggregatedFlowsMemo.get('all', () => {
    const nonDefault = siteConfig.i18n.enabled
      ? siteConfig.i18n.locales.filter(locale => locale !== DEFAULT_LOCALE)
      : [];
    const seen = new Set(getAllFlows().map(flow => flow.treePath));
    const result = [...getAllFlows()];
    for (const locale of nonDefault) {
      for (const flow of getAllFlows(locale)) {
        if (seen.has(flow.treePath)) continue;
        seen.add(flow.treePath);
        result.push(flow);
      }
    }
    return result.sort(byDateDesc);
  });
}

// ─── twin lookups across locale trees ────────────────────────────────────────

/** Locales (including the flow's own) whose tree contains a flow with the same treePath. */
export function getFlowContentLocales(flow: Pick<FlowData, 'treePath' | 'locale'>): string[] {
  return getActiveContentLocales().filter(
    locale => locale === flow.locale || getAllFlows(locale).some(f => f.treePath === flow.treePath)
  );
}

/** The same flow in another locale tree (matched by treePath), or null. */
export function getTwinFlow(flow: Pick<FlowData, 'treePath'>, locale: string): FlowData | null {
  return getAllFlows(locale).find(f => f.treePath === flow.treePath) ?? null;
}
