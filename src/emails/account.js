const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'viveksvamja@yopmail.com',
        subject: 'Thanks for joining us!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app. `
    })
}

const sendCancellationMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'viveksvamja@yopmail.com',
        subject: 'Cancellation Email!',
        text: `Hello, ${name}. Let me know why you have cancelled your account. `
    })
}


module.exports = {
    sendWelcomeMail,
    sendCancellationMail
}