<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()
</script>
<template>
  <div class="toasts" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="t">
      <div v-for="t in ui.toasts" :key="t.id" class="toast" :class="t.kind" :role="t.kind === 'error' ? 'alert' : 'status'">
        <CheckCircle2 v-if="t.kind === 'success'" :size="18" aria-hidden="true" /><AlertCircle v-else-if="t.kind === 'error'" :size="18" aria-hidden="true" /><Info v-else :size="18" aria-hidden="true" />
        <span class="msg">{{ t.message }}</span>
        <RouterLink v-if="t.action" :to="t.action.to" class="act" @click="ui.dismiss(t.id)">{{ t.action.label }}</RouterLink>
        <button type="button" class="x" aria-label="Dismiss notification" @click="ui.dismiss(t.id)"><X :size="16" /></button>
      </div>
    </TransitionGroup>
  </div>
</template>
<style scoped>
.toasts { position: fixed; z-index: 200; right: 16px; bottom: 16px; left: 16px; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; pointer-events: none; }
.toast { pointer-events: auto; display: flex; align-items: center; gap: 10px; background: var(--night-2); color: #fff; padding: 12px 8px 12px 14px; border-radius: var(--radius); box-shadow: var(--shadow-pop); max-width: 460px; width: 100%; font-size: 14px; border-left: 4px solid #8FD3BD; }
.toast.error { border-left-color: #F28B82; }
.toast.info { border-left-color: #9DB8F0; }
.msg { flex: 1; min-width: 0; }
.act { font-weight: 700; text-decoration: underline; text-underline-offset: 3px; white-space: nowrap; }
.x { width: 32px; height: 32px; display: grid; place-items: center; border: 0; background: transparent; color: #C9D2CB; border-radius: 6px; }
.x:hover { background: rgba(255,255,255,0.12); }
.t-enter-active, .t-leave-active { transition: all 220ms var(--ease); }
.t-enter-from, .t-leave-to { opacity: 0; transform: translateY(10px); }
@media (min-width: 640px) { .toasts { left: auto; } }
</style>
