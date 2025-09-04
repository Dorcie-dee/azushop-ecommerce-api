import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRouter from "./routes/authRoute.js";
import categoryRouter from "./routes/categoryRoute.js";



const app = express();
const port = process.env.PORT || 5000;


//global middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



//routes
app.use("/api/auth", authRouter);
app.use("/api", categoryRouter);



//database connection
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully.");


    app.get("/", (req, res) => {
      res.json({
        status: "success",
        message: "AzuShop Ecommerce API",
        testSignupEndpoint: "/api/auth/signup/user (POST)"
      });
    });


    //listening for incoming request
    app.listen(port, () => {
      console.log('Server listening attentively');
    });

  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);    //exit process if DB connection fails
  }
})();