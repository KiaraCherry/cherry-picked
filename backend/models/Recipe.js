import mongoose from 'mongoose';
import slugify from 'slugify';

const ingredientSchema = new mongoose.Schema(
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

const recipeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Recipe title is required"],
            trim: true,
            maxlength: [120, "Recipe title must be less than 120 characters"],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Recipe description is required"],
            trim: true,
            maxlength: [500, "Recipe description must be less than 500 characters"],
        },
        image: {
            type: String,
            default: null,
        },
        ingredients: {
            type: [ingredientSchema],
            default: ["No Ingredients provided"],
        },
        instructions: {
            type: [String],
            default: ["No Instructions provided"],
        },
        totalTime: { type: Number, min: 0, default: "Not Provided" },
        servings: { type: Number, min: 1, default: 1 },

        tags: {
            type: [String],
            default: [],
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Generate unique slug before saving
recipeSchema.pre('save', async function (next) {
    if (!this.isModified('title')) { return next(); }
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;

    while (await mongoose.model('Recipe').findOne({ slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}-${count}`;
        count++;
    }
    this.slug = slug;
    next();
});

recipeSchema.index({ title: 'text', description: 'text', tags: 'text' });
recipeSchema.index({ tags: 1 });

recipeSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

export default mongoose.model('Recipe', recipeSchema);