const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("./catchAsyncError");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel")

exports.isAuthenticatedUser = catchAsyncError(async (req, res, next)=>{
    const{token} = req.cookies

    if(!token){
        return next(new ErrorHandler("Please Login to view the Products", 401))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id)
    next();
})


exports.authoriseRoles = (...roles)=>{
    return (req, res, next)=>{
        if(!roles.includes(req.user.role)){
            return next(new ErrorHandler(`Role ${req.user.role} is not allowed to perform this operation`, 401))
        }
        next();
    }
}