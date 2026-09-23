import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import customerRoutes from "./routes/customer.routes.js";
import cookieParser from "cookie-parser";
import productsRouter from './routes/product.routes.js';
import wishlistRouter from './routes/wishlist.routes.js';


const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());


dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.log("MongoDB connection failed:", error.message);
  });
app.use(express.json());



app.use("/customers", customerRoutes);
app.use("/products",productsRouter);
app.use("/wishlist",wishlistRouter);


app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});