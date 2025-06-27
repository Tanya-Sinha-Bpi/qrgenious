import nodemailer from 'nodemailer';
import dotenv from "dotenv";

dotenv.config();

export const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    // service: 'smtp.gmail.com',
    // port:465,
    // secure:true,
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    to: email,
    from: '"Hey 👻" <info@shouryasinha.com>',
    subject: 'Your OTP for Registration',
    html: `<h1>Your OTP: ${otp}</h1><p>Valid for 10 minutes</p>`
  });
};

// import nodeMailer from "nodemailer";
// import dotenv from "dotenv";
// dotenv.config();

// const sendMail = async(emailData)=>{
//     try {
//         let transporter = nodeMailer.createTransport({
//             host:"smtp.gmail.com",
//             port:465,
//             secure:true,
//             auth:{
//                 user:process.env.MAIL_ID,
//                 pass:process.env.MAIL_PASSWORD
//             }
//         });

//         let info = await transporter.sendMail({
//             from: '"Hey 👻" <info@shouryasinha.com>',
//             to:emailData.recipient,
//             subject: emailData.subject,
//             text: emailData.text,
//             html: emailData.html,
//         });
//         return info;
//     } catch (error) {
//         console.error("Error sending email:", error);
//         throw error;
//     }
// }
// export default sendMail;