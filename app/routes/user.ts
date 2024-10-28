import { Router } from "express";
import {  userLogin, userRegister } from "../controllers/user"; 

const router = Router();

router.post("/register", userRegister);
router.post("/signin", userLogin);

module.exports = router;
