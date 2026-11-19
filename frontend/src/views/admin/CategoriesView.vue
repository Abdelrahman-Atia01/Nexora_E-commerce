<script setup lang="ts">
import NamedImageCrud from '@/features/admin/components/NamedImageCrud.vue'
import { categoriesApi } from '@/features/categories/api'
</script>
<template><NamedImageCrud singular="Category" plural="Categories" :min-name="3" :max-name="35" :api="categoriesApi" delete-warning="Its subcategories are deleted too. A category that still has products cannot be deleted." /></template>
