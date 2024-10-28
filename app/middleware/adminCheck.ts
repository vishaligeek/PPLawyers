import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../db/models/user";

export interface IadminUserRequest extends Request {
  user: any;
}

const generateJWTAccessToken = (user: any) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWTKEY);
  return token;
};

const adminVerify = async (
  req: IadminUserRequest,
  res: Response,
  next: NextFunction
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
 
  if (!token) {
    res.status(400).json("Token is required");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWTKEY) as {
      _id: string;
      email: string;
    };

    const user = await User.findById(decoded._id);

    if (!user) {
      res.status(404).json({
        message: "User not Found",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ message: "Unauthorized!", error: error.message });
  }
};

export { adminVerify, generateJWTAccessToken };
