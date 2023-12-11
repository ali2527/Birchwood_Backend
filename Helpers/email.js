const nodemailer = require("nodemailer");
var smtpConfig = {
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {rejectUnauthorized: false},
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
      const res = await transporter.sendMail(mailOptions);
      // console.log(res);
      return true;
    } catch (err) {
      console.log("err in generate email: ", err);
      return true;
    }
  },
};
