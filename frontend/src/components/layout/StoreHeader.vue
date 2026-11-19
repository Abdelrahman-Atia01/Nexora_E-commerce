<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Search, Heart, ShoppingBag, User, Menu, ChevronDown, LogOut, Package, Shield, UserCog } from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'
import OverlayPanel from '@/components/ui/OverlayPanel.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useCatalogStore } from '@/stores/catalog'
import { useSessionActions } from '@/app/session'
import { useWishlistStore } from '@/stores/wishlist'

const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const catalog = useCatalogStore()
const route = useRoute()
const router = useRouter()

const menu = ref<'categories' | 'brands' | 'account' | null>(null)
const searchOpen = ref(false)
const navOpen = ref(false)
const q = ref('')
const root = ref<HTMLElement | null>(null)
onClickOutside(root, () => (menu.value = null))
watch(() => route.fullPath, () => { menu.value = null; navOpen.value = false; searchOpen.value = false })

const toggle = (m: 'categories' | 'brands' | 'account') => (menu.value = menu.value === m ? null : m)
const onEsc = () => (menu.value = null)

const submitSearch = (v: string) => {
  searchOpen.value = false
  router.push(v ? { name: 'search', query: { q: v } } : { name: 'products' })
}
const logout = async () => {
  menu.value = null
  navOpen.value = false
  await useSessionActions().logout()
}
const initials = computed(() => (auth.user?.userName ?? '?').slice(0, 1).toUpperCase())
const wishlistTarget = computed(() => (auth.isAuthed ? { name: 'wishlist' } : { name: 'login', query: { redirect: '/account/wishlist' } }))
</script>

<template>
  <header class="site-header" ref="root" @keydown.esc="onEsc">
    <div class="topbar"><div class="container"><span>Cash on delivery available on every order</span></div></div>
    <div class="container bar">
      <button type="button" class="icon-btn only-mobile" aria-label="Open menu" @click="navOpen = true"><Menu :size="22" /></button>
      <RouterLink to="/" class="logo" aria-label="NEXORA home">NEXORA</RouterLink>

      <nav class="main-nav" aria-label="Main">
        <RouterLink :to="{ name: 'products' }" class="nav-link" exact-active-class="">Shop</RouterLink>
        <div class="dd">
          <button type="button" class="nav-link" :aria-expanded="menu === 'categories'" aria-haspopup="true" @click="toggle('categories')">Categories <ChevronDown :size="14" /></button>
          <div v-if="menu === 'categories'" class="dd-menu">
            <p v-if="!catalog.categories.length" class="dd-empty">No categories yet</p>
            <RouterLink v-for="c in catalog.categories" :key="c._id" :to="{ name: 'category', params: { id: c._id } }">{{ c.name }}</RouterLink>
          </div>
        </div>
        <div v-if="catalog.brands.length" class="dd">
          <button type="button" class="nav-link" :aria-expanded="menu === 'brands'" aria-haspopup="true" @click="toggle('brands')">Brands <ChevronDown :size="14" /></button>
          <div v-if="menu === 'brands'" class="dd-menu">
            <RouterLink v-for="b in catalog.brands" :key="b._id" :to="{ name: 'brand', params: { id: b._id } }">{{ b.name }}</RouterLink>
          </div>
        </div>
        <RouterLink :to="{ name: 'products', query: { onSale: '1' } }" class="nav-link sale">Sale</RouterLink>
      </nav>

      <div class="actions">
        <button type="button" class="icon-btn" aria-label="Search" @click="searchOpen = true"><Search :size="20" /></button>
        <RouterLink :to="wishlistTarget" class="icon-btn hide-xs" aria-label="Wishlist">
          <Heart :size="20" /><span v-if="wishlist.ids.size" class="count" aria-hidden="true">{{ wishlist.ids.size }}</span>
        </RouterLink>
        <div class="dd account">
          <RouterLink v-if="!auth.isAuthed" :to="{ name: 'login' }" class="icon-btn" aria-label="Sign in"><User :size="20" /></RouterLink>
          <template v-else>
            <button type="button" class="icon-btn avatar" :aria-expanded="menu === 'account'" aria-haspopup="true" aria-label="Account menu" @click="toggle('account')"><span>{{ initials }}</span></button>
            <div v-if="menu === 'account'" class="dd-menu right">
              <div class="who"><strong class="truncate">{{ auth.user?.userName }}</strong><span class="muted truncate">{{ auth.user?.email }}</span></div>
              <RouterLink :to="{ name: 'profile' }"><UserCog :size="16" /> My account</RouterLink>
              <RouterLink :to="{ name: 'orders' }"><Package :size="16" /> Orders</RouterLink>
              <RouterLink :to="{ name: 'wishlist' }"><Heart :size="16" /> Wishlist</RouterLink>
              <RouterLink v-if="auth.isAdmin" :to="{ name: 'admin-dashboard' }"><Shield :size="16" /> Admin dashboard</RouterLink>
              <button type="button" @click="logout"><LogOut :size="16" /> Sign out</button>
            </div>
          </template>
        </div>
        <RouterLink v-if="!auth.isAdmin" :to="{ name: 'cart' }" class="icon-btn" :aria-label="`Cart, ${cart.count} item${cart.count === 1 ? '' : 's'}`">
          <ShoppingBag :size="20" /><span v-if="cart.count" class="count" aria-hidden="true">{{ cart.count > 99 ? '99+' : cart.count }}</span>
        </RouterLink>
      </div>
    </div>

    <OverlayPanel :open="searchOpen" title="Search" side="center" width="640px" hide-title @close="searchOpen = false">
      <SearchInput v-model="q" label="Search products" placeholder="Search by name or description" :debounce="9999" @submit="submitSearch" data-autofocus />
      <p class="muted" style="margin-top: 12px; font-size: 13px">Press Enter to search the catalog.</p>
    </OverlayPanel>

    <OverlayPanel :open="navOpen" title="Menu" side="left" width="320px" @close="navOpen = false">
      <nav class="mnav" aria-label="Mobile">
        <RouterLink :to="{ name: 'products' }">Shop all</RouterLink>
        <RouterLink :to="{ name: 'products', query: { onSale: '1' } }">Sale</RouterLink>
        <h3>Categories</h3>
        <RouterLink v-for="c in catalog.categories" :key="c._id" :to="{ name: 'category', params: { id: c.id ?? c._id } }" class="sub">{{ c.name }}</RouterLink>
        <template v-if="catalog.brands.length"><h3>Brands</h3>
          <RouterLink v-for="b in catalog.brands" :key="b._id" :to="{ name: 'brand', params: { id: b._id } }" class="sub">{{ b.name }}</RouterLink></template>
        <hr class="divider" />
        <template v-if="auth.isAuthed">
          <RouterLink :to="{ name: 'profile' }">My account</RouterLink>
          <RouterLink :to="{ name: 'orders' }">Orders</RouterLink>
          <RouterLink :to="wishlistTarget">Wishlist</RouterLink>
          <RouterLink v-if="auth.isAdmin" :to="{ name: 'admin-dashboard' }">Admin dashboard</RouterLink>
          <button type="button" @click="logout">Sign out</button>
        </template>
        <template v-else>
          <RouterLink :to="{ name: 'login' }">Sign in</RouterLink>
          <RouterLink :to="{ name: 'register' }">Create account</RouterLink>
        </template>
      </nav>
    </OverlayPanel>
  </header>
</template>

<style scoped>
.site-header { position: sticky; top: 0; z-index: 50; background: var(--surface); border-bottom: 1px solid var(--border); }
.topbar { background: var(--night); color: var(--on-night); font-size: 12.5px; text-align: center; padding: 7px 0; letter-spacing: 0.02em; }
.bar { display: flex; align-items: center; gap: 8px; min-height: 64px; }
.logo { font: 800 20px/1 var(--font-display); letter-spacing: 0.28em; margin-right: auto; padding: 8px 4px; }
.main-nav { display: none; align-items: center; gap: 4px; position: absolute; left: 50%; transform: translateX(-50%); }
.nav-link { display: inline-flex; align-items: center; gap: 4px; padding: 10px 14px; font-weight: 500; font-size: 14.5px; border: 0; background: none; border-radius: var(--radius); }
.nav-link:hover, .nav-link[aria-expanded='true'] { background: rgba(23,33,29,0.06); }
.nav-link.router-link-active:not(.sale) { font-weight: 700; }
.nav-link.sale { color: var(--accent-ink); font-weight: 700; }
.actions { display: flex; align-items: center; gap: 2px; }
.dd { position: relative; }
.dd-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 220px; max-height: 70vh; overflow-y: auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-pop); padding: 6px; z-index: 60; display: flex; flex-direction: column; }
.dd-menu.right { left: auto; right: 0; min-width: 240px; }
.dd-menu a, .dd-menu button { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 6px; font-size: 14px; border: 0; background: none; text-align: left; width: 100%; }
.dd-menu a:hover, .dd-menu button:hover { background: #F0F1ED; }
.dd-empty { padding: 10px 12px; color: var(--muted); font-size: 13px; }
.who { display: flex; flex-direction: column; padding: 8px 12px 10px; border-bottom: 1px solid var(--border); margin-bottom: 4px; font-size: 13.5px; }
.who span { font-size: 12.5px; }
.count { position: absolute; top: 4px; right: 2px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: var(--brand); color: #fff; font-size: 11px; font-weight: 700; display: grid; place-items: center; line-height: 1; }
.avatar span { width: 32px; height: 32px; border-radius: 999px; background: var(--brand); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 14px; }
.mnav { display: flex; flex-direction: column; }
.mnav a, .mnav button { padding: 13px 4px; font-weight: 600; border: 0; background: none; text-align: left; font-size: 16px; }
.mnav .sub { font-weight: 400; padding: 9px 4px 9px 14px; font-size: 15px; }
.mnav h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin: 18px 0 4px; font-family: var(--font-body); }
.mnav hr { margin: 14px 0; }
@media (min-width: 1024px) { .main-nav { display: flex; } .only-mobile { display: none; } .logo { margin-right: auto; } }
@media (max-width: 1023px) { .logo { margin-right: auto; margin-left: 0; } .bar { gap: 0; } }
@media (max-width: 479px) { .hide-xs { display: none; } .topbar { font-size: 12px; } }
</style>
