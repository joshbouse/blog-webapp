import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(express.static("public"));

app.get("/", async (req, res) => {
  if (req.isAuthenticated()) {
    const result = await db.query("SELECT title, post, id FROM posts WHERE user_id=$1 ORDER BY id DESC", [req.user.id]);
    // console.log(result.rows);
    if (result.rows.length > 0) {
      const Posts = result.rows;
      res.render("index.ejs", { Posts: Posts });
    } else {
      const Posts = [];
      res.render("index.ejs", { Posts });
    }
  } else {
    res.render("signup.ejs");
  }
});

app.get("/compose", (req, res) => {
  res.render("compose.ejs");
});

app.post("/submit", async (req, res) => {
  try {
    if (req.isAuthenticated) {
      const title = req.body.title;
      const body = req.body.content;
      await db.query("INSERT INTO posts (title, post, user_id) values ($1, $2, $3)", [title, body, req.user.id]);
      res.redirect("/");
    } else {
      alert("Session expired, please sign back in.");
      res.redirect("/");
    }
  } catch (error) {
    console.log(error);
    alert("Server error, please try again.");
    res.redirect("/");
  }
});

app.get("/edit", async (req, res) => {
  const postId = req.query.Post;
  const postUserId = (await db.query("SELECT user_id FROM posts WHERE id = $1", [postId])).rows[0].user_id;
  const userId = req.user.id;
  if (req.isAuthenticated && postUserId === userId) {
    const postId = req.query.Post;
    const result = await db.query("SELECT title, post, id from posts WHERE id=$1", [postId])
    const Post = result.rows[0];
    res.render("edit.ejs", { Post });
  } else {
    res.redirect("/");
  }
});

app.post("/return", async (req, res) => {
  if (req.isAuthenticated) {
    //get post index to change from URL
    const id = req.query.Post;
    //set the post to the edited contents
    const postTitle = req.body.title;
    const postContent = req.body.content;
    await db.query("UPDATE posts SET title = $1, post = $2 WHERE id = $3", [postTitle, postContent, id]);
    res.redirect("/");
  } else {
    res.redirect("/");
  }
});

app.get("/delete", async (req, res) => {
  const postId = req.query.Post;
  const postUserId = (await db.query("SELECT user_id FROM posts WHERE id = $1", [postId])).rows[0].user_id;
  const userId = req.user.id;
  if (req.isAuthenticated && postUserId === userId) {
    await db.query("DELETE FROM posts WHERE id = $1", [postId]);
    res.redirect("/");
  } else {
    res.redirect("/");
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/blog",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/",
  })
);

app.post('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// passport.use(
//   "local",
//   new Strategy(async function verify(username, password, cb) {
//     try {
//       const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
//         username,
//       ]);
//       if (result.rows.length > 0) {
//         const user = result.rows[0];
//         const storedHashedPassword = user.password;
//         bcrypt.compare(password, storedHashedPassword, (err, valid) => {
//           if (err) {
//             console.error("Error comparing passwords:", err);
//             return cb(err);
//           } else {
//             if (valid) {
//               return cb(null, user);
//             } else {
//               return cb(null, false);
//             }
//           }
//         });
//       } else {
//         return cb("User not found");
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   })
// );

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/blog",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        // console.log(profile);
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)",
            [profile.email, "google"]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);
passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});