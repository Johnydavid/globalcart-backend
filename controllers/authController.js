const catchAsyncError = require("../middlewares/catchAsyncError");
const User = require("../models/userModel");
const sendEmail = require("../utils/email");
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwt");
const crypto = require("crypto");

// Register New User - [Post Method] - /api/register
exports.registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password, avatar } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    avatar,
  });

  sendToken(user, 201, res);
});

// Login User  - [Post Method] - /api/login
exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter Email and Password", 400));
  }

  // Finding User Data

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  if (!(await user.isValidPassword(password))) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  sendToken(user, 201, res);
});

exports.logoutUser = (req, res, user) => {
  res
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .status(200)
    .json({
      success: true,
      message: "LoggedOut Successfully",
    });
};

// Forgot Password [Post Method] /api/password/forgot
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not Found with this Email", 404));
  }

  const resetToken = user.getResetToken();
  await user.save({ validateBeforeSave: false });

  // Create Reset URL

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/password/reset/${resetToken}`;

  const message = `Please Click Below Link to reset your Password
     \n\n ${resetUrl} 
    \n\n Please Ignore this if you have not requested.`;

  try {
    sendEmail({
      email: user.email,
      subject: "GlobalCart Password Recovery",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message), 500);
  }
});

// Reset Password - [Post Method] /api/password/reset/:token
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTokenExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return next(new ErrorHandler("Password Reset Token is Invalid or Expired"));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not match"));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpire = undefined;
  await user.save({ validateBeforeSave: false });

  sendToken(user, 201, res);
});


// Get User Profile [Get Method] /api/myprofile

exports.getUserProfile = catchAsyncError(async(req, res, next)=>{
    const user = await User.findById(req.user.id)
    res.status(200).json({
        success: true,
        user
    })
})


// Change Password [Post Method] /api/password/change


exports.changePassword = catchAsyncError(async(req, res, next)=>{
    const user = await User.findById(req.user.id).select('+password')

    // Check old Password
if(!await user.isValidPassword(req.body.oldPassword)){
    return next(new ErrorHandler('Old Password is Incorrect', 401))
}
// Assigning New Password

user.password = req.body.password;
await user.save();
res.status(200).json({
    success: true
})

})


// Update Profile [Post Method]

exports.updateProfile = catchAsyncError(async(req, res, next)=>{
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }
    
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true
    })

    res.status(200).json({
        success: true,
        user
    })
})

// Admin: Get all Users [Get Method] /api/admin/users

exports.getAllUsers = catchAsyncError(async(req,res,next)=>{
    const users = await User.find()
    res.status(200).json({
        success: true,
        count: users.length,
        users
       
    })
})

// Admin: Get Specific User [Get Method] /api/admin/user/:id

exports.getSpecificUser = catchAsyncError(async(req, res, next)=>{
    const user  = await User.findById(req.params.id)
    if(!user){
        return next(new ErrorHandler(`User Not Found with this id:  ${id}`))
    }
    res.status(200).json({
        success: true,
        user
    })
})

// Admin: Update User Information   [Put Method] /api/admin/user/:id

exports.updateUser = catchAsyncError(async(req, res,next)=>{
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role

    }
    
    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true
    })

    res.status(200).json({
        success: true,
        user
    })

})

// Admin: Delete User  [Delete Method] /api/admin/user/:id

exports.deleteUser = catchAsyncError(async(req, res, next)=>{
    const user  = await User.findById(req.params.id);
    if(!user){
        return next(new ErrorHandler(`User Not Found with this id:  ${id}`))
    }
    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: "User Deleted"
   
    })



})

