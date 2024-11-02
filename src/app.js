import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit: "15kb"}))
app.use(express.urlencoded({extended:true,limit: "15kb"}))
app.use(express.static("public"));

app.use(cookieParser())

import userrouter from "./routes/user.routes.js";
import commenrouter from "./routes/comment.routes.js";
import dashboardrouter from "./routes/dashboard.routes.js";
import healthcheckrouter from "./routes/healthcheck.routes.js";
import likerouter from "./routes/like.routes.js";
import playlistrouter from "./routes/playlist.routes.js";
import subscriptionrouter from "./routes/subscription.routes.js";
import tweetrouter from "./routes/tweet.routes.js";
import videorouter from "./routes/video.routes.js";

app.use('/api/v1/users',userrouter);
app.use('/api/v1/healthcheck',healthcheckrouter);
app.use('/api/v1/comments',commenrouter);
app.use('/api/v1/dashboard',dashboardrouter);
app.use('/api/v1/likes',likerouter);
app.use('/api/v1/playlists',playlistrouter);
app.use('/api/v1/tweets',tweetrouter);
app.use('/api/v1/subscriptions',subscriptionrouter);
app.use('/api/v1/videos',videorouter);
export {app};