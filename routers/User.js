import express from "express";
import { addTask, forgetPassword, getMyProfile, login, logout, register, removeTask, resetPassword, updatePassword, updateProfile, updateTask, verify } from "../controllers/User.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.route("/register").post(register)

router.route("/verify").post(isAuthenticated, verify);

router.route("/login").post(login);

router.route("/logout").get(logout);

router.route("/newtask").post(isAuthenticated, addTask);

router.route("/me").get(isAuthenticated, getMyProfile);

router
    .route("/task/:taskId")
    .delete(isAuthenticated, removeTask)
    .get(isAuthenticated, updateTask);

router.route("/updateprofile").put(isAuthenticated, updateProfile);
router.route("/updatepassword").put(isAuthenticated, updatePassword);

router.route("/forgetpassword").post(forgetPassword);

router.route("/resetpassword").post(resetPassword);

export default router;