import mongoose, { Schema, Document } from 'mongoose';

export interface ICallSession extends Document {
  bookingId: string;
  userEmail: string;
  expertOrVetId: string;
  callType: 'audio' | 'video';
  status: 'requested' | 'ready' | 'ongoing' | 'ended' | 'cancelled';
  agoraChannelName: string;
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
}

const CallSessionSchema = new Schema(
  {
    bookingId: { type: String, required: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    expertOrVetId: { type: String, required: true },
    callType: { type: String, enum: ['audio', 'video'], default: 'video' },
    status: {
      type: String,
      enum: ['requested', 'ready', 'ongoing', 'ended', 'cancelled'],
      default: 'requested'
    },
    agoraChannelName: { type: String, required: true },
    endedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.CallSession || mongoose.model<ICallSession>('CallSession', CallSessionSchema);
