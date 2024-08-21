import { User } from '../models/users.js'
import { sendMail } from '../utils/sendMail.js';
import { sendToken } from '../utils/sendToken.js';
import cloudinary from "cloudinary";
import fs from "fs";

export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const  avatar  = req.files.avatar.tempFilePath.toString();


        let user = await User.findOne({ email });

        if (user) {
            return res
                .status(400)
                .json({ success: false, message: "User already exists" });
        }

        const otp = Math.floor(Math.random() * 1000000);

        const mycloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "todoApp"
        })

        fs.rmSync("./tmp", { recursive: true });

        user = await User.create({
            name,
            email,
            password,
            avatar: {
                public_id: mycloud.public_id,
                url: mycloud.secure_url,
            },
            otp,
            otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000)
        });

        await sendMail(email, "Verify your account", `Your OTP is ${otp}`);

        sendToken(res, user, 201, "OTP Sent to your email please verify your account")

    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
};

export const verify = async (req, res, next) => {
    try {
        const otp = Number(req.body.otp);
        
        console.log(req.user)

        const user = await User.findById(req.user._id);

        if (user.otp !== otp || user.otp_expiry < Date.now()) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid OTP or has been Expired" });
        }

        user.verified = true;
        user.otp = null;
        user.otp_expiry = null;

        await user.save();

        sendToken(res, user, 200, "Account Verified");

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ success: false, message: "Please enter email and Passwords " });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid Email or Password" });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid Email or Password" });
        }

        sendToken(res, user, 200, "Login Successfully");

    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
};

export const logout = async (req, res) => {
    try {
        res.status(200).cookie("token", null, {
            expires: new Date(Date.now()),
        })
            .json({ success: true, message: "Logged out Successfully" })

    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
};
export const removeTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const user = await User.findById(req.user._id);

        user.tasks = user.tasks.filter(task => task._id.toString() !== taskId);

        await user.save();

        res.status(200).json({ success: true, message: "Task removed successfully" })

    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
};

export const addTask = async (req, res) => {
    try {
        const { title, description } = req.body

        const user = await User.findById(req.user._id);


        user.tasks.push({ title, description, completed: false, createdAt: new Date(Date.now()) });

        await user.save();

        res.status(200).json({ success: true, message: "Task added successfully" })

    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
};
export const updateTask = async (req, res) => {
    try {
      const { taskId } = req.params;
  
      const user = await User.findById(req.user._id);
  
      user.task = user.tasks.find(
        (task) => task._id.toString() === taskId.toString()
      );
  
      user.task.completed = !user.task.completed;
  
      await user.save();
  
      res
        .status(200)
        .json({ success: true, message: "Task Updated successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        sendToken(res, user, 201, `Welcome back! ${user.name}`)


    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
};

export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const { name } = req.body;

        const avatar = req.files.avatar.tempFilePath;

        if (name) user.name = name;

        if (avatar) {

            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
            
            const mycloud = await cloudinary.v2.uploader.upload(avatar, {
                folder: "todoApp"
            })

            fs.rmSync("./tmp", { recursive: true })

            user.avatar = {
                public_id: mycloud.public_id,
                url: mycloud.secure_url
            }
        }

        await user.save();

        res.status(200).json({ success: true, message: "Profile updated successfully" });

    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
};

export const updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");

        const { oldPassword, newPassword } = req.body;

        if(!oldPassword || !newPassword){
            return res
               .status(400)
               .json({ success: false, message: "Please enter both Old Password and New Password" });
        }

        const isMatch = await user.comparePassword(oldPassword);

        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid Old Password" });
        }

        user.password = newPassword;

        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully" });

    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
};

export const forgetPassword = async (req, res) => {
    try {
        const { email} = req.body;

        const user = await User.findOne({ email: email });

        if (!user) {
            return res
               .status(404)
               .json({ success: false, message: "Invalid email" });
        }

        const otp = Math.floor(Math.random() * 1000000);

        
        user.resetPasswordOtp = otp
        user.resetPasswordOtp_expiry= Date.now() + 10 * 60 * 1000;

        await user.save();

        const message = `Your OTP for reseting the password is ${otp}. If you did not request for this, please igonore this email.`

        await sendMail(email, "Request for Reseting Password", message);

        sendToken(res, 201, "OTP Sent to your email please verify your account")

        res.status(200).json({ success: true, message: `OTP sent to ${email}` });

    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { otp, newPassword } = req.body;

        const user = await User.findOne({ resetPasswordOtp: otp, resetPasswordOtp_expiry: {$gt: Date.now()}}).select("+password");

        if (!user) {
            return res
               .status(404)
               .json({ success: false, message: "Otp Invalid or has been expired" });
        }

        
        user.password =  newPassword;
        user.resetPasswordOtp = null;
        user.resetPasswordOtp_expiry= null;


        await user.save();

        res.status(200).json({ success: true, message: "Password Changed Successfully" });

    } catch (e) {
        res.status(500).json({ success: false, message: e.message })
    }
};


