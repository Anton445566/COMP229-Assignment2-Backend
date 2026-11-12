import mongoose from 'mongoose';
const schema = new mongoose.Schema({
title: { type: String, trim: true, required: true, maxlength: 200 },
firstname: { type: String, trim: true, required: true, maxlength: 200 },
lastname: { type: String, trim: true, required: true, maxlength: 200 },
email: { type: String, trim: true, required: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, maxlength: 200 },
completion: { type: Date },
description: { type: String, trim: true, maxlength: 5000 }
});
export default mongoose.model('Project', schema);
