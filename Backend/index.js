import { app } from './app.js';
import connectDb from './db/db.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;

connectDb()
.then(()=>{
    app.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`);
    })
})
.catch((error)=>{
    console.error("Failed to start server due to database connection error:", error);
});

