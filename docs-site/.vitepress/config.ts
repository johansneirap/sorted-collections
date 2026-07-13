import { type DefaultTheme, defineConfig } from 'vitepress';
import typedocSidebar from '../api/typedoc-sidebar.json' with { type: 'json' };

// Shared across every page that isn't under /api/ — the generated API tree gets
// its own sidebar below. Reused (not duplicated per-path) so Guide, Benchmarks,
// and FAQ pages all show the same complete navigation and correct prev/next links,
// instead of each falling back to whatever partial sidebar happened to match.
const guideAndReferenceSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Guide',
    items: [
      { text: 'Getting Started', link: '/guide/getting-started' },
      { text: 'Leaderboard (SortedSet)', link: '/guide/leaderboard' },
      { text: 'Order Book (SortedMap)', link: '/guide/order-book' },
      { text: 'Scheduling (SortedList)', link: '/guide/scheduling' },
    ],
  },
  {
    text: 'Reference',
    items: [
      { text: 'API Reference', link: '/api/classes/SortedList' },
      { text: 'Benchmarks', link: '/benchmarks' },
      { text: 'FAQ', link: '/faq' },
    ],
  },
];

export default defineConfig({
  title: 'sorted-collections',
  description: 'SortedList, SortedSet, and SortedMap for JavaScript/TypeScript',
  base: '/sorted-collections/',
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/classes/SortedList' },
      { text: 'Benchmarks', link: '/benchmarks' },
      { text: 'FAQ', link: '/faq' },
    ],

    sidebar: {
      '/guide/': guideAndReferenceSidebar,
      '/benchmarks': guideAndReferenceSidebar,
      '/faq': guideAndReferenceSidebar,
      '/api/': [{ text: 'API Reference', link: '/api/' }, ...typedocSidebar],
      '/': guideAndReferenceSidebar,
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/johansneirap/sorted-collections' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Johans Neira',
    },

    search: {
      provider: 'local',
    },
  },
});
