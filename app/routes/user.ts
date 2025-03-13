import { Router } from "express";
const router = Router();
import { userLogin, userRegister } from "../controllers/user";

router.post("/register", userRegister);
router.post("/signin", userLogin);

module.exports = router;
