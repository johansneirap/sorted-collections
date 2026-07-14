<script setup lang="ts">
interface Row {
  label: string;
  a: number;
  b: number;
}

const props = defineProps<{
  mode: 'ratio' | 'magnitude';
  seriesA: string;
  seriesB: string;
  unit?: string;
  rows: Row[];
}>();

const fmt = (n: number) => n.toLocaleString('en-US');

const logDomain = (() => {
  if (props.mode !== 'magnitude') return null;
  const values = props.rows.flatMap((r) => [r.a, r.b]);
  return { min: Math.log10(Math.min(...values)), max: Math.log10(Math.max(...values)) };
})();

function logWidth(value: number): number {
  if (!logDomain) return 0;
  const { min, max } = logDomain;
  if (max === min) return 100;
  return Math.max(4, Math.min(100, ((Math.log10(value) - min) / (max - min)) * 96 + 4));
}

function ratioWidth(value: number, other: number): number {
  const max = Math.max(value, other);
  return max === 0 ? 0 : (value / max) * 100;
}

function multiplier(a: number, b: number): string {
  return `${(a / b).toFixed(1)}x`;
}
</script>

<template>
  <div class="bchart">
    <div class="bchart-legend">
      <span class="bchart-legend-item"><span class="bchart-swatch bchart-swatch-a" />{{ seriesA }}</span>
      <span class="bchart-legend-item"><span class="bchart-swatch bchart-swatch-b" />{{ seriesB }}</span>
    </div>

    <div v-for="row in rows" :key="row.label" class="bchart-row">
      <span class="bchart-label">{{ row.label }}</span>

      <div class="bchart-bars">
        <div class="bchart-bar-line">
          <div class="bchart-track">
            <div
              class="bchart-fill bchart-fill-a"
              :style="{ width: (mode === 'ratio' ? ratioWidth(row.a, row.b) : logWidth(row.a)) + '%' }"
            />
          </div>
          <span v-if="mode === 'magnitude'" class="bchart-value">{{ fmt(row.a) }}{{ unit }}</span>
        </div>
        <div class="bchart-bar-line">
          <div class="bchart-track">
            <div
              class="bchart-fill bchart-fill-b"
              :style="{ width: (mode === 'ratio' ? ratioWidth(row.b, row.a) : logWidth(row.b)) + '%' }"
            />
          </div>
          <span v-if="mode === 'magnitude'" class="bchart-value">{{ fmt(row.b) }}{{ unit }}</span>
        </div>
      </div>

      <span v-if="mode === 'ratio'" class="bchart-mult" :class="{ 'bchart-mult-win': row.a >= row.b }">
        {{ multiplier(row.a, row.b) }}
      </span>
    </div>

    <p v-if="mode === 'magnitude'" class="bchart-note">
      Log scale: the real gap between bars is larger than it looks. The exact number sits
      next to each bar.
    </p>
  </div>
</template>

<style scoped>
.bchart {
  margin: 1.5rem 0;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  font-family: var(--vp-font-family-mono);
}

.bchart-legend {
  display: flex;
  gap: 20px;
  margin-bottom: 1.1rem;
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.bchart-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.bchart-swatch {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  flex-shrink: 0;
}

.bchart-swatch-a {
  background: var(--sc-gradient-brand);
}

.bchart-swatch-b {
  background: var(--vp-c-text-3);
  opacity: 0.6;
}

.bchart-row {
  display: grid;
  grid-template-columns: 118px 1fr auto;
  align-items: center;
  gap: 16px;
}

.bchart-row + .bchart-row {
  margin-top: 12px;
}

.bchart-label {
  font-size: 13px;
  color: var(--vp-c-text-1);
}

.bchart-bars {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.bchart-bar-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bchart-track {
  flex: 1;
  height: 7px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--vp-c-text-3) 16%, transparent);
  position: relative;
  overflow: hidden;
}

.bchart-fill {
  height: 100%;
  border-radius: 4px;
  position: absolute;
  left: 0;
  top: 0;
}

.bchart-fill-a {
  background: var(--sc-gradient-brand);
}

.bchart-fill-b {
  background: var(--vp-c-text-3);
  opacity: 0.75;
}

.bchart-value {
  font-size: 11px;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  min-width: 82px;
  text-align: right;
}

.bchart-mult {
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.bchart-mult-win {
  color: var(--sc-accent-cyan);
}

.bchart-note {
  margin: 1rem 0 0;
  font-family: var(--vp-font-family-base);
  font-size: 12px;
  color: var(--vp-c-text-3);
}
</style>
