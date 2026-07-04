import mongoose, { Schema, Document } from 'mongoose';

export interface ISosReport extends Document {
  userEmail: string;
  userPhone: string;
  category: string;
  severity: 'critical' | 'urgent' | 'stable';
  location: string;
  reason: string;
  status: 'active' | 'dispatched' | 'resolved';
  photo?: string;
  audio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SosReportSchema: Schema = new Schema(
  {
    userEmail: { 
      type: String, 
      required: true,
      default: 'anonymous@aumoha.com'
    },
    userPhone: {
      type: String,
      default: ''
    },
    category: { 
      type: String, 
      required: true 
    },
    severity: { 
      type: String, 
      required: true, 
      enum: ['critical', 'urgent', 'stable'] 
    },
    location: { 
      type: String, 
      required: true,
      default: 'Current Location'
    },
    reason: { 
      type: String, 
      required: true 
    },
    status: { 
      type: String, 
      required: true,
      enum: ['active', 'dispatched', 'resolved'],
      default: 'active'
    },
    photo: {
      type: String,
      default: ''
    },
    audio: {
      type: String,
      default: ''
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SosReport || mongoose.model<ISosReport>('SosReport', SosReportSchema);
