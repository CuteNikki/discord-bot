import mongoose from 'mongoose';

export const clientModel = mongoose.model(
  'client',
  new mongoose.Schema({
    clientId: { type: String, required: true },
    lastWeeklyLevelsClear: { type: Number, required: false },
  })
);
