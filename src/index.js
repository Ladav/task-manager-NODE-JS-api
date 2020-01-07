const app = require('./app');
const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server is Up and Running on port ${port}.`);
});