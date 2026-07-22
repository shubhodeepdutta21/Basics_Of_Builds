import mongoose, { Schema, Document } from 'mongoose';

// User Schema
export interface IUser extends Document {
  name: string;
  email: string;
  inventory: { componentId: mongoose.Types.ObjectId; quantity: number }[];
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  inventory: [{
    componentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Component' },
    quantity: { type: Number, default: 1 }
  }]
}, { timestamps: true });

// Component Schema
export interface IComponent extends Document {
  name: string;
  category: string;
  description: string;
  imageUrl: string;
}

const ComponentSchema: Schema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String }
}, { timestamps: true });

// Project Schema
export interface IProject extends Document {
  title: string;
  description: string;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  imageUrl?: string;
  requirements: { componentId: mongoose.Types.ObjectId; requiredQuantity: number; isOptional: boolean }[];
  buildGuides: { stepNumber: number; instructionText: string; imageUrl?: string }[];
}

const ProjectSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficultyLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  estimatedTime: { type: String, required: true },
  imageUrl: { type: String },
  requirements: [{
    componentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Component' },
    requiredQuantity: { type: Number, required: true },
    isOptional: { type: Boolean, default: false }
  }],
  buildGuides: [{
    stepNumber: { type: Number, required: true },
    instructionText: { type: String, required: true },
    imageUrl: { type: String }
  }]
}, { timestamps: true });

// Models
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Component = mongoose.models.Component || mongoose.model<IComponent>('Component', ComponentSchema);
export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
