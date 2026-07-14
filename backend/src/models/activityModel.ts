import mongoose, { Schema, Document } from 'mongoose';

export interface IJoinee {
  userEmail: string;
  userName: string;
  avatar?: string;
  userPhone?: string;
}

export interface IActivityPost extends Document {
  userEmail: string;
  userPhone: string;
  authorName: string;
  authorRole: string;
  avatar: string;
  category: 'feeding' | 'help' | 'event' | 'awareness';
  title: string;
  description: string;
  location: string;
  image?: string;
  likes: number;
  joinees: IJoinee[];
  createdAt: Date;
  updatedAt: Date;
}

const ActivityPostSchema: Schema = new Schema(
  {
    userEmail: { type: String, required: true },
    userPhone: { type: String, default: '' },
    authorName: { type: String, required: true },
    authorRole: { type: String, default: 'volunteer' },
    avatar: { type: String, default: '' },
    category: { 
      type: String, 
      required: true,
      enum: ['feeding', 'help', 'event', 'awareness'] 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    image: { type: String, default: '' },
    likes: { type: Number, default: 0 },
    joinees: {
      type: [{
        userEmail: { type: String, required: true },
        userName: { type: String, required: true },
        avatar: { type: String, default: '' },
        userPhone: { type: String, default: '' }
      }],
      default: []
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ActivityPost || mongoose.model<IActivityPost>('ActivityPost', ActivityPostSchema);
