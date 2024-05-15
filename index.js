const app = require("./app");
const connectWIthDb = require("./config/db");

require('dotenv').config();
const cloudinary = require('cloudinary');
// connect with database
connectWIthDb();
// cloudinary config goes here
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

app.listen(process.env.PORT,()=>{
    console.log(`server is running at port: ${process.env.PORT}`);
});
