import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastKind = 'success' | 'error' | 'info'
export interface Toast { id: number; kind: ToastKind; message: string; action?: { label: string; to: string } }
export interface ConfirmOptions { title: string; message: string; confirmLabel?: string; danger?: boolean }

let seq = 0

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])
  const confirmState = ref<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null)

  const dismiss = (id: number) => { toasts.value = toasts.value.filter((t) => t.id !== id) }
  const toast = (kind: ToastKind, message: string, action?: Toast['action']) => {
    const id = ++seq
    toasts.value = [...toasts.value.slice(-3), { id, kind, message, action }]
    setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4500)
    return id
  }
  const success = (m: string, action?: Toast['action']) => toast('success', m, action)
  const error = (m: string) => toast('error', m)
  const info = (m: string) => toast('info', m)

  const confirm = (opts: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      confirmState.value?.resolve(false)
      confirmState.value = { ...opts, resolve }
    })
  const settleConfirm = (value: boolean) => {
    confirmState.value?.resolve(value)
    confirmState.value = null
  }

  return { toasts, confirmState, toast, success, error, info, dismiss, confirm, settleConfirm }
})
