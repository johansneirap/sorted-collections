import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import BenchmarkChart from './components/BenchmarkChart.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('BenchmarkChart', BenchmarkChart);
  },
} satisfies Theme;
