import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import connectDb from './db/db.js';

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

