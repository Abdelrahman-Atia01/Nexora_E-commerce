<script setup lang="ts">
import NamedImageCrud from '@/features/admin/components/NamedImageCrud.vue'
import { brandsApi } from '@/features/brands/api'
</script>
<template><NamedImageCrud singular="Brand" plural="Brands" :min-name="2" :max-name="35" :api="brandsApi" delete-warning="A brand that still has products cannot be deleted." /></template>
