import { watchEffect, type MaybeRefOrGetter, toValue } from 'vue'

export const useDocumentTitle = (title: MaybeRefOrGetter<string | undefined>) =>
  watchEffect(() => { document.title = toValue(title) ? `${toValue(title)} — NEXORA` : 'NEXORA' })
