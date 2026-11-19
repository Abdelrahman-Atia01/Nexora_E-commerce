import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useUiStore } from '@/stores/ui'
import { router } from '@/router'

/** Everything that must happen when a session starts or ends, in one place. */
export const useSessionActions = () => {
  const auth = useAuthStore()
  const cart = useCartStore()
  const wishlist = useWishlistStore()
  const ui = useUiStore()

  const clearUserState = () => { auth.reset(); cart.reset(); wishlist.reset() }

  /** Loads user-bound data (cart, wishlist) after login or session restore. Failures are non-fatal. */
  const loadUserData = async () => {
    const jobs: Promise<unknown>[] = [wishlist.fetch()]
    if (auth.isCustomer) jobs.push(cart.fetch())
    await Promise.allSettled(jobs)
  }

  const logout = async () => {
    clearUserState()
    ui.info('You have been signed out.')
    if (router.currentRoute.value.meta.requiresAuth || router.currentRoute.value.meta.requiresAdmin) await router.replace({ name: 'home' })
  }

  const handleSessionEnd = (reason: 'expired' | 'deactivated') => {
    if (!auth.token) return // already signed out; avoids redirect loops from parallel 401s
    const current = router.currentRoute.value
    clearUserState()
    ui.error(reason === 'deactivated' ? 'This account has been deactivated.' : 'Your session has expired. Please sign in again.')
    if (current.meta.requiresAuth || current.meta.requiresAdmin) router.replace({ name: 'login', query: { redirect: current.fullPath } })
  }

  return { logout, loadUserData, handleSessionEnd, clearUserState }
}
