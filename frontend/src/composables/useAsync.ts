import { onScopeDispose, ref, shallowRef, watch, type WatchSource } from 'vue'
import { isCancelled, toApiError, type ApiError } from '@/lib/errors'

/**
 * Small server-data helper: loading / error / data state, cancels the previous request when the
 * inputs change, and exposes `reload()` for retry buttons.
 */
export function useAsync<T>(fetcher: (signal: AbortSignal) => Promise<T>, sources: WatchSource[] = [], opts: { immediate?: boolean } = {}) {
  const data = shallowRef<T | null>(null)
  const error = ref<ApiError | null>(null)
  const loading = ref(false)
  let controller: AbortController | null = null
  let run = 0

  const reload = async () => {
    controller?.abort()
    controller = new AbortController()
    const id = ++run
    loading.value = true
    error.value = null
    try {
      const res = await fetcher(controller.signal)
      if (id === run) data.value = res
    } catch (e) {
      if (id === run && !isCancelled(e)) error.value = toApiError(e)
    } finally {
      if (id === run) loading.value = false
    }
  }

  if (sources.length) watch(sources, reload)
  if (opts.immediate !== false) reload()
  onScopeDispose(() => { controller?.abort(); run++ })

  return { data, error, loading, reload }
}
