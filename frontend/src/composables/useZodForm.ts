import type { Ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import type { z } from 'zod'

/**
 * Thin wrapper around vee-validate + Zod:
 *  - `bind(name)` returns props/events for TextField, SelectField, TextAreaField (value, error, blur)
 *  - validation messages appear after the first blur/submit and then update live
 *  - `applyServerErrors` pushes backend `{field, message}` errors next to the right inputs
 */
export function useZodForm<S extends z.ZodTypeAny>(schema: S, initial: z.input<S> & Record<string, unknown>, fieldMap: Record<string, string> = {}) {
  const form = useForm({ validationSchema: toTypedSchema(schema) as never, initialValues: initial as never })
  const refs: Record<string, Ref<unknown>> = {}
  for (const key of Object.keys(initial)) {
    refs[key] = form.defineField(key as never, { validateOnModelUpdate: (s: { errors: string[] }) => s.errors.length > 0 } as never)[0] as Ref<unknown>
  }
  const errs = () => form.errors.value as Record<string, string | undefined>

  const bind = (name: keyof z.input<S> & string) => ({
    modelValue: refs[name]!.value as string,
    'onUpdate:modelValue': (v: string) => { refs[name]!.value = v },
    error: errs()[name],
    onBlur: () => { void form.validateField(name as never) },
  })

  const applyServerErrors = (fieldErrors: Record<string, string>) => {
    const mapped: Record<string, string> = {}
    for (const [k, v] of Object.entries(fieldErrors)) {
      const key = fieldMap[k] ?? k.split('.').pop() ?? k
      if (key in refs) mapped[key] = v
    }
    form.setErrors(mapped as never)
    return Object.keys(mapped).length > 0
  }

  const set = (name: string, value: unknown) => { if (refs[name]) refs[name].value = value }
  const get = <T = unknown>(name: string) => refs[name]?.value as T

  return { form, bind, set, get, applyServerErrors, handleSubmit: (cb: (values: z.output<S>) => unknown) => form.handleSubmit(cb as never), errors: form.errors, resetForm: (state?: { values?: Partial<z.input<S>> }) => form.resetForm(state as never), values: form.values as unknown as z.input<S> }
}
