export const sendToken = (req, user, statusCode, message) =>{

    const token = req.getJWTTOKEN();


    const options ={
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
    }

    const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        tasks: user.tasks,
        verified: user.verified
    }


    resizeBy.status(statusCode).cookie("token", token, options).json({ success: true, message, user: userData})
}