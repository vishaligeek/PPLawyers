import { Request, Response } from "express";
import { sendAdminEmail } from "../utils/email";

export const contactUs = async (req, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      telephone,
      referredBy,
      referredToLawyer,
      preferredContactMethod,
      message,
    } = req.body;

    if (!firstName) {
      res.status(400).json({ message: "Please enter your first name." });
      return;
    } else if (!lastName) {
      res.status(400).json({ message: "Please enter your last name." });
      return;
    } else if (!email) {
      res.status(400).json({ message: "Please enter your email." });
      return;
    } else if (!telephone) {
      res.status(400).json({ message: "Please enter your contact number." });
      return;
    } else if (!message) {
      res.status(400).json({ message: "Please add a message." });
      return;
    }

    function validateEmail(email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email);
    }

    if (!validateEmail(email)) {
      res.status(400).json({ message: "Please enter a valid email address." });
      return;
    }
    await sendAdminEmail({
      firstName,
      lastName,
      email,
      telephone,
      referredBy,
      referredToLawyer,
      preferredContactMethod,
      message,
    });

    res
      .status(200)
      .json({ message: "Your inquiry has been sent successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to send inquiry. Please try again later." });
  }
};
