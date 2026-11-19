import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import StoreLayout from '@/components/layout/StoreLayout.vue'

declare module 'vue-router' {
  interface RouteMeta { requiresAuth?: boolean; requiresAdmin?: boolean; guestOnly?: boolean; title?: string }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: StoreLayout,
    children: [
      { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
      { path: 'products', name: 'products', component: () => import('@/views/CatalogView.vue'), props: { scope: 'all' }, meta: { title: 'Shop' } },
      { path: 'search', name: 'search', component: () => import('@/views/CatalogView.vue'), props: { scope: 'search' }, meta: { title: 'Search' } },
      { path: 'categories/:id', name: 'category', component: () => import('@/views/CatalogView.vue'), props: (r) => ({ scope: 'category', scopeId: r.params.id }) },
      { path: 'brands/:id', name: 'brand', component: () => import('@/views/CatalogView.vue'), props: (r) => ({ scope: 'brand', scopeId: r.params.id }) },
      { path: 'products/:id', name: 'product', component: () => import('@/views/ProductView.vue'), props: true },
      { path: 'cart', name: 'cart', component: () => import('@/views/CartView.vue'), meta: { title: 'Cart' } },
      { path: 'checkout', name: 'checkout', component: () => import('@/views/CheckoutView.vue'), meta: { requiresAuth: true, title: 'Checkout' } },
      { path: 'checkout/confirmation/:id', name: 'order-confirmation', component: () => import('@/views/OrderConfirmationView.vue'), props: true, meta: { requiresAuth: true, title: 'Order confirmed' } },

      { path: 'account/login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { guestOnly: true, title: 'Sign in' } },
      { path: 'account/register', name: 'register', component: () => import('@/views/auth/RegisterView.vue'), meta: { guestOnly: true, title: 'Create account' } },
      { path: 'account/verify-email', name: 'verify-email', component: () => import('@/views/auth/VerifyEmailView.vue'), meta: { title: 'Confirm your email' } },
      { path: 'account/confirm-email/:token', name: 'confirm-email', component: () => import('@/views/auth/VerifyEmailView.vue'), props: true, meta: { title: 'Confirm your email' } },
      { path: 'account/forgot-password', name: 'forgot-password', component: () => import('@/views/auth/ForgotPasswordView.vue'), meta: { guestOnly: true, title: 'Reset password' } },

      {
        path: 'account',
        component: () => import('@/components/layout/AccountLayout.vue'),
        meta: { requiresAuth: true },
        children: [
          { path: '', name: 'profile', component: () => import('@/views/account/ProfileView.vue'), meta: { title: 'My account' } },
          { path: 'addresses', name: 'addresses', component: () => import('@/views/account/AddressesView.vue'), meta: { title: 'Addresses' } },
          { path: 'security', name: 'security', component: () => import('@/views/account/SecurityView.vue'), meta: { title: 'Security' } },
          { path: 'orders', name: 'orders', component: () => import('@/views/account/OrdersView.vue'), meta: { title: 'Orders' } },
          { path: 'orders/:id', name: 'order', component: () => import('@/views/account/OrderDetailView.vue'), props: true, meta: { title: 'Order' } },
          { path: 'wishlist', name: 'wishlist', component: () => import('@/views/account/WishlistView.vue'), meta: { title: 'Wishlist' } },
        ],
      },
      { path: 'forbidden', name: 'forbidden', component: () => import('@/views/ForbiddenView.vue'), meta: { title: 'Access denied' } },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/components/layout/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue'), meta: { title: 'Dashboard' } },
      { path: 'products', name: 'admin-products', component: () => import('@/views/admin/ProductsView.vue'), meta: { title: 'Products' } },
      { path: 'products/new', name: 'admin-product-new', component: () => import('@/views/admin/ProductFormView.vue'), meta: { title: 'New product' } },
      { path: 'products/:id/edit', name: 'admin-product-edit', component: () => import('@/views/admin/ProductFormView.vue'), props: true, meta: { title: 'Edit product' } },
      { path: 'categories', name: 'admin-categories', component: () => import('@/views/admin/CategoriesView.vue'), meta: { title: 'Categories' } },
      { path: 'subcategories', name: 'admin-subcategories', component: () => import('@/views/admin/SubCategoriesView.vue'), meta: { title: 'Subcategories' } },
      { path: 'brands', name: 'admin-brands', component: () => import('@/views/admin/BrandsView.vue'), meta: { title: 'Brands' } },
      { path: 'orders', name: 'admin-orders', component: () => import('@/views/admin/OrdersView.vue'), meta: { title: 'Orders' } },
      { path: 'orders/:id', name: 'admin-order', component: () => import('@/views/admin/OrderDetailView.vue'), props: true, meta: { title: 'Order' } },
      { path: 'coupons', name: 'admin-coupons', component: () => import('@/views/admin/CouponsView.vue'), meta: { title: 'Coupons' } },
      { path: 'users', name: 'admin-users', component: () => import('@/views/admin/UsersView.vue'), meta: { title: 'Users' } },
      { path: 'reviews', name: 'admin-reviews', component: () => import('@/views/admin/ReviewsView.vue'), meta: { title: 'Reviews' } },
    ],
  },
  { path: '/:pathMatch(.*)*', component: StoreLayout, children: [{ path: '', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { title: 'Page not found' } }] },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => {
    if (saved) return saved
    if (to.path === from.path) return false // filter/pagination changes keep their own scroll handling
    return { top: 0 }
  },
})

/** Only allow same-site relative redirects (prevents open-redirect via ?redirect=). */
export const safeRedirect = (value: unknown, fallback = '/'): string => {
  const v = Array.isArray(value) ? value[0] : value
  return typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') && !v.includes('\\') ? v : fallback
}

// Route guards are a UX measure only: the backend enforces every permission.
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.ready) await auth.init()
  if (to.meta.requiresAuth || to.matched.some((r) => r.meta.requiresAuth)) {
    if (!auth.isAuthed) return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.matched.some((r) => r.meta.requiresAdmin)) {
    if (!auth.isAuthed) return { name: 'login', query: { redirect: to.fullPath } }
    if (!auth.isAdmin) return { name: 'forbidden' }
  }
  if (to.meta.guestOnly && auth.isAuthed) return safeRedirect(to.query.redirect, auth.isAdmin ? '/admin' : '/account')
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} — NEXORA` : 'NEXORA'
})
