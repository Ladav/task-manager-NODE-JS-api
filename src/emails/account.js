const sendgrid = require('@sendgrid/mail');

sendgrid.setApiKey(process.env.SENDGRID_KEY);

const sendWelcomeEmail = (email, name) => {
    sendgrid.send({
        from: 'temporaryfaltu2@gmail.com',
        to: email,
        subject: 'Thanks for joining in!',
        text: `Welcome to the App, ${name}, let us know how things go with the app.`
    });
};

const sendCancelationEmail = (email, name) => {
    sendgrid.send({
        from: 'temporaryfaltu2@gmail.com',
        to: email,
        subject: 'Sorry to see you go!',
        text: `It is sad to say goodbye to you ${name} but we have to, so GoodBye!, hope to see you back sometime soon.`
    });
};

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
};