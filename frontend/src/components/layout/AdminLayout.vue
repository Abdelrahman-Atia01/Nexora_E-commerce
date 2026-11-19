<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { LayoutDashboard, Package, Tags, Layers, BadgeCheck, ClipboardList, Ticket, Users, MessageSquare, Store, LogOut, Menu, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useSessionActions } from '@/app/session'

const auth = useAuthStore()
const route = useRoute()
const { logout } = useSessionActions()
const open = ref(false)
watch(() => route.fullPath, () => { open.value = false })

type NavItem = { to: string; label: string; icon: unknown; exact?: boolean }
const groups: { title: string; items: NavItem[] }[] = [
  { title: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true }] },
  {
    title: 'Catalog',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/categories', label: 'Categories', icon: Tags },
      { to: '/admin/subcategories', label: 'Subcategories', icon: Layers },
      { to: '/admin/brands', label: 'Brands', icon: BadgeCheck },
    ],
  },
  {
    title: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
      { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
      { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
    ],
  },
  { title: 'People', items: [{ to: '/admin/users', label: 'Users', icon: Users }] },
]
const active = (to: string, exact?: boolean) => (exact ? route.path === to : route.path === to || route.path.startsWith(to + '/'))
</script>

<template>
  <div class="shell">
    <a href="#admin-main" class="skip">Skip to content</a>
    <header class="bar">
      <button type="button" class="icon-btn menu" :aria-expanded="open" aria-controls="admin-nav" aria-label="Toggle navigation" @click="open = !open"><X v-if="open" :size="20" /><Menu v-else :size="20" /></button>
      <RouterLink to="/admin" class="logo">NEXORA <span>Admin</span></RouterLink>
    </header>
    <aside id="admin-nav" :class="{ open }">
      <RouterLink to="/admin" class="logo big">NEXORA <span>Admin</span></RouterLink>
      <nav aria-label="Admin">
        <div v-for="g in groups" :key="g.title" class="grp">
          <p class="gt">{{ g.title }}</p>
          <RouterLink v-for="i in g.items" :key="i.to" :to="i.to" :class="{ on: active(i.to, i.exact) }" :aria-current="active(i.to, i.exact) ? 'page' : undefined"><component :is="i.icon as never" :size="18" aria-hidden="true" />{{ i.label }}</RouterLink>
        </div>
      </nav>
      <div class="foot">
        <div class="who"><strong class="truncate">{{ auth.user?.userName }}</strong><span class="truncate">{{ auth.user?.email }}</span></div>
        <RouterLink to="/"><Store :size="18" aria-hidden="true" />View storefront</RouterLink>
        <button type="button" @click="logout"><LogOut :size="18" aria-hidden="true" />Sign out</button>
      </div>
    </aside>
    <div v-if="open" class="scrim" @click="open = false" />
    <main id="admin-main" tabindex="-1"><RouterView /></main>
  </div>
</template>

<style scoped>
.shell { min-height: 100vh; background: var(--canvas); }
.skip { position: absolute; left: -9999px; top: 8px; z-index: 100; background: #fff; padding: 8px 12px; border-radius: 6px; }
.skip:focus { left: 8px; }
.bar { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 8px; height: 56px; padding: 0 8px; background: var(--night); color: var(--on-night); }
.logo { font: 800 16px/1 var(--font-display); letter-spacing: 0.22em; color: var(--on-night); }
.logo span { font-weight: 500; letter-spacing: 0.06em; color: var(--on-night-muted); margin-left: 6px; font-size: 13px; }
.menu { color: var(--on-night); } .menu:hover { background: rgba(255,255,255,0.1); }
aside { position: fixed; z-index: 40; inset: 0 auto 0 0; width: 264px; max-width: 86vw; background: var(--night); color: var(--on-night); display: flex; flex-direction: column; padding: 20px 12px; transform: translateX(-100%); transition: transform var(--t) var(--ease); overflow-y: auto; }
aside.open { transform: none; }
.big { display: block; padding: 4px 12px 20px; }
.scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 35; }
nav { flex: 1; }
.grp { margin-bottom: 18px; }
.gt { padding: 0 12px; margin: 0 0 6px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--on-night-muted); font-weight: 600; }
aside a, aside button:not(.icon-btn) { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 44px; padding: 0 12px; border-radius: var(--radius); border: 0; background: transparent; color: #D5DBD6; font-weight: 500; font-size: 14.5px; text-align: left; }
aside nav a:hover, .foot a:hover, .foot button:hover { background: var(--night-3); color: #fff; }
aside nav a.on { background: var(--brand); color: #fff; font-weight: 700; }
.foot { border-top: 1px solid var(--night-3); padding-top: 12px; display: flex; flex-direction: column; gap: 2px; }
.who { display: flex; flex-direction: column; padding: 0 12px 10px; font-size: 13.5px; } .who span { color: var(--on-night-muted); font-size: 12.5px; }
main { padding: 24px var(--gutter) 64px; min-width: 0; outline: none; }
@media (min-width: 1024px) {
  .bar, .scrim { display: none; }
  aside { transform: none; width: 248px; }
  main { margin-left: 248px; padding: 32px 40px 80px; max-width: 1400px; }
}
</style>
