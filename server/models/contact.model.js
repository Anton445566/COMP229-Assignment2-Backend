import mongoose from 'mongoose';
const schema = new mongoose.Schema({
 firstname: { type: String, trim: true, required: true, maxlength: 100 },
 lastname: { type: String, trim: true, required: true, maxlength: 100 },
 email: { type: String, trim: true, lowercase: true, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
 contactNumber: { type: String, trim: true, required: true, match: /^[+()\d .-]{7,30}$/ },
 message: { type: String, trim: true, required: true, maxlength: 5000 }
});
export default mongoose.model('Contact', schema);
