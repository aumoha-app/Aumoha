import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  category: 'food' | 'toys' | 'medical';
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountBadge?: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    category: { 
      type: String, 
      required: true, 
      enum: ['food', 'toys', 'medical'] 
    },
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      required: true, 
      trim: true 
    },
    price: { 
      type: Number, 
      required: true 
    },
    originalPrice: { 
      type: Number, 
      default: null 
    },
    discountBadge: { 
      type: String, 
      default: '' 
    },
    imageUrl: { 
      type: String, 
      required: true 
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
