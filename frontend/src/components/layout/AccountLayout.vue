<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { User, MapPin, ShieldCheck, Package, Heart, LogOut, LayoutDashboard } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useSessionActions } from '@/app/session'
const auth = useAuthStore()
const { logout } = useSessionActions()
const links = [
  { to: { name: 'profile' }, label: 'Profile', icon: User },
  { to: { name: 'orders' }, label: 'Orders', icon: Package },
  { to: { name: 'wishlist' }, label: 'Wishlist', icon: Heart },
  { to: { name: 'addresses' }, label: 'Addresses', icon: MapPin },
  { to: { name: 'security' }, label: 'Security', icon: ShieldCheck },
]
</script>
<template>
  <div class="container page acct">
    <aside>
      <div class="me"><strong class="truncate">{{ auth.user?.userName }}</strong><span class="muted truncate">{{ auth.user?.email }}</span></div>
      <nav aria-label="Account">
        <RouterLink v-for="l in links" :key="l.label" :to="l.to" :class="{ 'router-link-active': $route.name === l.to.name || ($route.name === 'order' && l.to.name === 'orders') }"><component :is="l.icon" :size="18" aria-hidden="true" />{{ l.label }}</RouterLink>
        <RouterLink v-if="auth.isAdmin" :to="{ name: 'admin-dashboard' }"><LayoutDashboard :size="18" aria-hidden="true" />Admin dashboard</RouterLink>
        <button type="button" @click="logout"><LogOut :size="18" aria-hidden="true" />Sign out</button>
      </nav>
    </aside>
    <section class="content"><RouterView /></section>
  </div>
</template>
<style scoped>
.acct { display: grid; gap: 24px; align-items: start; }
.me { display: flex; flex-direction: column; margin-bottom: 12px; font-size: 14px; }
.me span { font-size: 13px; }
nav { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; margin-inline: calc(var(--gutter) * -1); padding-inline: var(--gutter); scrollbar-width: thin; }
nav a, nav button { display: inline-flex; gap: 10px; align-items: center; min-height: 44px; padding: 0 14px; border-radius: var(--radius); border: 1px solid var(--border); background: var(--surface); font-weight: 500; font-size: 14.5px; white-space: nowrap; }
nav a.router-link-active { background: var(--ink); color: #fff; border-color: var(--ink); }
nav a:hover:not(.router-link-active), nav button:hover { border-color: var(--ink); }
.content { min-width: 0; }
@media (min-width: 900px) {
  .acct { grid-template-columns: 240px minmax(0, 1fr); gap: 56px; }
  aside { position: sticky; top: 112px; }
  nav { flex-direction: column; overflow: visible; margin: 0; padding: 0; }
  nav a, nav button { border: 0; background: transparent; width: 100%; }
  nav a.router-link-active { background: var(--brand-soft); color: var(--ink); font-weight: 700; }
  nav a:hover:not(.router-link-active), nav button:hover { background: rgba(23,33,29,0.06); }
}
</style>
