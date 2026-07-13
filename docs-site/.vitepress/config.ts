import { defineConfig } from 'vitepress';
import typedocSidebar from '../api/typedoc-sidebar.json' with { type: 'json' };

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
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Leaderboard (SortedSet)', link: '/guide/leaderboard' },
            { text: 'Order Book (SortedMap)', link: '/guide/order-book' },
            { text: 'Scheduling (SortedList)', link: '/guide/scheduling' },
          ],
        },
      ],
      '/api/': [{ text: 'API Reference', link: '/api/' }, ...typedocSidebar],
      '/': [
        {
          text: 'Guide',
          items: [{ text: 'Getting Started', link: '/guide/getting-started' }],
        },
      ],
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
