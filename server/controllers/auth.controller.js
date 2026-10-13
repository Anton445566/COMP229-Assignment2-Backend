import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import config from '../../config/config.js';
import errorHandler from './error.controller.js';

const signingSecret = () => {
  if (typeof config.jwtSecret !== 'string' || Buffer.byteLength(config.jwtSecret, 'utf8') < 32) {
    const error = new Error('Authentication is not configured');
    error.status = 503;
    throw error;
  }
  return config.jwtSecret;
};

const isAdmin = (id) => (config.adminUserIds || []).includes(String(id).toLowerCase());

const signin = async (req, res) => {
  try {
    const secret = signingSecret();
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() ||
        !password || Buffer.byteLength(password, 'utf8') > 1024) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.trim() }).select('+hashed_password +salt');
    if (!user || !(await user.authenticate(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ sub: String(user._id) }, secret, {
      algorithm: 'HS256', expiresIn: '1h', issuer: 'comp229-portfolio', audience: 'comp229-api'
    });
    return res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    return res.status(errorHandler.getStatus(err)).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const signout = (req, res) => {
  res.clearCookie('t', { httpOnly: true, sameSite: 'strict', secure: config.env === 'production', path: '/' });
  return res.json({ message: 'Successfully signed out. Discard your bearer token.' });
};

const requireSignin = async (req, res, next) => {
  const authorization = req.get('authorization') || '';
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  if (!match) return res.status(401).json({ error: 'Authentication required' });
  let claims;
  try {
    claims = jwt.verify(match[1], signingSecret(), {
      algorithms: ['HS256'], issuer: 'comp229-portfolio', audience: 'comp229-api'
    });
  } catch (err) {
    if (err.status === 503) {
      return res.status(503).json({ error: 'Authentication is not configured' });
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  if (typeof claims.sub !== 'string' || !/^[a-f0-9]{24}$/i.test(claims.sub)) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  try {
    const user = await User.findById(claims.sub).select('_id');
    if (!user) return res.status(401).json({ error: 'Invalid or expired token' });
    req.auth = { _id: String(user._id) };
    return next();
  } catch (err) {
    return res.status(errorHandler.getStatus(err)).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.auth) return res.status(401).json({ error: 'Authentication required' });
  if (!isAdmin(req.auth._id)) return res.status(403).json({ error: 'Portfolio owner access required' });
  return next();
};

const hasAuthorization = (req, res, next) => {
  if (!req.auth) return res.status(401).json({ error: 'Authentication required' });
  if (!/^[a-f0-9]{24}$/i.test(req.params.userId || '')) {
    return res.status(400).json({ error: 'Invalid user identifier' });
  }
  if (req.auth._id.toLowerCase() !== req.params.userId.toLowerCase() && !isAdmin(req.auth._id)) {
    return res.status(403).json({ error: 'You may only access your own account' });
  }
  return next();
};

export default { signin, signout, requireSignin, requireAdmin, hasAuthorization };
