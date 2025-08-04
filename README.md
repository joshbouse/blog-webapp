This is a Blog WebApp featuring logins with Google OAuth 2.0 for signin, and connects to a PostgresQL database for persistent per-user data storage.

If you wish to use the app, download the Repo, setup a PostgreSQL database (commands below), create a .env file and input the required info, cd into the folder, install the packages with npm i, and start the server with nodemon index.js.

create table users(
    id serial primary key not null,
    email varchar(100),
    password varchar(100)
)

create table posts(
    id serial primary key not null,
    user_id integer references users (id) not null,
    title varchar(100),
    post varchar(20000)
)

Screenshots:

![Sign-in page](/Screenshots/account.png)

![Blog page](/Screenshots/blog.png)
