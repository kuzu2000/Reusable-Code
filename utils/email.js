const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.HOST,
    port:process.env.EMAIL_PORT,
    auth: {
      user: process.env.USERNAME,
      pass: process.env.PASSWORD
    },
  });

  const mailOptions =  {
    from: 'Test <test@test.io>',
    to: options.email,
    subject: options.subject,
    text: message
  }

  await transporter.sendMail(mailOptions)
}

module.exports = sendEmail


