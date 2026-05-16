import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters long"],
        select: false, // Exclude password from query results by default
    },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },

    inviteTokenExpiry: {
        type: Date,
        default: null,
        select: false, // Exclude inviteTokenExpiry from query results by default
    },

    savedRecipes: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Recipe",
    },

    timestamps: true,
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) { return next(); }
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};


userSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('User', userSchema);