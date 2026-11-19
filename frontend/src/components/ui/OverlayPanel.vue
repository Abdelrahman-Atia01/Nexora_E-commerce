<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch, useId } from 'vue'
import { X } from 'lucide-vue-next'
import { useScrollLock } from '@vueuse/core'

const props = withDefaults(defineProps<{ open: boolean; title: string; side?: 'center' | 'left' | 'right'; width?: string; hideTitle?: boolean }>(), { side: 'center', width: '480px' })
const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const titleId = useId()
let opener: HTMLElement | null = null
const locked = useScrollLock(typeof document !== 'undefined' ? document.body : null)

const focusables = () =>
  Array.from(panel.value?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []).filter((el) => el.offsetParent !== null)

watch(() => props.open, async (o) => {
  if (o) {
    opener = document.activeElement as HTMLElement | null
    locked.value = true
    await nextTick()
    const f = focusables()
    ;(panel.value?.querySelector<HTMLElement>('[data-autofocus]') ?? f.find((e) => e.dataset.close === undefined) ?? f[0] ?? panel.value)?.focus()
  } else {
    locked.value = false
    opener?.focus?.()
  }
})
onBeforeUnmount(() => { locked.value = false })

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') { e.stopPropagation(); emit('close'); return }
  if (e.key !== 'Tab') return
  const f = focusables()
  if (!f.length) return
  const first = f[0]!, last = f[f.length - 1]!
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="ov">
      <div v-if="open" class="ov" :class="side" @keydown="onKey">
        <div class="backdrop" @click="emit('close')" />
        <div ref="panel" class="panel-box" role="dialog" aria-modal="true" :aria-labelledby="titleId" tabindex="-1" :style="{ '--w': width }">
          <header>
            <h2 :id="titleId" :class="{ 'sr-only': hideTitle }">{{ title }}</h2>
            <button type="button" class="icon-btn" data-close aria-label="Close" @click="emit('close')"><X :size="20" /></button>
          </header>
          <div class="body"><slot /></div>
          <footer v-if="$slots.footer"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ov { position: fixed; inset: 0; z-index: 100; display: flex; }
.backdrop { position: absolute; inset: 0; background: rgba(15, 22, 19, 0.55); }
.panel-box { position: relative; background: var(--surface); display: flex; flex-direction: column; max-height: 100%; outline: none; }
header { display: flex; justify-content: space-between; align-items: center; padding: 12px 12px 12px 20px; border-bottom: 1px solid var(--border); }
header h2 { font-size: 18px; }
.body { padding: 20px; overflow-y: auto; flex: 1; }
footer { padding: 14px 20px; border-top: 1px solid var(--border); display: flex; gap: 12px; justify-content: flex-end; flex-wrap: wrap; }
.center { align-items: center; justify-content: center; padding: 16px; }
.center .panel-box { width: min(var(--w), 100%); max-height: calc(100dvh - 32px); border-radius: var(--radius-lg); box-shadow: var(--shadow-pop); }
.left, .right { align-items: stretch; }
.left .panel-box, .right .panel-box { width: min(var(--w), 100vw); height: 100dvh; }
.right { justify-content: flex-end; }
.ov-enter-active, .ov-leave-active { transition: opacity 200ms var(--ease); }
.ov-enter-active .panel-box, .ov-leave-active .panel-box { transition: transform 220ms var(--ease), opacity 200ms; }
.ov-enter-from, .ov-leave-to { opacity: 0; }
.center.ov-enter-from .panel-box, .center.ov-leave-to .panel-box { transform: translateY(12px); }
.left.ov-enter-from .panel-box, .left.ov-leave-to .panel-box { transform: translateX(-100%); }
.right.ov-enter-from .panel-box, .right.ov-leave-to .panel-box { transform: translateX(100%); }
</style>
