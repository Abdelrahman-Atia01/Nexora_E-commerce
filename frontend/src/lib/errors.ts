import axios from 'axios'

export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string>
  isNetwork: boolean
  constructor(message: string, status = 0, fieldErrors: Record<string, string> = {}, isNetwork = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.isNetwork = isNetwork
  }
}

interface ErrorBody { message?: string; errors?: { field?: string; message?: string }[] }

/** Converts any thrown value into an ApiError, keeping per-field validation messages. */
export const toApiError = (err: unknown): ApiError => {
  if (err instanceof ApiError) return err
  if (axios.isCancel(err)) return new ApiError('Request cancelled', 0)
  if (axios.isAxiosError(err)) {
    if (!err.response) return new ApiError('Cannot reach the server. Check your connection and try again.', 0, {}, true)
    const body = (err.response.data ?? {}) as ErrorBody
    const fieldErrors: Record<string, string> = {}
    for (const e of body.errors ?? []) if (e.field && e.message && !(e.field in fieldErrors)) fieldErrors[e.field] = e.message
    const fallback = err.response.status >= 500 ? 'Something went wrong on our side. Please try again.' : 'Request failed.'
    return new ApiError(typeof body.message === 'string' && body.message ? body.message : fallback, err.response.status, fieldErrors)
  }
  return new ApiError(err instanceof Error ? err.message : 'Unexpected error')
}

export const errorMessage = (err: unknown): string => toApiError(err).message
export const isCancelled = (err: unknown): boolean => axios.isCancel(err)
