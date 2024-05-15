const User = require('../models/user');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary');
const user = require('../models/user');
const mailHelper = require('../utils/emailHelper');
const crypto = require('crypto');

exports.signup = async (req, res) => {
    try {
        let result;
        if (req.files) {
            let file = req.files.photo;
            result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
                folder: "users",
                width: 150,
                crop: "scale"
            })
        }
        const { name, email, password } = req.body;
        if (!email || !name || !password) {
            return res.status(400).send("email or password not found")
        }
        const user = await User.create({
            name,
            email,
            password,
            photo: {
                id: result.public_id,
                secure_url: result.secure_url
            }
        });
        const token = user.getJwtToken();
        const options = {
            expires: new Date(
                Date.now() + 3 * 24 * 60 * 60 * 1000
            ),
            httpOnly: true
        }
        user.password = undefined;
        res.status(200).cookie('token', token, options).json({
            success: true,
            token,
            user
        });
    } catch (error) {
        res.status(400).json({
            msg: error.message
        });
    }
}
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // check for presence of email and password
        if (!email || !password) {
            return res.status(400).json({
                error: "please provide email and password"
            })
        }
        // get user from DB
        const user = await User.findOne({ email }).select("+password");
        // checking if user not found in DB
        if (!user) {
            return res.status(400).json({
                error: "You are not registered with us"
            });
        }
        // match the password
        const isPasswordCorrect = await user.isValidatedPassword(password);
        // if password do not match
        if (!isPasswordCorrect) {
            return res.status(400).json({
                error: "Email or password does not match or exist"
            });
        }
        // if all goes good then send token/cookie
        const token = user.getJwtToken();
        const options = {
            expires: new Date(
                Date.now() + 3 * 24 * 60 * 60 * 1000
            ),
            httpOnly: true
        }
        user.password = undefined;
        res.status(200).cookie('token', token, options).json({
            success: true,
            token,
            user
        });

    } catch (error) {
        res.status(400).json({
            msg: error.message
        })
    }
}
exports.logout = async (req, res) => {
    try {
        res.cookie('token', null, {
            expires: new Date(Date.now()),
            httpOnly: true
        });
        res.status(200).json({
            success: true,
            message: "Logout Success"
        })

    }
    catch (error) {
        res.status(400).json({
            msg: error.message
        })
    }
}
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "email not found"
            })
        }
        const forgotToken = user.getForgotPasswordToken();
        await user.save({ validateBeforeSave: false });
        const myUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${forgotToken}`;
        const message = `Copy paste this link in ur url and hit enter \n\n ${myUrl}`;
        await mailHelper({
            email: email,
            subject: "tshirt store Password reset mail",
            message: message
        });
        res.status(200).json({
            success: true,
            message: "Email sent successfully"
        });
    }
    catch (error) {
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(400).json({
            msg: error.message
        })
    }
}
exports.passwordReset = async (req, res) => {
    try {
        const bodytoken = req.params.token;
        const encryptToken = crypto
            .createHash('sha256')
            .update(bodytoken)
            .digest('hex');
        const user = await User.findOne({
            encryptToken,
            forgotPasswordExpiry: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({
                message: "token is invalid or expired"
            });
        }
        if (req.body.password !== req.body.confirmPassword) {
            return res.status(400).json({
                message: "password and confirm password do not match"
            });
        }
        user.password = req.body.password;

        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save();
        // send a json response or send token
        const token = user.getJwtToken();
        const options = {
            expires: new Date(
                Date.now() + 3 * 24 * 60 * 60 * 1000
            ),
            httpOnly: true
        }
        user.password = undefined;
        res.status(200).cookie('token', token, options).json({
            success: true,
            token,
            user
        });

    }
    catch (error) {

        res.status(400).json({
            msg: error.message
        })
    }
}
exports.getLoggedInUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            user
        });
    }
    catch (error) {

        res.status(400).json({
            msg: error.message
        })
    }
}
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id
        const user = await User.findById(req.user.id).select("+password");
        const isCorrectOldPassword = await user.isValidatedPassword(req.body.oldPassword);
        if (!isCorrectOldPassword) {
            return res.status(400).json({
                message: "old password is incorrect"
            });
        }
        user.password = req.body.newPassword;
        await user.save();
        // send cookie
        const token = user.getJwtToken();
        const options = {
            expires: new Date(
                Date.now() + 3 * 24 * 60 * 60 * 1000
            ),
            httpOnly: true
        }
        user.password = undefined;
        res.status(200).cookie('token', token, options).json({
            success: true,
            token,
            user
        });
    }
    catch (error) {

        res.status(400).json({
            msg: error.message
        })
    }
}

exports.updateUserDetails = async (req, res) => {
    try {
        if (!req.body.email || !req.body.name) {
            return res.status(400).json({
                message: "please enter email and name to update"
            })
        }
        const newData = {
            name: req.body.name,
            email: req.body.email,
            bio: req.body.bio,
            phone: req.body.phone,
            privacy: req.body.privacy

        };
        if (req.files) {
            const user = await User.findById(req.user.id);
            const imageId = user.photo.id;
            // delete
            const resp = await cloudinary.v2.uploader.destroy(imageId);
            // upload
            let file = req.files.photo;
            let result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
                folder: "users",
                width: 150,
                crop: "scale"
            });
            newData.photo = {
                id: result.public_id,
                secure_url: result.secure_url
            }
        }
        const user = await User.findByIdAndUpdate(req.user.id, newData, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        });
        res.status(200).json({
            success: true,
            user
        })
    }
    catch (error) {

        res.status(400).json({
            msg: error.message
        })
    }
}
exports.adminAllUser = async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({
            success: true,
            users
        });
    }
    catch (error) {

        res.status(400).json({
            msg: error.message
        })
    }
}
exports.adminGetOneUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(400).json({
                Error: "No user found"
            })
        }
        return res.status(200).json({
            success: true,
            user
        });

    }
    catch (error) {

        res.status(400).json({
            msg: error.message
        })
    }
}
exports.managerAllUser = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' });
        res.status(200).json({
            success: true,
            users
        });
    }
    catch (error) {

        res.status(400).json({
            msg: error.message
        })
    }
}
exports.adminUpdateOneUserDetails = async (req, res) => {
    try {

        const newData = {
            name: req.body.name,
            email: req.body.email,
            role: req.body.role
        };

        const user = await User.findByIdAndUpdate(req.params.id, newData, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        });
        res.status(200).json({
            success: true,
            user
        })
    }
    catch (error) {

        res.status(400).json({
            msg: error.message
        })
    }
}
exports.adminDeleteUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(401).json({
                error: "no such user found"
            })
        }
        const imageId = user.photo.id;
        await cloudinary.v2.uploader.destroy(imageId);
        await user.remove();
        res.status(200).json({
            success: true,
        })
    }
    catch (error) {

        res.status(400).json({
            msg: error.message
        })
    }
}
exports.getAllPublicUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user', privacy: 'public' });
        res.status(200).json({
            success: true,
            users
        });
    }
    catch (error) {

        res.status(400).json({
            msg: error.message
        })
    }
}