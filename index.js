import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import purchaseRoutes from "./routes/purchaseRoutes.js";
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import cors from 'cors'



connectDB()

const app = express();

app.use(cors({
  origin: '*', // frontend URL
  // origin: 'https://ecommece-meh-frontend.vercel.app',
  credentials: true,
}));
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use('/api/prescriptions', prescriptionRoutes);


app.get('/', (req, res) => {
    res.send('Hello World!');
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});