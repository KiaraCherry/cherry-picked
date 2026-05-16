import mongoose from 'mongoose';
import slugify from 'slugify';

const recipeSchema = new mongoose.Schema(
    {
        amount: {
            type: String,
            trim: true,
        },
        name: {
            type: String,
            required: [true, "Recipe name is required"],
            trim: true,
        },
    },
    { _id: false }
);

recipeSchema.pre('save', async function (next) {
    if (!this.isModified('password')) { return next(); }
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    next();
});

recipeSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};


recipeSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('Recipe', recipeSchema);