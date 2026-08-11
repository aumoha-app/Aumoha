import mongoose, { Schema, Document } from 'mongoose';

export interface ISlot {
  _id?: any;
  date: string;
  time: string;
  isBooked: boolean;
  bookedBy?: string;
}

export interface IVet extends Document {
  name: string;
  photo?: string;
  specialisation: string;
  category: string;
  specialtyTags?: string[];
  experience: number;
  fee: number;
  bio?: string;
  rating: number;
  reviewCount: number;
  isOnline: boolean;
  availableSlots: ISlot[];
  email?: string;
  phone?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SlotSchema = new Schema({
  _id: { type: Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId().toString() },
  date: { type: String, required: true },
  time: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
  bookedBy: { type: Schema.Types.Mixed, default: null }
});

const VetSchema = new Schema(
  {
    _id: { type: Schema.Types.Mixed },
    name: { type: String, required: true },
    photo: { type: String, default: '' },
    specialisation: { type: String, required: true },
    category: { type: String, default: 'vet' },
    specialtyTags: { type: [String], default: [] },
    experience: { type: Number, required: true },
    fee: { type: Number, required: true },
    bio: { type: String, default: '' },
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 10 },
    isOnline: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    isRejected: { type: Boolean, default: false },
    availableSlots: { type: [SlotSchema], default: [] },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.Vet || mongoose.model<IVet>('Vet', VetSchema);
