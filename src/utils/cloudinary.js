import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({
    path: './.env'
})

// Verify environment variables
const requiredEnvVars = {
    CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Configure cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        // Check if file exists
        if (!fs.existsSync(localFilePath)) {
            console.log("File not found:", localFilePath);
            return null;
        }

        // Upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // File uploaded successfully
        console.log("File uploaded successfully:", response.url);
        
        // Remove temporary local file
        fs.unlinkSync(localFilePath);
        
        return response;
        
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        // Cleanup: remove temporary file on error
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    } // Added missing closing brace here
}

export {uploadOnCloudinary};