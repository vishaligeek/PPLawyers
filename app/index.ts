import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { publishScheduledPosts } from "./cron/publishScheduledPosts";
// import { setAndLockRetentionPolicy } from "./helpers/gcpStorage";
const app = express();
const morgan = require("morgan");

const authRoutes = require("./routes/user");
const postRoutes = require("./routes/post");
const cotactRoutes = require("./routes/contact");

dotenv.config();
require("./db/config/config").connect();

app.use(morgan("dev"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));
// Routes
app.use("/auth", authRoutes);
app.use("/post", postRoutes);
app.use("/contact", cotactRoutes);

// Start the server
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  publishScheduledPosts();
  // setAndLockRetentionPolicy()
});
