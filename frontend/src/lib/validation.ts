import { z } from 'zod'

// Mirrors the backend express-validator rules so users get instant feedback; the backend stays authoritative.
export const phoneRule = z.string().trim().regex(/^[0-9+\-\s]{7,16}$/, 'Enter a valid phone number (7–16 digits)')
export const optionalPhone = z.string().trim().refine((v) => v === '' || /^[0-9+\-\s]{7,16}$/.test(v), 'Enter a valid phone number (7–16 digits)')
export const emailRule = z.string().trim().min(1, 'Email is required').email('Enter a valid email address')
export const passwordRule = z.string()
  .min(8, 'Use 8–64 characters').max(64, 'Use 8–64 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number')
export const userNameRule = z.string().trim().min(3, 'Use 3–30 characters').max(30, 'Use 3–30 characters')
