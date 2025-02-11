import express from "express";

const app = express();
const port = 3000;

app.use(express.urlencoded({extended: true}));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index.ejs", {Posts});
});

app.get("/compose", (req, res) => {
  res.render("compose.ejs");
});

const Posts = [];

function Post(title, content){
  this.postTitle = title;
  this.postContent = content;
  Posts.push(this);
}

app.post("/submit", (req, res) =>{
  new Post(req.body.title, req.body.content);
  res.render("index.ejs", {Posts});
});

app.get("/edit", (req, res) => {
  const index = req.query.Post;
  const editPost = Posts[index];
  res.render("edit.ejs", {Post: editPost, Posts});
});

app.post("/return", (req, res) =>{
  //get post index to change from URL
  const index = req.query.Post;
  //declare which post we're changing
  const editPost = Posts[index];
  //set the post to the edited contents
  editPost.postTitle = req.body.title;
  editPost.postContent = req.body.content;
  res.render("index.ejs", {Posts});
});

app.get("/delete", (req, res) => {
  const index = req.query.Post;
  Posts.splice(index, 1);
  res.render("index.ejs", {Posts});
});

app.get("/confirm", (req, res) => {
  const deleteIndex = req.query.Post;
  res.render("index.ejs", {Posts, deleteIndex});
});