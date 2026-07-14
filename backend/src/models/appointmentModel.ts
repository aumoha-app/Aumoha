import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  userEmail: string;
  vetId: string;
  vetName: string;
  vetSpecialisation: string;
  vetPhoto?: string;
  date: string;
  time: string;
  fee: number;
  mode: 'in-clinic' | 'tele-consult';
  petName: string;
  petId?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  bookingId: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema(
  {
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    vetId: { type: String, required: true },
    vetName: { type: String, required: true },
    vetSpecialisation: { type: String, required: true },
    vetPhoto: { type: String, default: '' },
    date: { type: String, required: true },
    time: { type: String, required: true },
    fee: { type: Number, required: true },
    mode: { type: String, enum: ['in-clinic', 'tele-consult'], default: 'in-clinic' },
    petName: { type: String, required: true },
    petId: { type: String, default: '' },
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'confirmed' },
    notes: { type: String, default: '' },
    bookingId: { type: String, required: true, unique: true }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
