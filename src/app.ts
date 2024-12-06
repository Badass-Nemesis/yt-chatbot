import express from 'express';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// this is just for checking if the server is running or not
app.get('/', (req, res) => {
    res.send('Hello World!');
});

export default app;