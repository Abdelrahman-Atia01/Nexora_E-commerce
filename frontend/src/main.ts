import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { setSessionEndHandler } from './lib/http'
import { useSessionActions } from './app/session'
import { useAuthStore } from './stores/auth'
import { useCatalogStore } from './stores/catalog'
import './assets/styles/base.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

const session = useSessionActions()
setSessionEndHandler(session.handleSessionEnd)

const auth = useAuthStore()
// Restore the session first so route guards know who the user is, then warm shared caches.
auth.init().then(async () => {
  useCatalogStore().load()
})

// Keep user-bound data in sync whenever the user changes (login, logout, session restore).
watch(() => auth.user?._id, (id, prev) => { if (id && id !== prev) session.loadUserData() })

app.mount('#app')
