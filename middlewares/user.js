const User = require('../models/user');
const jwt = require('jsonwebtoken')
exports.isLoggedIn=async(req,res,next)=>{
    try {
        const token = req.cookies.token || req.header("Authorization").replace("Bearer","");
        if(!token){
            return res.status(400).json({
                msg:"login to page first"
            })
        }
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        res.status(400).json({
            msg:error.message
        })
    }
};
exports.customRole=(...roles)=>{
        return(req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return res.status(400).json({
                message:"not allowed for this resource"
            });
        }
        next();
    }
};