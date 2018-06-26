const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 80;

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
})