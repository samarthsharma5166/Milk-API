import nodemailer from 'nodemailer'
const auth = nodemailer.createTransport({
    service: 'gmail',
    secure:true,
    port:465,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

const mailOptions = {
    from: process.env.EMAIL,
    to: '',
    subject: 'OTP',
    text: 'That was easy!'
};

export {auth,mailOptions}