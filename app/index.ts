import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
const app = express();


const authRoutes = require('./routes/user');
const postRoutes = require('./routes/post');

dotenv.config();
require('./db/config/config').connect();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());


// Routes
app.use('/auth', authRoutes);
app.use('/post', postRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
