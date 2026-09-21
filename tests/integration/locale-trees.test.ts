import path from 'node:path';
import { describe, expect, test } from 'bun:test';
import {
  classifyContentRootDir,
  contentRoot,
  getActiveContentLocales,
  legacyLocaleSuffix,
  treePathFor,
  validateLocaleTreeEntry,
} from '../../src/lib/content/io';
import {
  getAllPages,
  getAllPosts,
  getPostBySlug,
  getPostContentLocales,
  getTwinPost,
} from '../../src/lib/content/posts';
import { getAllSeries } from '../../src/lib/content/series';
import { getSeriesTitle } from '../../src/lib/content/series-metadata';
import { getPostUrl } from '../../src/lib/urls';

// Tracked zh-tree fixtures this suite relies on (see content/zh/):
// - posts/2026-02-20-i18n-routing-considerations.mdx — twin of the en post
//   with the same tree-relative path
// - posts/zh-original-demo.mdx — zh-original, no default-tree twin
// - series/zh-demo-series/{index.mdx, di-yi-pian.mdx} — zh-only series
//
// Never reference the maintainer's private (gitignored) zh content here —
// those trees exist locally but not in CI.

const EN_ZH = { locales: ['en', 'zh'], defaultLocale: 'en', enabled: true };
const ZH_DEFAULT = { locales: ['zh', 'en'], defaultLocale: 'zh', enabled: true };

describe('locale content trees', () => {
  test('getActiveContentLocales uses zh as default and en as secondary', () => {
    expect(getActiveContentLocales()).toEqual(['zh', 'en']);
  });

  test('default tree is zh and has no locale URL prefix', () => {
    const zhPosts = getAllPosts();
    const slugs = zhPosts.map(p => p.slug);

    expect(slugs).toContain('i18n-routing-considerations');
    expect(slugs).toContain('zh-original-demo');

    for (const post of zhPosts) {
      expect(post.locale).toBe('zh');

      const url = getPostUrl(post);

      expect(url.startsWith('/zh/')).toBe(false);
      expect(url.startsWith('/en/')).toBe(false);
    }
  });

  test('en tree is secondary and uses /en/ URLs', () => {
    const enPosts = getAllPosts('en');
    const slugs = enPosts.map(p => p.slug);

    expect(slugs).toContain('i18n-routing-considerations');
    expect(slugs).toContain('asynchronous-javascript');

    for (const post of enPosts) {
      expect(post.locale).toBe('en');

      const url = getPostUrl(post);

      expect(url.startsWith('/en/')).toBe(true);
    }
  });

  test('twins pair by treePath across default zh and en trees', () => {
    const zhPost = getPostBySlug('i18n-routing-considerations');

    expect(zhPost).not.toBeNull();
    expect(zhPost!.locale).toBe('zh');
    expect(getPostContentLocales(zhPost!)).toEqual(['zh', 'en']);

    const twin = getTwinPost(zhPost!, 'en');

    expect(twin).not.toBeNull();
    expect(twin!.locale).toBe('en');
    expect(twin!.title).toBe(
      'i18n in a Static Next.js Blog: Client-Side Toggle vs URL-Based Routing',
    );
    expect(twin!.treePath).toBe(zhPost!.treePath);
    expect(getPostUrl(twin!)).toBe(`/en${getPostUrl(zhPost!)}`);
  });

  test('zh originals live in the default tree and have no en twin', () => {
    const zhOriginal = getPostBySlug('zh-original-demo');

    expect(zhOriginal).not.toBeNull();
    expect(zhOriginal!.locale).toBe('zh');
    expect(getPostContentLocales(zhOriginal!)).toEqual(['zh']);
    expect(getTwinPost(zhOriginal!, 'en')).toBeNull();
  });

  test('zh series live in the default tree and are absent from en', () => {
    const zhSeries = getAllSeries();

    expect(Object.keys(zhSeries)).toContain('zh-demo-series');
    expect(zhSeries['zh-demo-series'].map(p => p.slug)).toEqual(['di-yi-pian']);

    expect(getSeriesTitle('zh-demo-series')).toBe('中文示例系列');
    expect(
      zhSeries['zh-demo-series'][0].seriesTitle,
    ).toBe('中文示例系列');

    const enSeries = getAllSeries('en');

    expect(Object.keys(enSeries)).not.toContain('zh-demo-series');
    expect(getSeriesTitle('zh-demo-series', 'en')).toBeUndefined();
  });

  test('default zh pages and secondary en pages are both discoverable', () => {
    const zhPageSlugs = getAllPages()
      .map(p => p.slug)
      .sort();

    expect(zhPageSlugs).toEqual(['about', 'links', 'privacy']);

    for (const page of getAllPages()) {
      expect(page.locale).toBe('zh');
    }

    const enPageSlugs = getAllPages('en')
      .map(p => p.slug)
      .sort();

    expect(enPageSlugs).toEqual(['about']);

    for (const page of getAllPages('en')) {
      expect(page.locale).toBe('en');
    }
  });

  test('unknown locale argument throws', () => {
    expect(() => getAllPosts('fr')).toThrow(
      /Unknown content locale "fr"/,
    );
  });
});
describe('locale tree validation cores (pure, defaultLocale-agnostic)', () => {
  test('classifyContentRootDir routes names correctly', () => {
    expect(classifyContentRootDir('posts', EN_ZH)).toBe('content-type');
    expect(classifyContentRootDir('zh', EN_ZH)).toBe('locale');
    expect(classifyContentRootDir('images', EN_ZH)).toBe('ignored');
  });

  test('default-locale directory throws', () => {
    expect(() => classifyContentRootDir('en', EN_ZH)).toThrow(/default locale/);
    // zh-default config flips: content/zh/ is invalid, content/en/ is the locale tree.
    expect(() => classifyContentRootDir('zh', ZH_DEFAULT)).toThrow(/default locale/);
    expect(classifyContentRootDir('en', ZH_DEFAULT)).toBe('locale');
  });

  test('unknown or disabled locale directory throws', () => {
    expect(() => classifyContentRootDir('ja', EN_ZH)).toThrow(/Unknown locale directory content\/ja\//);
    expect(() => classifyContentRootDir('zh', { ...EN_ZH, enabled: false })).toThrow(/Unknown locale directory/);
  });

  test('locale tree entries: flows deferred, nesting forbidden, content types fine', () => {
    expect(() => validateLocaleTreeEntry('zh', 'flows')).toThrow(/not supported yet/);
    expect(() => validateLocaleTreeEntry('zh', 'ja')).toThrow(/cannot nest/);
    expect(() => validateLocaleTreeEntry('zh', 'posts')).not.toThrow();
    expect(() => validateLocaleTreeEntry('zh', 'books')).not.toThrow();
  });

  test('legacyLocaleSuffix flags retired sibling filenames only', () => {
    const locales = ['en', 'zh'];
    expect(legacyLocaleSuffix('about.zh.mdx', locales)).toBe('zh');
    expect(legacyLocaleSuffix('about.en.md', locales)).toBe('en');
    expect(legacyLocaleSuffix('post.zh.rst', locales)).toBe('zh');
    expect(legacyLocaleSuffix('about.mdx', locales)).toBeNull();
    expect(legacyLocaleSuffix('2026-01-12-foo.md', locales)).toBeNull();
    expect(legacyLocaleSuffix('v2.0-notes.md', locales)).toBeNull();
    expect(legacyLocaleSuffix('image.png', locales)).toBeNull();
  });

  test('treePathFor strips extensions and collapses index/README onto the folder', () => {
    expect(treePathFor(path.join(contentRoot('zh'), 'posts', 'foo.md'), 'zh')).toBe('posts/foo');
    expect(treePathFor(path.join(contentRoot('en'), 'posts', 'foo', 'index.mdx'), 'en')).toBe('posts/foo');
    expect(treePathFor(path.join(contentRoot('en'), 'series', 's', 'README.md'), 'en')).toBe('series/s');
    expect(treePathFor(path.join(contentRoot('en'), 'about.mdx'), 'en')).toBe('about');
  });
});
