import { ref } from 'vue'
import { toApiError } from '@/lib/errors'

/** Wraps a submit handler: tracks submitting state, pushes backend field errors into the form and keeps a form-level message. */
export function useSubmit(setFieldErrors?: (e: Record<string, string>) => void) {
  const submitting = ref(false)
  const formError = ref('')

  const run = async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (submitting.value) return
    submitting.value = true
    formError.value = ''
    try {
      return await fn()
    } catch (e) {
      const err = toApiError(e)
      const keys = Object.keys(err.fieldErrors)
      if (keys.length && setFieldErrors) setFieldErrors(err.fieldErrors)
      formError.value = keys.length && setFieldErrors ? '' : err.message
      if (keys.length && !setFieldErrors) formError.value = err.message
      return undefined
    } finally {
      submitting.value = false
    }
  }
  return { submitting, formError, run }
}
