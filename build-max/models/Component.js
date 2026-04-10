import mongoose from 'mongoose';

const ComponentSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    category: {
        type: String,
        enum: ['Microcontrollers', 'Sensors', 'General Computing', 'Cables', 'Other'],
        required: true
    },
    description: String,
    imageUrl: String,
});

export default mongoose.models.Component || mongoose.model('Component', ComponentSchema);