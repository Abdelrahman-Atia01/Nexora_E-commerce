import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { config } from '../config/index.js'

export const signToken = (payload, expiresIn = config.jwt.expiresIn) =>
  jwt.sign(payload, config.jwt.secret, { expiresIn })

export const verifyToken = (token) => jwt.verify(token, config.jwt.secret)

export const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex')

export const randomCode = () => String(crypto.randomInt(100000, 1000000))
