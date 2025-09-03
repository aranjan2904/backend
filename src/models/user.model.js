import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * User Schema Definition
 * Defines the structure and properties of the User document in MongoDB
 */
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,    // Indexing for faster queries
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,    // Indexing for faster queries
        },
        avatar: {
            type: String,   // Stores cloudinary URL for user's avatar
            required: true,
        },
        coverImage: {
            type: String,   // Stores cloudinary URL for user's cover image
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",    // References the Video model
            }
        ],
        password: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,    // Stores JWT refresh token
        },
    },
    {
        timestamps: true,    // Automatically manage createdAt and updatedAt
    }
)

/**
 * Pre-save middleware to hash password
 * Runs before saving the document if password is modified
 */
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

/**
 * Method to verify if provided password matches the stored hash
 * @param {string} password - The password to verify
 * @returns {Promise<boolean>} - True if password matches, false otherwise
 */
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

/**
 * Generates JWT access token for authentication
 * @returns {string} JWT access token
 */
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

/**
 * Generates JWT refresh token for maintaining session
 * @returns {string} JWT refresh token
 */
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

// Create and export the User model
export const User = mongoose.model("User", userSchema)
