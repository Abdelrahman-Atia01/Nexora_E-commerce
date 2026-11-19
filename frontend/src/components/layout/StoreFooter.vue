<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCatalogStore } from '@/stores/catalog'
const auth = useAuthStore()
const catalog = useCatalogStore()
</script>
<template>
  <footer class="foot on-dark">
    <div class="container grid">
      <div class="brand">
        <p class="logo">NEXORA</p>
        <p class="muted-n">Premium everyday clothing and accessories.</p>
        <p class="pay"><strong>Payment:</strong> cash on delivery is the only payment method available right now.</p>
      </div>
      <nav aria-label="Shop">
        <h2>Shop</h2>
        <RouterLink :to="{ name: 'products' }">All products</RouterLink>
        <RouterLink :to="{ name: 'products', query: { onSale: '1' } }">Sale</RouterLink>
        <RouterLink v-for="c in catalog.categories.slice(0, 4)" :key="c._id" :to="{ name: 'category', params: { id: c._id } }">{{ c.name }}</RouterLink>
      </nav>
      <nav aria-label="Account">
        <h2>Account</h2>
        <template v-if="auth.isAuthed">
          <RouterLink :to="{ name: 'profile' }">My account</RouterLink>
          <RouterLink :to="{ name: 'orders' }">Orders</RouterLink>
          <RouterLink :to="{ name: 'wishlist' }">Wishlist</RouterLink>
        </template>
        <template v-else>
          <RouterLink :to="{ name: 'login' }">Sign in</RouterLink>
          <RouterLink :to="{ name: 'register' }">Create account</RouterLink>
          <RouterLink :to="{ name: 'forgot-password' }">Forgot password</RouterLink>
        </template>
        <RouterLink :to="{ name: 'cart' }" v-if="!auth.isAdmin">Cart</RouterLink>
      </nav>
    </div>
    <div class="container legal"><span>© {{ new Date().getFullYear() }} NEXORA. All rights reserved.</span></div>
  </footer>
</template>
<style scoped>
.foot { background: var(--night); color: var(--on-night); padding-top: var(--s8); margin-top: var(--s8); }
.grid { display: grid; gap: var(--s6); grid-template-columns: 1fr 1fr; }
.brand { grid-column: 1 / -1; max-width: 420px; }
.logo { font: 800 22px/1 var(--font-display); letter-spacing: 0.28em; margin-bottom: 14px; }
.muted-n { color: var(--on-night-muted); margin-bottom: 14px; }
.pay { font-size: 13.5px; color: var(--on-night-muted); border-left: 2px solid var(--accent); padding-left: 12px; }
.pay strong { color: var(--on-night); }
nav { display: flex; flex-direction: column; gap: 10px; }
h2 { font: 600 12px/1 var(--font-body); letter-spacing: 0.14em; text-transform: uppercase; color: var(--on-night-muted); margin-bottom: 6px; }
nav a { color: var(--on-night); font-size: 14.5px; width: fit-content; }
nav a:hover { text-decoration: underline; text-underline-offset: 3px; }
.legal { margin-top: var(--s7); padding-block: 20px; border-top: 1px solid var(--night-3); color: var(--on-night-muted); font-size: 13px; }
@media (min-width: 768px) { .grid { grid-template-columns: 2fr 1fr 1fr; } .brand { grid-column: auto; } }
</style>
