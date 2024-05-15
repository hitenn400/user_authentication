exports.home = (req,res)=>{
    res.status(200).json({
        success:true,
        greeting:"Hello from API"
    });
};
exports.homeDummy = async (req,res)=>{
    try {
        res.status(200).json({
            success:true,
            greeting:"Hello from Dummy API"
        });
    } catch (error) {
        console.log(error);
    }
};