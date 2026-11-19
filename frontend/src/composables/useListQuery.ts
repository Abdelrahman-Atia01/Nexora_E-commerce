import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/** Search keyword + page for admin tables, kept in the URL so reloads and the back button work. */
export function useListQuery(extraKeys: string[] = []) {
  const route = useRoute()
  const router = useRouter()
  const one = (k: string) => { const v = route.query[k]; return String(Array.isArray(v) ? v[0] ?? '' : v ?? '') }
  const keyword = computed(() => one('q'))
  const page = computed(() => Math.max(1, parseInt(one('page'), 10) || 1))
  const extra = computed(() => Object.fromEntries(extraKeys.map((k) => [k, one(k)])))

  const update = (patch: Record<string, string | number | undefined>) => {
    const next: Record<string, string> = {}
    for (const k of ['q', 'page', ...extraKeys]) {
      const v = k in patch ? patch[k] : route.query[k]
      const s = Array.isArray(v) ? String(v[0] ?? '') : v == null ? '' : String(v)
      if (s && !(k === 'page' && s === '1')) next[k] = s
    }
    router.replace({ query: next })
  }
  const setKeyword = (q: string) => update({ q, page: 1 })
  const setPage = (p: number) => update({ page: p })
  const setExtra = (k: string, v: string) => update({ [k]: v, page: 1 })
  return { keyword, page, extra, setKeyword, setPage, setExtra }
}
