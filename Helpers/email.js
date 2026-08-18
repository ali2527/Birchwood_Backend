const nodemailer = require("nodemailer");

const smtpConfig = {
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== "false",
  },
};

module.exports = {
  generateEmail: async (email, subject, html) => {
    try {
      const transporter = nodemailer.createTransport(smtpConfig);
      const mailOptions = {
        to: email,
        subject,
        text: "",
        html,
      };
      await transporter.sendMail(mailOptions);
      return true;
    } catch (err) {
      console.log("err in generate email: ", err);
      return false;
    }
  },
};
