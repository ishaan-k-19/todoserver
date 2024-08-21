import mongoose from "mongoose";

export const connectDB = (uri) => {
    mongoose.connect(uri, { dbName: "chatApp"})
    .then((data) => {
        console.log(`Connected to database: ${data.connection.host}`);
    })
    .catch((err) => {throw err;});
}