const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken');
const crypto = require('crypto');
mongoose.set('strictQuery', true);
const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:[true,'Please provide a name'],
        maxlength:[40,'Name should be under 40 characters']
    },
    privacy:{
        type: String,
        required: [true, 'Please select Privacy'],
        default:'private'
    },
    phone:{
        type: Number,
        required: [true, 'Please provide Phone no.'],
    },
    bio:{
        type: String,
        required: [true, 'Please enter Bio'],
    },
    email:{
        type:String,
        required:[true,'Please provide an email'],
        validate: [validator.isEmail,'Please enter valid email'],
        unique: true
    },
    password:{
        type:String,
        required:[true,'Please provide a password'],
        minlength: [6,'password should be atleast 6 char'],
        select: false
    },
    role:{
        type:String,
        default: 'user'
    },
    photo:{
        id: {
            type:String,
            required:true
        },
        secure_url:{
            type:String,
            required:true
        }
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date, 
    createdAt:{
        type: Date,
        default:Date.now
    }
});
// encrypt password before save --HOOKS
userSchema.pre('save',async function(next){
    if(!this.isModified("password")){
        return next;
    }
    this.password =await bcrypt.hash(this.password,10); 
})
// validate the password with passed on user password
userSchema.methods.isValidatedPassword=async function (userPassword) {
   return await bcrypt.compare(userPassword,this.password);
}
// create and return jwt token
userSchema.methods.getJwtToken=function(){
    return JWT.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRY
    });
};
// generate forgot password token(string)
userSchema.methods.getForgotPasswordToken=function () {
    // generate a long and random string
    const forgotToken = crypto.randomBytes(20).toString('hex');
    // getting a hash - make sure to get a hash on backend
    this.forgotPasswordToken=crypto
    .createHash('sha256')
    .update(forgotToken)
    .digest('hex');
    // time of token
    this.forgotPasswordExpiry = Date.now()+20*60*1000;
    return forgotToken;
}

module.exports = mongoose.model('User',userSchema);