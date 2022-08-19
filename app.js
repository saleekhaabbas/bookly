const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const hbs = require("express-handlebars");
const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");

const app = express();
const db = require("./config/connection");
const session = require("express-session");
const nocache = require("nocache");
const fileUpload = require("express-fileupload");
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  hbs.engine({
    helpers: {
      inc: (value) => {
        return parseInt(value) + 1;
      },
    },
    extname: "hbs",
    defaultLayout: "layout",
    layoutDir: __dirname + "/views/layouts/",
    adminDir: __dirname + "/views/admin/",
    userDir: __dirname + "/views/user/",
    partialsDir: __dirname + "/views/partials",
  })
);
app.use(logger("dev"));
app.use(express.json());
app.use(nocache());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
app.use("/public", express.static(__dirname + "/public"));
app.use(session({ secret: "key", cookie: { maxAge: 600000 } }));
db.connect((err) => {
  if (err) console.log("connection error: " + err);
  else console.log("database connected");
});
app.use(fileUpload());
app.use("/", userRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  // next(createError(404, { layout: "layout" }));
  res.render("error", { layout: "layout" });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500, { layout: "layout" });
  res.render("error");
});

module.exports = app;
