import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * Controller for user registration.
 * Handles the creation of a new user account, including:
 *  - validation of input fields
 *  - checking if the user already exists
 *  - uploading files (avatar, cover image) to Cloudinary
 *  - creating a user entry in the database
 *  - returning a safe response (without password/refreshToken)
 */

//generate Access and Refresh token
const generateTokens = async(userId) => {
   try {
      const user =  await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()
      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })

      return {accessToken,refreshToken}

   } catch (error) {
      throw new Error(500, "something went wrong while generating tokens")
   }
}

// Register
const registerUser = asyncHandler(async (req, res) => {

    // Step 1: Get user details from frontend (from req.body)
    const { fullName, username, email, password } = req.body;
    console.log("Received data:", fullName, username, email, password);


    // Step 2: Validation - check that no field is empty
    if (!fullName || !username || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }


    // Step 3: Check if user already exists (by username OR email)
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }



    // Step 4: Check for uploaded files (avatar is mandatory, coverImage is optional)
    // Multer saves files temporarily in /public/temp folder
    const avatarLocalPath = req.files?.avatar?.[0]?.path;   // path of uploaded avatar file
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path; // path of cover image file (optional)

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }



    // Step 5: Upload avatar to Cloudinary
    console.log("Uploading avatar from path:", avatarLocalPath);
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("Cloudinary upload response for avatar:", avatar);

    if (!avatar || !avatar.url) {
        throw new ApiError(400, "Error uploading avatar to Cloudinary");
    }



    // Step 6: Upload cover image to Cloudinary (only if provided)
    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : null;



    // Step 7: Create user object in database
    const user = await User.create({
        fullName,
        username: username.toLowerCase(), // store username in lowercase for consistency
        email,
        password, // password should be hashed in the model (via pre-save hook usually)
        avatar: avatar.url,
        coverImage: coverImage?.url || "" // optional field
    });



    // Step 8: Fetch the created user, but remove sensitive fields (password, refreshToken)
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(400, "User creation failed");
    }



    // Step 9: Return response in a consistent format
    return res.status(201).json(
        new ApiResponse(200, "User registered successfully", createdUser)
    );
});


// login
const loginUser = asyncHandler(async (req, res) => {
   // To do
   // req body -> data
   // username or email
   // find the user
   // password check
   // access and refresh token
   // send cookie
   // response


   const {email, username, password} = req.body

   if (!email || !username) {
      throw new Error(" username or password is required");
   }

   const user = await User.findOne({
      $or: [{username}, {email}]
   })

   if(!user) {
      throw new ApiError(404, "user not found")
   }

   const isPasswordCorrect = await user.isPasswordCorrect(password)
   if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid credentials")
   }

   const {accessToken, refreshToken} = await generateTokens(user._id)

   const loggedInUser = await User.findById(user._id).
   select("-password -refreshToken")

   const option = {
      httpOnly: true,
      secure: true
   }
   return res
   .status(200)
   .cookie("accessToken", accessToken, option)
   .cookie("refreshToken", refreshToken, option)
   .json(new ApiResponse(
      200, {
         user: loggedInUser,
         accessToken,
         refreshToken
      },
      "User logged in successfully"
   ))

})


const logoutUser = asyncHandler(async (req, res) => {
   User.findById
});
export { 
   registerUser,
   loginUser
 };
