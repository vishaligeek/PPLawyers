import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
const app = express();
const morgan = require("morgan");

const authRoutes = require("./routes/user");
const postRoutes = require("./routes/post");

dotenv.config();
require("./db/config/config").connect();

app.use(morgan("dev"));
app.use(express.json());
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));
app.use(cors());

// Routes
app.use("/auth", authRoutes);
app.use("/post", postRoutes);

app.use(express.static("public"));

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
