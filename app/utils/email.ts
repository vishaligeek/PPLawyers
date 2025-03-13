import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
require("dotenv").config();

const { EMAIL_ADMIN_ADDRESS, EMAIL_ADMIN_PASSWORD } = process.env;

interface EmailData {
  firstName: string;
  lastName: string;
  email: string;
  telephone: number;
  referredBy?: string;
  referredToLawyer?: string;
  preferredContactMethod: string;
  message: string;
}

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
      user: EMAIL_ADMIN_ADDRESS, 
      pass: EMAIL_ADMIN_PASSWORD
  },
  tls: {
      ciphers: 'SSLv3' 
  }
});

export const sendAdminEmail = async (data: EmailData) => {
  try {
    const templatePath = path.join(__dirname, "templates", "adminEmail.html");
    const htmlContent = await ejs.renderFile(templatePath, data);
    const logoPath = path.join(
      __dirname,
      "templates",
      "PAUL & PAUL LAWYERS.png"
    );
    const coverImagePath = path.join(__dirname, "templates", "Mask group.png");
    const bgImagePath = path.join(__dirname, "templates", "Vector.png");
    
    const mailOptions = {
      from: EMAIL_ADMIN_ADDRESS,
      to: data.email,
      subject: "New Client Inquiry",
      html: htmlContent,
      attachments: [
        {
          filename: "PAUL & PAUL LAWYERS.png",
          path: logoPath,
          cid: "logo@unique",
        },
        {
          filename: "Mask group.png",
          path: coverImagePath,
          cid: "cover@unique",
        },
        {
          filename: "Vector.png",
          path: bgImagePath,
          cid: "bgimg@unique",
        },
      ],
    };
    
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
