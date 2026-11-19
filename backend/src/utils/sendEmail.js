import nodemailer from 'nodemailer'
import { config } from '../config/index.js'

let transporter
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    })
  }
  return transporter
}

/**
 * Sends an email. When SMTP is not configured (local dev) the email is
 * printed to the console instead so the flow can still be tested.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!config.smtp.host) {
    if (config.isProd) throw new Error('SMTP is not configured')
    console.log(`\n[DEV EMAIL] to: ${to}\nsubject: ${subject}\n${text || html}\n`)
    return
  }
  await getTransporter().sendMail({ from: config.smtp.from, to, subject, html, text })
}
