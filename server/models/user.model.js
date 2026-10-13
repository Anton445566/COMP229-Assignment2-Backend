import mongoose from 'mongoose'
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
const deriveKey = promisify(scrypt)
const hashPrefix = 'scrypt$32768$8$3$'
const hashOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }
//const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
 name: {
 type: String,
 trim: true,
 required: 'Name is required'
 },
 email: {
 type: String,
 trim: true,
match: [/.+\@.+\..+/, 'Please fill a valid email address'],
required: 'Email is required'
 },
 created: {
type: Date,
default: Date.now
   },
 updated: {
type: Date,
default: Date.now
},
hashed_password: {
type: String,
 select: false,
required: 'Password is required'
},
 salt: { type: String, select: false }
});
UserSchema.virtual('password')
 .set(function(password) {
 this._password = password;
})
.get(function() {
return this._password;
 });
UserSchema.pre('validate', async function() {
  if (this._password === undefined) {
    if (this.isNew) this.invalidate('password', 'Password is required');
    return;
  }
  if (typeof this._password !== 'string' || this._password.length < 6 ||
      Buffer.byteLength(this._password, 'utf8') > 1024) {
    this.invalidate('password', 'Password must be a string of at least 6 characters and at most 1024 bytes');
    return;
  }
  this.salt = randomBytes(16).toString('hex');
  const hash = await deriveKey(this._password, this.salt, 64, hashOptions);
  this.hashed_password = hashPrefix + hash.toString('hex');
});

UserSchema.post('save', function() {
  delete this._password;
});

UserSchema.methods.authenticate = async function(password) {
  // Legacy plaintext records are deliberately not authenticated or migrated.
  if (typeof password !== 'string' || Buffer.byteLength(password, 'utf8') > 1024 ||
      !/^[a-f0-9]{32}$/.test(this.salt || '') ||
      typeof this.hashed_password !== 'string' || !this.hashed_password.startsWith(hashPrefix)) {
    return false;
  }
  const digest = this.hashed_password.slice(hashPrefix.length);
  if (!/^[a-f0-9]{128}$/.test(digest)) return false;
  const hash = await deriveKey(password, this.salt, 64, hashOptions);
  return timingSafeEqual(hash, Buffer.from(digest, 'hex'));
};

const hidePassword = (doc, result) => {
  delete result.hashed_password;
  delete result.salt;
  delete result.password;
  delete result._password;
  return result;
};
UserSchema.set('toJSON', { transform: hidePassword });
UserSchema.set('toObject', { transform: hidePassword });
//module.exports = mongoose.model('User', UserSchema);
export default mongoose.model('User', UserSchema);

