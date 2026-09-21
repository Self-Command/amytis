export interface NavChildItem {
  name: string;
  url: string;
  external?: boolean;
  dividerBefore?: boolean;
}

export interface NavItem {
  name: string;
  url: string;
  weight: number;
  external?: boolean;
  dropdown?: string[];
  children?: NavChildItem[];
}

// TODO: replace with final site identity.
const social = {
  github: '',
  twitter: '',
  email: '',
};

export const siteConfig = {
  title: { en: 'My Digital Garden', zh: '我的数字花园' },
  logo: { src: '', favicon: '/icon.svg' },
  description: {
    en: 'A personal digital garden and knowledge space.',
    zh: '一个用于记录知识、思考与创作的个人数字花园。',
  },
  baseUrl: 'https://self-command.github.io/amytis',
  ogImage: '/og-image.png',
  footerText: { en: `© ${new Date().getFullYear()} My Digital Garden`, zh: `© ${new Date().getFullYear()} 我的数字花园` },

  i18n: {
    enabled: true,
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
  },

  nav: [
    { name: '随笔', url: '/flows', weight: 1 },
    { name: '文章', url: '/posts', weight: 2 },
    { name: '系列', url: '/series', weight: 3, dropdown: [] },
    { name: '书籍', url: '/books', weight: 4, dropdown: [] },
    { name: '关于', url: '/about', weight: 5 },
    { name: '更多', url: '', weight: 6, children: [
      { name: '笔记', url: '/notes' },
      { name: '知识图谱', url: '/graph' },
      { name: '归档', url: '/archive', dividerBefore: true },
      { name: '标签', url: '/tags' },
      { name: '链接', url: '/links' },
    ] },
  ] as NavItem[],

  footer: {
    explore: [
      { name: 'Archive', url: '/archive', weight: 1 },
      { name: 'Tags', url: '/tags', weight: 2 },
      { name: 'About', url: '/about', weight: 3 },
    ],
    connect: [
      { name: 'RSS Feed', url: '/feed.xml', weight: 1, external: true },
    ],
    builtWith: { show: false, url: '', text: { en: 'Built with Amytis', zh: '基于 Amytis 构建' } },
    bottomLinks: [] as { text: string | Record<string, string>; url?: string }[],
  },

  social,
  share: { enabled: true, platforms: ['copy'] as ('twitter' | 'facebook' | 'linkedin' | 'weibo' | 'reddit' | 'hackernews' | 'telegram' | 'bluesky' | 'mastodon' | 'douban' | 'zhihu' | 'copy')[] },
  subscribe: { substack: '', telegram: '', wechat: { qrCode: '', account: '' }, email: '' },

  features: {
    posts: { enabled: true, name: { en: 'Articles', zh: '文章' } },
    series: { enabled: true, name: { en: 'Series', zh: '系列' } },
    books: { enabled: true, name: { en: 'Books', zh: '书籍' } },
    flow: { enabled: true, name: { en: 'Flow', zh: '随笔' } },
  },

  hero: {
    tagline: { en: 'Personal Digital Garden', zh: '个人数字花园' },
    title: { en: 'A place for ideas to grow.', zh: '让知识、思考与创作在此生长。' },
    subtitle: {
      en: 'Written in Obsidian and published through GitHub.',
      zh: '在 Obsidian 中创作，通过 GitHub 自动构建与发布。',
    },
  },
  homepage: {
    sections: [
      { id: 'hero', enabled: true, weight: 1 },
      { id: 'featured-posts', enabled: true, weight: 2, maxItems: 4, order: 'date-desc' as const },
      { id: 'latest-posts', enabled: true, weight: 3, maxItems: 4 },
      { id: 'recent-flows', enabled: true, weight: 4, maxItems: 7 },
      { id: 'featured-series', enabled: true, weight: 5, maxItems: 6, order: 'date-desc' as const },
      { id: 'featured-books', enabled: true, weight: 6, maxItems: 4, order: 'date-desc' as const },
    ],
  },

  pagination: { posts: 5, series: 5, flows: 20, notes: 20 },
  posts: {
    basePath: 'posts',
    toc: true,
    showFuturePosts: false,
    includeDateInUrl: false,
    authors: { default: [] as string[], showInHeader: false, showAuthorCard: false },
    excludeFromListing: [] as string[],
    archive: { showAuthors: false },
  },
  series: { autoPaths: true, customPaths: {} as Record<string, string> },
  flows: { recentCount: 5 },
  feed: { maxItems: 20, format: 'rss' as 'rss' | 'atom' | 'both', content: 'full' as 'excerpt' | 'full', includeFlows: false },
  images: { cdnBaseUrl: '' },
  themeColor: 'default',
  browserCheck: { updateUrl: 'https://browsehappy.com/' },

  analytics: {
    providers: [] as ('umami' | 'plausible' | 'google')[],
    umami: { websiteId: '', src: '' },
    plausible: { domain: '', src: '' },
    google: { measurementId: '' },
  },
  comments: {
    provider: null as 'giscus' | 'disqus' | null,
    commentable: { posts: false, flows: false, notes: false, bookChapters: false, staticPages: false },
    giscus: { repo: '', repoId: '', category: '', categoryId: '' },
    disqus: { shortname: '' },
  },
  authors: {} as Record<string, { bio?: string; avatar?: string; social?: Array<{ image: string; description: string }> }>,
};