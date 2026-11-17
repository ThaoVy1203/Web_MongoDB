const crypto = require('crypto');

const COOKIE_NAME = 'wops_session';
const SECRET = process.env.SESSION_SECRET || 'warrantyops-hmac-secret-2026';

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash = '') {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
  } catch {
    return false;
  }
}

function signToken(payloadObj) {
  const data = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (sig !== expected) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader = '') {
  const out = {};
  if (!cookieHeader) return out;
  cookieHeader.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      out[k] = v;
    }
  });
  return out;
}

function setSessionCookie(res, user, remember = true) {
  const maxAgeSec = remember ? 7 * 24 * 60 * 60 : 12 * 60 * 60;
  const payload = {
    id: String(user._id || user.id || ''),
    email: user.email,
    fullname: user.fullname,
    phone: user.phone || '',
    customerCode: user.customerCode || '',
    role: user.role || 'customer',
    tier: user.tier || 'Standard',
    exp: Date.now() + maxAgeSec * 1000
  };
  const token = signToken(payload);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`
  );
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function attachCurrentUser(req, res, next) {
  const cookies = parseCookies(req.headers.cookie || '');
  const sessionUser = verifyToken(cookies[COOKIE_NAME]);
  req.user = sessionUser || null;
  res.locals.currentUser = req.user;
  next();
}

module.exports = {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  attachCurrentUser
};
