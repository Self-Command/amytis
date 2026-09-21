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

const social = {
  github: "https://github.com/Self-Command",
  twitter: "",
  email: "mailto:hualuo9700@gmail.com",
};

export const siteConfig = {

  title: { en: "Asterion Vale", zh: "一叶渡星河" },
  logo: {
    src: "",
    favicon: "/icon.svg",
  },
  description: {
    en: "A quiet passage through a vast world, gathering ideas, reflections, and fragments of a life along the way.",
    zh: "一叶行于星河，收藏所见所思，也记录一路走过的风景。",
  },
  baseUrl: "https://self-command.github.io/amytis",
  ogImage: "/og-image.png",
  footerText: {
    en: `© ${new Date().getFullYear()} Asterion Vale`,
    zh: `© ${new Date().getFullYear()} 一叶渡星河`,
  },

  i18n: {
    enabled: true,
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
  },

  nav: [
    { name: "Home", url: "/", weight: 0 },
    { name: "Articles", url: "/posts", weight: 1 },
    { name: "Series", url: "/series", weight: 2, dropdown: [] },
    { name: "Notes", url: "/notes", weight: 3 },
    { name: "Essays", url: "/flows", weight: 4 },
    { name: "Books", url: "/books", weight: 5, dropdown: [] },
    { name: "About", url: "/about", weight: 6 },
    { name: "More", url: "", weight: 7, children: [
      { name: "Graph", url: "/graph" },
      { name: "Archive", url: "/archive", dividerBefore: true },
      { name: "Tags", url: "/tags" },
      { name: "Links", url: "/links" },
    ]},
  ] as NavItem[],

  footer: {
    explore: [
      { name: "Archive", url: "/archive", weight: 1 },
      { name: "Tags", url: "/tags", weight: 2 },
      { name: "Links", url: "/links", weight: 3 },
      { name: "About", url: "/about", weight: 4 },
    ],
    connect: [
      { name: "GitHub", url: social.github, weight: 1 },
      { name: "Email", url: social.email, weight: 2 },
      { name: "RSS Feed", url: "/feed.xml", weight: 3, external: true },
    ],
    builtWith: {
      show: true,
      url: "https://github.com/hutusi/amytis",
      text: { en: "Built with Amytis", zh: "基于 Amytis 构建" },
    },
    bottomLinks: [] as { text: string | Record<string, string>; url?: string }[],
  },

  social,
  share: {
    enabled: true,
    platforms: ['twitter', 'facebook', 'weibo', 'copy'],
  },
  subscribe: {
    substack: '',
    telegram: '',
    wechat: {
      qrCode: '',
      account: '',
    },
    email: '',
  },

  features: {
    posts: {
      enabled: true,
      name: { en: "Articles", zh: "文章" },
    },
    series: {
      enabled: true,
      name: { en: "Series", zh: "系列" },
    },
    books: {
      enabled: true,
      name: { en: "Books", zh: "书籍" },
    },
    flow: {
      enabled: true,
      name: { en: "Essays", zh: "随笔" },
    },
  },

  hero: {
    tagline: { en: "Personal Digital Garden", zh: "个人数字花园" },
    title: { en: "Let knowledge settle, ideas grow, and life leave a trace.", zh: "让知识沉淀，让思考生长，让生活留下痕迹。" },
    subtitle: {
      en: "A personal space for AI, technology, tools, reading, ideas, reflections, and everyday life\u2014where scattered discoveries slowly converge into a constellation of my own.",
      zh: "记录 AI、技术、工具、阅读、灵感、思考与生活，在不断探索与实践中，让零散的见闻汇成自己的星河。",
    },
  },
  homepage: {
    sections: [
      { id: 'hero',            enabled: true, weight: 1 },
      { id: 'featured-posts',  enabled: true, weight: 2, maxItems: 4, order: 'shuffle' as 'shuffle' | 'date-desc' | 'date-asc' },
      { id: 'latest-posts',    enabled: true, weight: 3, maxItems: 4 },
      { id: 'recent-flows',    enabled: true, weight: 4, maxItems: 7 },
      { id: 'featured-series', enabled: true, weight: 5, maxItems: 6, order: 'shuffle' as 'shuffle' | 'date-desc' | 'date-asc' },
      { id: 'featured-books',  enabled: true, weight: 6, maxItems: 4, order: 'shuffle' as 'shuffle' | 'date-desc' | 'date-asc' },
    ],
  },

  pagination: {
    posts: 5,
    series: 5,
    flows: 20,
    notes: 20,
  },
  posts: {
    basePath: 'posts',
    toc: true,
    showFuturePosts: false,
    includeDateInUrl: false,
    authors: {
      default: ["Asterion Vale"] as string[],
      showInHeader: true,
      showAuthorCard: true,
    },
    excludeFromListing: [] as string[],
    archive: {
      showAuthors: true,
    },
  },
  series: {
    autoPaths: true,
    customPaths: {} as Record<string, string>,
  },
  flows: {
    recentCount: 5,
  },
  feed: {
    maxItems: 20,
    format: 'rss' as 'rss' | 'atom' | 'both',
    content: 'full' as 'excerpt' | 'full',
    includeFlows: false,
  },

  images: {
    cdnBaseUrl: "",
  },

  themeColor: 'default',
  browserCheck: {
    updateUrl: 'https://browsehappy.com/',
  },

  analytics: {
    providers: [] as ('umami' | 'plausible' | 'google')[],
    umami: {
      websiteId: '',
      src: 'https://us.umami.is/script.js',
    },
    plausible: {
      domain: '',
      src: 'https://plausible.io/js/script.js',
    },
    google: {
      measurementId: '',
    },
  },

  comments: {
    provider: null,
    commentable: {
      posts: true,
      flows: true,
      notes: true,
      bookChapters: true,
      staticPages: false,
    },
    giscus: {
      repo: '',
      repoId: '',
      category: '',
      categoryId: '',
    },
    disqus: {
      shortname: '',
    },
  },

  authors: {
    "Asterion Vale": {
      bio: "I explore what I encounter, reflect on what I learn, build what I believe in, and keep a record of the journey.",
      avatar: "",
      social: [],
    },
  } as Record<string, {
    bio?: string;
    avatar?: string;
    social?: Array<{
      image: string;
      description: string;
    }>;
  }>,

};