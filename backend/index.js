import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import customerRoutes from "./routes/customer.routes.js";
import cookieParser from "cookie-parser";


const app = express();

app.use(cookieParser());


dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.log("MongoDB connection failed:", error.message);
  });
app.use(express.json());



app.use("/customers", customerRoutes);


app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});