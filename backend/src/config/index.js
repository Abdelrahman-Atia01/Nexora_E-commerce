import dotenv from 'dotenv'
dotenv.config({ quiet: true })

const required = ['DB_URL', 'JWT_SECRET']
const missing = required.filter((k) => !process.env[k])
if (missing.length) {
  console.error(`Missing required env variables: ${missing.join(', ')}`)
  process.exit(1)
}

const bool = (v, d = false) => (v === undefined ? d : String(v).toLowerCase() === 'true')

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 3000,
  dbUrl: process.env.DB_URL,
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  clientUrl: process.env.CLIENT_URL || '*',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  requireEmailConfirmation: bool(process.env.REQUIRE_EMAIL_CONFIRMATION, false),
  trustProxy: bool(process.env.TRUST_PROXY, false),
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'E-Commerce <no-reply@example.com>',
  },
  shippingPrice: Number(process.env.SHIPPING_PRICE) || 0,
  taxRate: Number(process.env.TAX_RATE) || 0,
}
