import {Router} from "express";
import { userLogin, userLogout, userRegisteration } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(userRegisteration);
router.route("/login").post(userLogin)
router.route("/logout").get(userLogout)

export default router;
