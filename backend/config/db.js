const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // CHANGED: from process.env.MONGO_URI to process.env.MONGODB_URI
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;