<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import OverlayPanel from './OverlayPanel.vue'
import BaseButton from './BaseButton.vue'

const ui = useUiStore()
const s = computed(() => ui.confirmState)
</script>
<template>
  <OverlayPanel :open="!!s" :title="s?.title ?? ''" width="440px" @close="ui.settleConfirm(false)">
    <p>{{ s?.message }}</p>
    <template #footer>
      <BaseButton variant="secondary" @click="ui.settleConfirm(false)">Cancel</BaseButton>
      <BaseButton :variant="s?.danger ? 'danger' : 'primary'" data-autofocus @click="ui.settleConfirm(true)">{{ s?.confirmLabel ?? 'Confirm' }}</BaseButton>
    </template>
  </OverlayPanel>
</template>
