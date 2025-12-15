import express from 'express'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import cors from 'cors'



dotenv.config()
connectDB()

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // frontend URL
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);


app.get('/', (req, res) => {
    res.send('Hello World!');
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});