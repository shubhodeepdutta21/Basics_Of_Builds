import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    difficultyLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    estimatedTime: String,
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    requirements: [{
        componentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Component' },
        requiredQuantity: { type: Number, default: 1 },
        isOptional: { type: Boolean, default: false }
    }],
    
    buildGuides: [{
        stepNumber: Number,
        instructionText: String,
        imageUrl: String
    }]
});

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);