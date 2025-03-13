import { Request, Response } from "express";
import * as passwordHelper from "../helpers/password.helper";
import User from "../db/models/user";
import { generateJWTAccessToken } from "../middleware/adminCheck";

export interface UserDetails {
  username: string;
  email: string;
  password: string;
}

export const userRegister = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ email: email });
    if (existing) {
      res.status(403).json({ message: "User with email already exists." });
      return;
    }
    if (!password) {
      res.status(404).json({ message: "Password is required to create user." });
      return;
    }
    let encryptedMessage = "";
    encryptedMessage = await passwordHelper.encryptPassword(password);
    const user = await User.create({
      username,
      email,
      password: encryptedMessage,
    });
    res.status(200).json({ message: "User created.", user });
  } catch (error) {
    res.status(500).json({ message: "Server error.", e: error.message });
  }
};

export const userLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
      res.status(404).json({ message: "User not found.", isError: true });
      return;
    }
    const encryptedMessage = await passwordHelper.decryptPassword(
      password,
      user.password
    );
    if (!encryptedMessage) {
      res.status(401).json({
        message: "Incorrect password. Please try again.",
        isError: true,
      });
      return;
    }
    const token = generateJWTAccessToken(user);

    res.status(200).json({
      message: "Login successful.",
      token,
      user,
    });
  } catch (error) {
    res.status(403).json({ message: "Error logging in user." });
  }
};
