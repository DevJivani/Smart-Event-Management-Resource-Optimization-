import express from 'express';
import cors from "cors";
import cookieparser from "cookie-parser";
import userRouter from "./Routes/user.route.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

// when data arrive in server from the frontend side so that data send by the url, json form,etc.. , if out of limit data send to the server so server can be crashed so we can add limit 

app.use(express.json({limit:"16mb"}))
app.use(express.urlencoded())

// when any document like images,pdf,etc.. upload in server and if document stored in server side in public folder so we can do

app.use(express.static("public"))

// cookieparser - server can access the cookies that stored in user browser and also server can do the crudoperation on the cookie

app.use(cookieparser())


app.use("/api/v1/user", userRouter);


export { app };