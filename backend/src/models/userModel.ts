import mongoose, { Schema, Document } from 'mongoose';

export interface IPet {
  _id?: any;
  name: string;
  photo?: string;
  type: string;
  breed?: string;
  age?: number;
  gender?: 'male' | 'female' | 'unknown';
  notes?: string;
}

export interface IUser extends Document {
  firebaseUid: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  profilePic?: string;
  role: 'normal' | 'doctor' | 'expert' | 'pet_service_provider' | 'service_provider' | 'rescuer' | 'feeder' | 'volunteer' | 'ngo' | 'admin' | 'paravet';
  rescueCount: number;
  pets: IPet[];
  createdAt: Date;
  updatedAt: Date;
}

const PetSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    photo: { type: String, default: '' },
    type: { type: String, required: true },
    breed: { type: String, default: '' },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

const UserSchema: Schema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '' },
    profilePic: { type: String, default: '' },
    role: { type: String, enum: ['normal', 'doctor', 'expert', 'pet_service_provider', 'service_provider', 'rescuer', 'feeder', 'volunteer', 'ngo', 'admin', 'paravet'], default: 'normal' },
    rescueCount: { type: Number, default: 0 },
    pets: { type: [PetSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

