import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, default: 'user' },
    inventory: [{
        componentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Component' },
        quantity: { type: Number, default: 1 }
    }]
});

export default mongoose.models.User || mongoose.model('User', UserSchema);