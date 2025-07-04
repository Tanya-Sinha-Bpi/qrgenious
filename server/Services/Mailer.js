import nodeMailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const sendMail = async (emailData) => {
    try {
        let transporter = nodeMailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        let info = await transporter.sendMail({
            from: 'QR Generator Web App <qr_generator-noreply@qrg.com>',
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.html,
        });
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}

export default sendMail;