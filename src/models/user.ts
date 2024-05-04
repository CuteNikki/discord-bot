import mongoose from 'mongoose';

export const userModel = mongoose.model(
  'user',
  new mongoose.Schema({
    userId: { type: String, required: true },
    language: { type: String, default: 'en' },
  })
);
