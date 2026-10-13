import mongoose from 'mongoose'
//const mongoose = require('mongoose');
const ContactSchema = new mongoose.Schema({
 firstname: {
 type: String,
 trim: true,
 required: 'Name is required'
 },

 lastname: {
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
 
 });
//module.exports = mongoose.model('User', UserSchema);
export default mongoose.model('Contact', ContactSchema);
