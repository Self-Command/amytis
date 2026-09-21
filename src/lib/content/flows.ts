import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';
import { siteConfig } from '../../../site.config';
import { byDateDesc } from '../sort';
import { extractContentMetrics } from '../text-metrics';
import type { Heading } from './types';
import { flowsDirectory, domainDir, readUtf8File, contentRoot } from './io';
import { createProdMemo, createKeyedMemo } from './cache';
import { dateField, draftField, tagsField, invalidFrontmatterError } from './schema';

/**
 * Flows: daily notes stored as content/flows/YYYY/MM/DD.{md,mdx}
 * (or DD/index.{md,mdx}). The slug IS the date path.
 *
 * Locale-aware: flows are read from content/flows/ (default locale) or
 * content/<locale>/flows/ (non-default locales). All public functions
 * accept an optional locale parameter; the default locale reads from
 * content/flows/ and non-default locales read from content/<locale>/flows/.
 */

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
  /** Locale tree this flow came from (default locale = undefined). */
  locale?: string;
}

function isFlowVisible(flow: FlowData): boolean {
  if (process.env.NODE_ENV === 'production' && flow.draft) return false;
  if (!siteConfig.posts?.showFuturePosts) {
    if (new Date(flow.date) > new Date()) return false;
  }
  return true;
}

function parseFlowFile(fullPath: string, slug: string, locale?: string): FlowData {
  const fileContents = readUtf8File(fullPath);
  const { data: rawData, content } = matter(fileContents);

  const parsed = FlowSchema.safeParse(rawData);
  if (!parsed.success) {
    throw invalidFrontmatterError('flow frontmatter', fullPath, parsed.error);
  }
  const data = parsed.data;

  const h1Match = content.match(/^\s*#\s+(.+)/);
  const { contentWithoutH1, excerpt, headings } = extractContentMetrics(content, { withCounts: false });
  const date = data.date || slug.replace(/\//g, '-');

  return {
    slug,
    date,
    title: data.title?.trim() || h1Match?.[1]?.trim() || date,
    tags: data.tags,
    draft: data.draft,
    commentable: data.commentable,
    content: contentWithoutH1,
    excerpt,
    headings,
    locale,
  };
}

function flowsDirFor(locale?: string): string {
  return locale && locale !== siteConfig.i18n.defaultLocale
    ? domainDir('flows', locale)
    : flowsDirectory;
}

const allFlowsMemo = createProdMemo<FlowData[]>();
const localeFlowsMemo = createKeyedMemo<string, FlowData[]>();

export function getAllFlows(locale?: string): FlowData[] {
  if (locale && locale !== siteConfig.i18n.defaultLocale) {
    return localeFlowsMemo.get(locale, () => computeAllFlows(locale));
  }
  return allFlowsMemo.get(() => computeAllFlows());
}

function computeAllFlows(locale?: string): FlowData[] {
  const flowsDir = flowsDirFor(locale);
  if (!fs.existsSync(flowsDir)) return [];

  const flows: FlowData[] = [];

  const yearDirs = fs.readdirSync(flowsDir, { withFileTypes: true });
  for (const yearEntry of yearDirs) {
    if (!yearEntry.isDirectory() || !/^\d{4}$/.test(yearEntry.name)) continue;
    const yearPath = path.join(flowsDir, yearEntry.name);

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
}

function visibleOrNull(flow: FlowData): FlowData | null {
  return isFlowVisible(flow) ? flow : null;
}

export function getFlowBySlug(slug: string, locale?: string): FlowData | null {
  const flowsDir = flowsDirFor(locale);
  if (!fs.existsSync(flowsDir)) return null;

  const parts = slug.split('/');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;

  const basePath = path.join(flowsDir, year, month);
  if (!fs.existsSync(basePath)) return null;

  const mdxPath = path.join(basePath, `${day}.mdx`);
  const mdPath = path.join(basePath, `${day}.md`);
  if (fs.existsSync(mdxPath)) return visibleOrNull(parseFlowFile(mdxPath, slug, locale));
  if (fs.existsSync(mdPath)) return visibleOrNull(parseFlowFile(mdPath, slug, locale));

  const indexMdx = path.join(basePath, day, 'index.mdx');
  const indexMd = path.join(basePath, day, 'index.md');
  if (fs.existsSync(indexMdx)) return visibleOrNull(parseFlowFile(indexMdx, slug, locale));
  if (fs.existsSync(indexMd)) return visibleOrNull(parseFlowFile(indexMd, slug, locale));

  return null;
}

export function getFlowsByYear(year: string, locale?: string): FlowData[] {
  return getAllFlows(locale).filter(f => f.slug.startsWith(`${year}/`));
}

export function getFlowsByMonth(year: string, month: string, locale?: string): FlowData[] {
  return getAllFlows(locale).filter(f => f.slug.startsWith(`${year}/${month}/`));
}

export function getFlowsByTag(tag: string, locale?: string): FlowData[] {
  return getAllFlows(locale).filter(f =>
    f.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
  );
}

export function getAdjacentFlows(slug: string, locale?: string): { prev: FlowData | null; next: FlowData | null } {
  const allFlows = getAllFlows(locale);
  const index = allFlows.findIndex(f => f.slug === slug);
  if (index === -1) return { prev: null, next: null };

  return {
    prev: index < allFlows.length - 1 ? allFlows[index + 1] : null,
    next: index > 0 ? allFlows[index - 1] : null,
  };
}

export function getRecentFlows(limit: number = 5, locale?: string): FlowData[] {
  return getAllFlows(locale).slice(0, limit);
}

export function getFlowTags(locale?: string): Record<string, number> {
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

/** Locales whose tree holds at least one flow (default first). */
export function getFlowContentLocales(flowSlug: string): string[] {
  const locales = [siteConfig.i18n.defaultLocale];
  if (siteConfig.i18n.enabled) {
    for (const locale of siteConfig.i18n.locales) {
      if (locale === siteConfig.i18n.defaultLocale) continue;
      if (getFlowBySlug(flowSlug, locale)) locales.push(locale);
    }
  }
  return locales;
}

/** Find the twin of a flow in another locale (same slug). */
export function getTwinFlow(flow: FlowData, targetLocale: string): FlowData | null {
  return getFlowBySlug(flow.slug, targetLocale);
}