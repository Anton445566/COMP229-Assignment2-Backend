
import mongoose from 'mongoose';

const QualificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  firstname: {
    type: String
  },
  lastname: {
    type: String
  },
  email: {
    type: String,
    trim: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  institution: {
    type: String
  },
  type: {
    type: String
  },
  completion: {
    type: Date
  },
  description: {
    type: String
  }
});

export default mongoose.model('Qualification', QualificationSchema);
