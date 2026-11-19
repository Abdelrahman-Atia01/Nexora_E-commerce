<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatMoney } from '@/lib/format'

/** One-series daily revenue chart built from real orders (inline SVG, hover + keyboard tooltip, table fallback). */
const props = defineProps<{ points: { date: string; value: number }[] }>()
const W = 720, H = 240, PL = 52, PR = 12, PT = 12, PB = 28
const hover = ref<number | null>(null)

const max = computed(() => {
  const m = Math.max(0, ...props.points.map((p) => p.value))
  if (m === 0) return 100
  const pow = 10 ** Math.floor(Math.log10(m))
  return Math.ceil(m / pow / 2) * pow * 2 / 2 // round up to a tidy step
})
const x = (i: number) => PL + (props.points.length <= 1 ? 0 : (i / (props.points.length - 1)) * (W - PL - PR))
const y = (v: number) => PT + (1 - v / max.value) * (H - PT - PB)
const line = computed(() => props.points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' '))
const area = computed(() => (props.points.length ? `${line.value} L${x(props.points.length - 1)},${H - PB} L${x(0)},${H - PB} Z` : ''))
const ticks = computed(() => [0, 0.5, 1].map((t) => ({ v: max.value * t, y: y(max.value * t) })))
const label = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
const xLabels = computed(() => {
  const n = props.points.length
  const step = Math.max(1, Math.ceil(n / 5))
  return props.points
    .map((p, i) => ({ i, t: label(p.date) }))
    .filter(({ i }) => i === n - 1 || (i % step === 0 && n - 1 - i >= step - 1 && n - 1 - i >= 2))
})

const onMove = (e: MouseEvent) => {
  const r = (e.currentTarget as SVGElement).getBoundingClientRect()
  const px = ((e.clientX - r.left) / r.width) * W
  const n = props.points.length
  if (!n) return
  hover.value = Math.min(n - 1, Math.max(0, Math.round(((px - PL) / (W - PL - PR)) * (n - 1))))
}
const onKey = (e: KeyboardEvent) => {
  const n = props.points.length
  if (!n) return
  if (e.key === 'ArrowRight') { hover.value = Math.min(n - 1, (hover.value ?? -1) + 1); e.preventDefault() }
  if (e.key === 'ArrowLeft') { hover.value = Math.max(0, (hover.value ?? n) - 1); e.preventDefault() }
  if (e.key === 'Escape') hover.value = null
}
const tip = computed(() => (hover.value == null ? null : props.points[hover.value]))
</script>

<template>
  <figure class="chart">
    <svg :viewBox="`0 0 ${W} ${H}`" role="img" tabindex="0" aria-label="Daily revenue from orders that are not cancelled. Use left and right arrow keys to inspect each day." @mousemove="onMove" @mouseleave="hover = null" @keydown="onKey" @blur="hover = null">
      <g class="grid">
        <g v-for="t in ticks" :key="t.v"><line :x1="PL" :x2="W - PR" :y1="t.y" :y2="t.y" /><text :x="PL - 8" :y="t.y + 4" text-anchor="end">{{ Math.round(t.v).toLocaleString('en-US') }}</text></g>
      </g>
      <path :d="area" class="area" />
      <path :d="line" class="line" />
      <g class="xl"><text v-for="l in xLabels" :key="l.i" :x="x(l.i)" :y="H - 8" :text-anchor="l.i === 0 ? 'start' : l.i === points.length - 1 ? 'end' : 'middle'">{{ l.t }}</text></g>
      <g v-if="tip && hover != null"><line class="cross" :x1="x(hover)" :x2="x(hover)" :y1="PT" :y2="H - PB" /><circle :cx="x(hover)" :cy="y(tip.value)" r="5" class="dot" /></g>
    </svg>
    <div v-if="tip && hover != null" class="tip" :style="{ left: `${(x(hover) / W) * 100}%` }" role="status"><strong>{{ formatMoney(tip.value) }}</strong><span>{{ label(tip.date) }}</span></div>
    <details class="tbl"><summary>View as table</summary>
      <table class="table" style="min-width: 0"><thead><tr><th>Date</th><th class="num">Revenue</th></tr></thead><tbody><tr v-for="p in points" :key="p.date"><td>{{ label(p.date) }}</td><td class="num">{{ formatMoney(p.value) }}</td></tr></tbody></table>
    </details>
  </figure>
</template>

<style scoped>
.chart { margin: 0; position: relative; }
svg { width: 100%; height: auto; display: block; border-radius: var(--radius); }
svg:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.grid line { stroke: var(--border); stroke-width: 1; } .grid text, .xl text { fill: var(--muted); font-size: 11px; font-family: var(--font-body); }
.line { fill: none; stroke: var(--brand); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.area { fill: var(--brand); opacity: 0.1; }
.cross { stroke: var(--muted-soft); stroke-dasharray: 3 3; }
.dot { fill: var(--brand); stroke: #fff; stroke-width: 2; }
.tip { position: absolute; top: 0; transform: translate(-50%, 0); background: var(--night); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 12.5px; display: flex; flex-direction: column; pointer-events: none; white-space: nowrap; }
.tip span { color: var(--on-night-muted); font-size: 11.5px; }
.tbl { margin-top: 12px; font-size: 13.5px; } .tbl summary { cursor: pointer; color: var(--brand); font-weight: 600; margin-bottom: 8px; }
</style>
