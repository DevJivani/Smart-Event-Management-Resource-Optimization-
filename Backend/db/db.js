import mongoose from 'mongoose';

const connectDb = async () =>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Mongodb Connected Successfully");
        
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}

export default connectDb;

