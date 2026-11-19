const layout = (title, body) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #eee;border-radius:8px;padding:24px">
  <h2 style="margin-top:0">${title}</h2>${body}
  <p style="color:#999;font-size:12px;margin-top:24px">If you did not request this, you can ignore this email.</p>
</div>`

export const confirmEmailTemplate = (name, link) => ({
  subject: 'Confirm your email',
  text: `Hi ${name}, confirm your email: ${link}`,
  html: layout('Welcome 👋', `<p>Hi ${name}, please confirm your email address.</p>
  <p><a href="${link}" style="background:#111;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Confirm email</a></p>`),
})

export const resetCodeTemplate = (name, code) => ({
  subject: 'Your password reset code (valid for 10 minutes)',
  text: `Hi ${name}, your reset code is ${code}`,
  html: layout('Password reset', `<p>Hi ${name}, use this code to reset your password:</p>
  <p style="font-size:28px;letter-spacing:6px;font-weight:bold">${code}</p>`),
})
