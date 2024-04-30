import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  language: { type: String, default: 'en' },
});

export const userModel = mongoose.model('user', userSchema);
