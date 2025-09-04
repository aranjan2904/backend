/**
 * Main application entry point
 * Initializes environment variables and connects to MongoDB
 */
import dotenv from "dotenv"
import connectDB from "./db/index.js"
import app from "./app.js"

// Load environment variables
dotenv.config({
    path: './.env'
})

// Connect to database and start server
connectDB()
.then(() => {
    // Handle server errors
    app.on("error", (error) => {
        console.log("ERROR:", error);
        throw error
    })

    // Start the server
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MongoDB connection failed!!!", err);
    process.exit(1); // Exit process with failure
})