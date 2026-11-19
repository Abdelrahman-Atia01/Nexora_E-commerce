<script setup lang="ts">
import { computed } from 'vue'
import { Clock, CheckCircle2, XCircle } from 'lucide-vue-next'
import type { OrderStatus } from '@/types/api'
const props = defineProps<{ status: OrderStatus }>()
const icon = computed(() => ({ pending: Clock, delivered: CheckCircle2, cancelled: XCircle }[props.status]))
const label = computed(() => ({ pending: 'Pending', delivered: 'Delivered', cancelled: 'Cancelled' }[props.status]))
</script>
<template><span :class="['badge', `badge-${status}`]"><component :is="icon" :size="13" aria-hidden="true" />{{ label }}</span></template>
