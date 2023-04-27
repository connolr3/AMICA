//--------------Resources----------------------------
//How to kill server
//https://superuser.com/questions/1411293/how-to-kill-a-localhost8080



//---------------------------Express-------------------------------------
const express = require("express");
//Get access to all properties and functions of express
const app = express();

//---------------------------Express & SQL Sessions----------------------------
const session = require("express-session"); // to enable flash messages
//use sessions automatically in my sql using the following module;
//info: https://www.npmjs.com/package/express-mysql-session
const MySQLStore = require("express-mysql-session")(session);

//------------------------File upload------------------------------------------
const fileUpload = require("express-fileupload");
app.use(fileUpload());

//-----------------Views----------------------------------------------------------
const path = require("path");
// configure express to use the EJS engine
app.set("view engine", "ejs");
//configure the directory (‘folder’) where EJS finds its templates
app.set("views", path.join(__dirname, "./views"));

//tell express where stuff is
app.use(express.static("assets"));
//port we run app on
const PORT = process.env.PORT || 3000;

const bodyParser = require('body-parser'); //allows us to read content from body - form processing login/reg
const bcrypt = require("bcryptjs")
    //include the Body Parsermodule.
    //let express know how to interpret your form data
const urlencodedParser = bodyParser.urlencoded({
    extended: false
});








const { check, validationResult } = require("express-validator");
//create a validation variable, that contains all the rules you want to
//apply to the data from a specific post request parameter
let validationObject = [
    check("name").exists().trim().escape(),
    check("email").trim().isEmail().escape(),

];
//this is a library - the sql library wouldn't work so you are using sql12
const mysql = require("mysql2");

//.env file contains all secure info for mysql
const dotenv = require("dotenv");
const { url } = require("inspector");
dotenv.config();



//configure the directory (‘folder’) for specific route for styling stuff
//Any request which matches an actual file in the assets folder will be responded to by providing the contents of that file
app.use(express.static(path.join(__dirname, "./assets")));
// parse application/json
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: false }))
const DBCONFIG = {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
};

// Re-use the DB_CONFIG set up for our main DB connection:
const sessionStore = new MySQLStore(DBCONFIG);

//------------------------Sessions--------------------------------------------------
app.use(
    session({
        key: "session_cookie_name",
        secret: "session_cookie_secret",
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
    })
);
sessionStore
    .onReady()
    .then(() => {
        // MySQL session store ready for use.
        console.log("MySQLStore ready (session store)");
    })
    .catch((error) => {
        // Something went wrong.
        console.error("MySQLStore error", error);
    });

//------------------------------Init---------------------------------------
//DB Connection
let connection = mysql.createConnection(DBCONFIG);
connection.connect(onConnectionReady);
app.listen(PORT, () => {
    console.log("App running on http://localhost:" + PORT);
});

function onConnectionReady(err) {
    if (err != null) {
        console.error("connection error. Details below.");
        console.error('error: ' + err);
        console.error(err);
    } else {
        console.log("mySQL connection ready!");
    }
}
const nodemailer = require("nodemailer");
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
        clientId: process.env.OAUTH_CLIENTID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN
    }
});


//-----------ROUTE:----------- to main gallery/discovery page-----------------------------
app.get("/posts", (req, res) => {

    const query = "SELECT *,(SELECT DATE_FORMAT(post_date, '%M %d %Y')) as post_date ,(SELECT users.user_username FROM users WHERE users.user_id = posts.user_id)as username, (select COUNT(post_id) from likes where likes.post_id =posts.post_id) AS like_count ,(select COUNT(post_id) from comments where comments.post_id =posts.post_id) AS comment_count FROM posts ORDER BY (like_count+ comment_count) DESC LIMIT 50;";

    connection.query(query, function(err, result, _fields) {
        if (err != null) {
            console.error(err);
            return;
        }
        const query_session = "select * from sessions order by expires desc limit 1";
        connection.query(query_session, function(err2, result_session, _fields) {
            if (err2 != null) {
                console.error(err2);
                return;
            } else if (result_session.length < 1) {
                //no session exists TODO
            }

            const { username_test } = req.session;
            console.log(req.session.username);
            var logged_in = false;
            if (req.session.username != undefined) {
                logged_in = true;
            }
            res.render("posts-list", {
                data: {
                    posts: result,
                    username: req.session.username,
                    logged_in: logged_in
                },
            });
        });
    });
});



//-----------ROUTE:----------- to main gallery/discovery page-----------------------------
app.get("/feed", (req, res) => {
    console.log("Liking an Image!");
    var logged_in = false;
    if (req.session.username != undefined) {
        logged_in = true;
    }
    if (!logged_in) {
        alert("You need to login, or create an account first!");
        res.redirect('/');
    }
    const query = "SELECT *,(SELECT DATE_FORMAT(post_date, '%M %d %Y')) as post_date ,(SELECT users.user_username FROM users WHERE users.user_id = posts.user_id)as username, (select COUNT(post_id) from likes where likes.post_id =posts.post_id) AS like_count ,(select COUNT(post_id) from comments where comments.post_id =posts.post_id) AS comment_count FROM posts INNER JOIN followers ON posts.user_id = followers.following_id WHERE followers.follower_id=" + req.session.user_id;
    console.log(query);
    connection.query(query, function(err, result, _fields) {
        if (err != null) {
            console.error(err);
            return;
        }
        const query_session = "select * from sessions order by expires desc limit 1";
        connection.query(query_session, function(err2, result_session, _fields) {
            if (err2 != null) {
                console.error(err2);
                return;
            } else if (result_session.length < 1) {
                //no session exists TODO
            }

            const { username_test } = req.session;
            console.log(req.session.username);
            var logged_in = false;
            if (req.session.username != undefined) {
                logged_in = true;
            }
            res.render("feed", {
                data: {
                    posts: result,
                    username: req.session.username,
                    logged_in: logged_in
                },
            });
        });
    });
});


//-----------ROUTE:------------saves last post viewed in session-----------------------------
app.get("/one-post/:id", (req, res) => {
    req.session.last_post_viewed_id = parseInt(req.params.id);
    res.redirect("/one-post-display")
});

app.get("/my-post/:id", (req, res) => {
    req.session.last_post_viewed_id = parseInt(req.params.id);
    res.redirect("/my-post-display")
});

app.get("/edit-profile/", (req, res) => {

    const query = "SELECT * FROM `users` WHERE user_id =" + req.session.user_id;
    connection.query(query, function(err, result, _fields) {
        if (err != null) {
            console.error(err);
            return;
        }
        res.render("edit-profile", {
            data: {
                user: result,
            },
        });

    });
});

app.post("/update-bio", (req, res) => {
    //UPDATE `posts` SET `caption` = 'spot the IDMers!' WHERE `posts`.`post_id` = 1;
    connection.query(
        "UPDATE users SET user_bio = ? where user_id =?", [req.body.bio, req.session.user_id],
        (dbErr, dbResults) => {
            console.log(dbErr, dbResults);
        }
    );
    alert("You have successfully changed your bio!");
    res.redirect('/profile/');
});
app.post("/update-name", (req, res) => {
    //UPDATE `posts` SET `caption` = 'spot the IDMers!' WHERE `posts`.`post_id` = 1;
    connection.query(
        "UPDATE users SET user_name = ? where user_id =?", [req.body.name, req.session.user_id],
        (dbErr, dbResults) => {
            console.log(dbErr, dbResults);
        }
    );

    alert("You have successfully changed your display name!");
    res.redirect('/profile/');
});



//-----------ROUTE:----------- to your own post page displaying extra details-----------------------------
app.get("/my-post-display", (req, res) => {
    //   const targetPostId = parseInt(req.session.last_post_viewed_id);
    var targetPostId = parseInt(req.session.last_post_viewed_id);
    const query = "SELECT *, (select COUNT(post_id) from likes where post_id = " + targetPostId + ") AS like_count ,  (select COUNT(post_id) from comments where post_id = " + targetPostId + ") AS comment_count  FROM posts INNER JOIN users ON users.user_id=posts.user_id where posts.post_id = " + targetPostId;
    //who commented on the post
    const query2 = "SELECT *,(SELECT DATE_FORMAT(comment_date, '%M %d %Y')) as comment_date FROM comments INNER JOIN users ON users.user_id=comments.user_id WHERE comments.post_id= " + targetPostId;
    // console.log(query3);
    //who liked the post
    const query3 = "SELECT * FROM users INNER JOIN likes ON users.user_id=likes.user_id WHERE likes.post_id=" + targetPostId;

    connection.query(query, function(err, result, _fields) {
        if (err != null) {
            console.error(err);
            return;
        }
        connection.query(query2, function(err2, result2, _fields) {
            if (err != null) {
                console.error(err2);
                return;
            }
            connection.query(query3, function(err3, result3, _fields) {
                if (err != null) {
                    console.error(err3);
                    return;
                }
                res.render("edit-post", {
                    data: {
                        posts: result,
                        comments: result2,
                        likes: result3
                    },
                });
            });

        });

    });


});




//-----------ROUTE:----------- to individual post page displaying extra details-----------------------------
app.get("/one-post-display", (req, res) => {
    const targetPostId = parseInt(req.session.last_post_viewed_id);
    const query = "SELECT *, (select COUNT(post_id) from likes where post_id = " + targetPostId + ") AS like_count ,  (select COUNT(post_id) from comments where post_id = " + targetPostId + ") AS comment_count ,(SELECT DATE_FORMAT(post_date, '%M %d %Y')) as post_date FROM posts INNER JOIN users ON users.user_id=posts.user_id where posts.post_id = " + targetPostId;
    //who commented on the post
    //const query2 = "SELECT * FROM comments INNER JOIN users ON users.user_id=comments.user_id WHERE comments.post_id= " + targetPostId;
    const query2 = "SELECT *,(SELECT DATE_FORMAT(comment_date, '%M %d %Y %H:%m')) as comment_date FROM comments INNER JOIN users ON users.user_id=comments.user_id WHERE comments.post_id= " + targetPostId;
    //who liked the post
    const query3 = "SELECT *,(SELECT DATE_FORMAT(like_date, '%M %d %Y %H:%m')) as like_date  FROM users INNER JOIN likes ON users.user_id=likes.user_id WHERE likes.post_id=" + targetPostId;

    connection.query(query, function(err, result, _fields) {
        if (err != null) {
            console.error(err);
            return;
        }
        connection.query(query2, function(err2, result2, _fields) {
            if (err != null) {
                console.error(err2);
                return;
            }
            connection.query(query3, function(err3, result3, _fields) {
                if (err != null) {
                    console.error(err3);
                    return;
                }
                res.render("one-post", {
                    data: {
                        posts: result,
                        comments: result2,
                        likes: result3
                    },
                });
            });

        });

    });


});

//-----------ROUTE:----------- follow-----------------------------
app.get("/follow/", (req, res) => {
    console.log("Liking an Image!");
    var logged_in = false;
    if (req.session.username != undefined) {
        logged_in = true;
    }
    if (!logged_in) {
        alert("You need to login, or create an account first!");
        res.redirect("/one-profile/" + req.session.last_profile_viewed);
    }
    if (req.session.user_id == req.session.last_profile_viewed) {
        alert("You can't follow yourself! That's too sad...");
        res.redirect
    } else {
        const query = "INSERT into followers (follower_id ,following_id)VALUES (" + req.session.user_id + "," + req.session.last_profile_viewed + ")";
        connection.query(query, function(err, result, _fields) {
            if (err != null) {
                console.error(err);
                return;
            }
            alert("The beginning of a beautiful friendship! You'll now see this user's posts in your feed!");
            res.redirect("/one-profile/" + req.session.last_profile_viewed);
        });
    }
    return;
});



//-----------ROUTE:----------- unfollow-----------------------------
app.get("/unfollow/", (req, res) => {
    console.log("Liking an Image!");
    var logged_in = false;
    if (req.session.username != undefined) {
        logged_in = true;
    }
    if (!logged_in) {
        alert("You need to login, or create an account first!");
        res.redirect('/');
    }
    const query = "DELETE FROM followers where follower_id=" + req.session.user_id + " AND following_id=" + req.session.last_profile_viewed;
    connection.query(query, function(err, result, _fields) {
        if (err != null) {
            console.error(err);
            return;
        }
        alert("You are no longer following this user!");
        res.redirect("/one-profile/" + req.session.last_profile_viewed);
    });
});

//-----------ROUTE:----------user's own profile (must be logged in)-----------------------------
app.get("/profile/", (req, res) => {
    console.log("Liking an Image!");
    var logged_in = false;
    if (req.session.username != undefined) {
        logged_in = true;
    }
    if (!logged_in) {
        alert("You need to login, or create an account first!");
        res.redirect('/');
    }
    const query = "SELECT * FROM `users` WHERE user_id =" + req.session.user_id;
    const query2 = "SELECT *,(SELECT DATE_FORMAT(post_date, '%M %d %Y')) as post_date ,(SELECT users.user_username FROM users WHERE users.user_id = posts.user_id)as username, (select COUNT(post_id) from likes where likes.post_id =posts.post_id) AS like_count ,(select COUNT(post_id) from comments where comments.post_id =posts.post_id) AS comment_count FROM posts WHERE user_id=" + req.session.user_id;
    connection.query(query, function(err, result, _fields) {
        if (err != null) {
            console.error(err);
            return;
        }
        connection.query(query2, function(err2, result2, _fields) {
            if (err2 != null) {
                console.error(err2);
                return;
            }
            res.render("profile", {
                data: {
                    user_data: result,
                    user_posts: result2,
                },
            });
        });
    });



});


//-----------ROUTE:----------- to an individual profile-----------------------------
app.get("/one-profile/:id", (req, res) => {
    var logged_in = false;
    var already_following = false;
    req.session.last_profile_viewed = parseInt(req.params.id);
    if (req.session.username != undefined) {
        logged_in = true;
        const query = "SELECT * from followers WHERE follower_id=" + req.session.user_id + " AND following_id =" + req.session.last_profile_viewed;
        connection.query(query, function(err, result, _fields) {
            if (err != null) {
                console.error(err);
                return;
            }
            if (result.length > 0)
                already_following = true;
        });

    }
    const targetPostId = parseInt(req.params.id);
    const query = "SELECT * FROM `users` WHERE user_id =" + targetPostId;
    const query2 = "SELECT *,(SELECT DATE_FORMAT(post_date, '%M %d %Y')) as post_date ,(SELECT users.user_username FROM users WHERE users.user_id = posts.user_id)as username, (select COUNT(post_id) from likes where likes.post_id =posts.post_id) AS like_count ,(select COUNT(post_id) from comments where comments.post_id =posts.post_id) AS comment_count FROM posts WHERE user_id=" + targetPostId;
    const who_are_they_following = "SELECT *,(select COUNT(follower_id) from followers where follower_id =" + targetPostId + ") as count FROM `users` INNER JOIN  followers ON users.user_id=followers.following_id where followers.follower_id = " + targetPostId + ";";
    const who_is_following_them = "SELECT *,(select COUNT(follower_id) from followers where following_id =" + targetPostId + ") as count FROM `users` INNER JOIN  followers ON users.user_id=followers.follower_id where followers.following_id = " + targetPostId + ";";

    connection.query(query, function(err, result, _fields) {
        if (err != null) {
            console.error(err);
            return;
        }
        connection.query(query2, function(err2, result2, _fields) {
            if (err2 != null) {
                console.error(err2);
                return;
            }
            connection.query(who_are_they_following, function(err3, result3, _fields) {
                if (err3 != null) {
                    console.error(err3);
                    return;
                }
                connection.query(who_is_following_them, function(err4, result4, _fields) {
                    if (err4 != null) {
                        console.error(err4);
                        return;
                    }
                    res.render("one-profile", {
                        data: {
                            user_data: result,
                            user_posts: result2,
                            logged_in: logged_in,
                            already_following: already_following,
                            following: result3,
                            followers: result4,
                        },
                    });
                });
            });

        });
    });


});


//-----------ROUTE:----------- to upload an image (must be logged in)-----------------------------
app.get("/create/", (req, res) => {
    console.log("Liking an Image!");
    var logged_in = false;
    if (req.session.username != undefined) {
        logged_in = true;
    }
    if (!logged_in) {
        alert("You need to login, or create an account first!");
        res.redirect('/');
    }
    const targetPostId = parseInt(req.params.id);
    const query = "SELECT *  FROM posts  ";

    connection.query(query, function(err, result, _fields) {
        if (err != null) {
            console.error(err);
            return;
        }
        res.render("create", {
            data: {
                posts: result,
            },
        });
    });


});



//-----------ROUTE:----------home page, which doubles as login page-----------------------------
//if logged in send straight into app
app.get("/", (req, res) => {
    var logged_in = false;
    if (req.session.username != undefined) {
        logged_in = true;
    }
    //if not logged in session than send to home screen so user has option to login/register
    if (!logged_in) {
        res.render(
            "index", { data: { username: req.session.username, message: "" } }
        );
    }
    //if logged in session than send straight to main part of app - the discovery page
    else {
        res.redirect('posts');
    }

});




//-----------ROUTE:----------register-----------------------------
app.get("/register", (req, res) => {
    res.render("register");
});

//-----------ROUTE:----------TODO NOT SURE IF IN USE
//register the login/home route
app.get("/login", (req, res) => {
    res.render("login");
});


//-----------ROUTE:----------TODO NOT SURE IF IN USE
//register the login/home route
app.get("/forgot-password", (req, res) => {
    res.render("forgot-password.ejs");
});


//-----------ROUTE:----------new user - no page displayed just SQL queries executed and a redirect-----------------------------
app.post("/registernewuser", async(req, res) => {
    const check_existing_username = "SELECT * from users where user_username = '" + req.body.username + "'";
    const check_existing_email = "SELECT * from users where email = '" + req.body.email + "'";
    connection.query(
        check_existing_username,
        (dbErr, dbResult1) => {
            if ((dbResult1.length > 0)) {
                alert("This username has been taken!");
                return;
            } else {
                connection.query(
                    check_existing_email,
                    async(dbErr2, dbResult2) => {
                        if (!(dbResult2.length === 0)) {
                            alert("This email is already registered to an account!");
                        } else {
                            try {
                                const hashed_password = await bcrypt.hash(req.body.password, 10) //hash 10 times - a good default value!
                                console.log("reg a user function!");
                                connection.query(
                                    "INSERT INTO users(user_name,user_username,user_bio, user_pass,email) VALUES (?, ?, ?,?,?)", [req.body.name, req.body.username, req.body.bio, hashed_password, req.body.email],
                                    (dbErr, dbResults) => {
                                        console.log(dbErr, dbResults);
                                    }
                                );
                            } catch {
                                res.redirect("/register");
                            }
                            alert("Welcome to Amica! Your account has successfully been set up!");
                            const newuserquery = "SELECT * from users where user_username = '" + req.body.username + "'";
                            connection.query(newuserquery, function(err, result, _fields) {
                                if (err != null) {
                                    console.error(err);
                                    return;
                                } else {
                                    req.session.username = result[0].user_username;
                                    req.session.user_id = result[0].user_id;
                                    res.redirect('/posts');
                                }
                            });
                        }
                    }
                );
            }
        }
    );


    /*  else {
          try {
              const hashed_password = await bcrypt.hash(req.body.password, 10) //hash 10 times - a good default value!
              console.log("reg a user function!");
              connection.query(
                  "INSERT INTO users(user_name,user_username,user_bio, user_pass,email) VALUES (?, ?, ?,?,?)", [req.body.name, req.body.username, req.body.bio, hashed_password, req.body.email],
                  (dbErr, dbResults) => {
                      console.log(dbErr, dbResults);
                  }
              );
          } catch {
              res.redirect("/register");
          }
          alert("Welcome to Amica! Your account has successfully been set up!");
          const newuserquery = "SELECT * from users where user_username = '" + req.body.username + "'";
          connection.query(newuserquery, function(err, result, _fields) {
              if (err != null) {
                  console.error(err);
                  return;
              } else {
                  req.session.username = result[0].user_username;
                  req.session.user_id = result[0].user_id;
                  res.redirect('/posts');
              }
          });
      }*/
});

//-----------ROUTE:----------new user - no page displayed just SQL queries executed and a redirect-----------------------------
app.post("/delete-post", (req, res) => {

    const targetPostId = parseInt(req.session.last_post_viewed_id);
    const query = "SELECT *, (select COUNT(post_id) from likes where post_id = " + targetPostId + ") AS like_count ,  (select COUNT(post_id) from comments where post_id = " + targetPostId + ") AS comment_count  FROM posts INNER JOIN users ON users.user_id=posts.user_id where posts.post_id = " + targetPostId;
    //who commented on the post
    const query2 = "SELECT * FROM comments INNER JOIN users ON users.user_id=comments.user_id WHERE comments.post_id= " + targetPostId;
    //who liked the post
    const query3 = "SELECT * FROM users INNER JOIN likes ON users.user_id=likes.user_id WHERE likes.post_id=" + targetPostId;
    connection.query(query, function(err, result, _fields) {
        if (err != null) {
            console.error(err);
            return;
        }
        connection.query(query2, function(err2, result2, _fields) {
            if (err != null) {
                console.error(err2);
                return;
            }
            connection.query(query3, function(err3, result3, _fields) {
                if (err != null) {
                    console.error(err3);
                    return;
                } else {
                    res.render("are-you-sure", {
                        data: {
                            posts: result,
                            comments: result2,
                            likes: result3
                        },
                    });
                }
            });

        });

    });

});

app.get("/delete-post-confirmed", (req, res) => {
    const delete_query = "DELETE FROM posts WHERE post_id = " + req.session.last_post_viewed_id + " AND user_id = " + req.session.user_id;
    connection.query(delete_query,
        (dbErr, dbResults) => {
            console.log(dbErr, dbResults);
        }
    );
    alert("Your post was successfully deleted!");
    res.redirect("/profile/");
});




var alert = require('alert');

//-----------ROUTE:----------logout -> send back to home-----------------------------
app.get("/logout", (req, res) => {
    var logged_in = false;
    if (req.session.username != undefined) {
        logged_in = true;
    }
    if (!logged_in) {
        alert("but you're not logged in....!");
        return;
    }
    req.session.destroy((error) => {
        console.log(error);
    });
    /* connection.query(
         "DELETE from sessions where session_id = ?", [req.sessionID],
         (dbErr, dbResults) => {
             console.log(dbErr, dbResults);
         }
     );*/
    console.log("Logging out!");
    alert('You have been logged out!');
    res.redirect("/");

});

app.post("/loginolduser", async(req, res) => {
    var error_msg = "";
    console.log("logging in a user!");
    const hashed_password = await bcrypt.hash(req.body.password, 10) //hash 10 times - a good default value!
    const login_query = "SELECT * FROM users WHERE user_username = '" + req.body.name + "';";
    connection.query(
        login_query, [req.body.name, hashed_password],
        (dbErr, dbResult) => {
            if (dbResult.length === 0) {
                // No matching user; allow retry.
                error_msg = "We have no matching users!"
                    // res.redirect("/login");
                console.log(error_msg);
                res.render(
                    "index", { data: { message: error_msg } }
                );
            } else {
                const existing_password = dbResult[0].user_pass;
                bcrypt.compare(req.body.password, existing_password, function(err, result) {
                    if (result) {
                        console.log("User exists - log in");
                        // Do have matching user.  Store in session.
                        req.session.username = dbResult[0].user_username;
                        req.session.user_id = dbResult[0].user_id;
                        res.redirect('/posts');
                    } else {
                        // console.log('result');
                        // console.log(existing_password);
                        //    console.log(hashed_password);
                        error_msg = "Invalid password!";
                        // res.redirect("/login");
                        console.log(error_msg);
                        res.render(
                            "index", { data: { message: error_msg } }
                        );
                    }
                });

            }
        }
    );
});


app.get("/loginadmin", async(req, res) => {
    var error_msg = "";
    console.log("logging in a user!");

    const login_query = "SELECT * FROM users WHERE user_username = 'romaco';";
    connection.query(
        login_query,
        (dbErr, dbResult) => {
            if (dbResult.length === 0) {
                // No matching user; allow retry.
                error_msg = "We have no matching users!"
                    // res.redirect("/login");
                console.log(error_msg);
                res.render(
                    "index", { data: { message: error_msg } }
                );
            } else {
                console.log("It matches!")
                console.log("User exists - log in");
                // Do have matching user.  Store in session.
                req.session.username = dbResult[0].user_username;
                req.session.user_id = dbResult[0].user_id;
                res.redirect('/posts');
            }
        }
    );
});


app.post("/edit-caption", (req, res) => {
    //UPDATE `posts` SET `caption` = 'spot the IDMers!' WHERE `posts`.`post_id` = 1;
    const query = "UPDATE posts SET caption = '" + req.body.caption + "' WHERE post_id = " + req.session.last_post_viewed_id;
    connection.query(query, function(err, result, _fields) {
        if (err != null) {
            console.error(err);
            return;
        }
    });
    alert("You have successfully altered your caption!");
    res.redirect('/profile/');


});


const { handleUpload } = require("./filehandler");
const sharp = require("sharp");
const fs = require("fs/promises");
const { time } = require("console");


const acceptedTypes = ["image/gif", "image/jpeg", "image/png"];

app.post("/new-image", async(req, res) => {
    // console.log(req);
    //    console.log(req.body.files);
    const image = req.files.userImage;
    /*          check file type            */
    var this_extension = image.mimetype;
    var accepted_type = (acceptedTypes.indexOf(this_extension) >= 0);
    /*get current time - used to rename file to prevent overriding files of the same name*/
    var currentDate = new Date();
    var today = 'Y-m-d-m-s'
        .replace('Y', currentDate.getFullYear())
        .replace('m', currentDate.getMonth() + 1)
        .replace('d', currentDate.getDate())
        .replace('m', currentDate.getMinutes())
        .replace('s', currentDate.getSeconds());
    var newfilename = today + image.name;
    if (accepted_type) {
        const imageDestinationPath = __dirname + "/assets/posts-images/" + newfilename;
        const resizedImagePath =
            __dirname + "/assets/posts-images/resized/" + newfilename + time;

        await image.mv(imageDestinationPath).then(async() => {
            try {
                await sharp(imageDestinationPath)
                    .resize(750)
                    .toFile(resizedImagePath)
                    .then(() => {
                        fs.unlink(imageDestinationPath, function(err) {
                            if (err) throw err;
                            console.log(imageDestinationPath + " deleted");
                        });
                    });
            } catch (error) {
                console.log(error);
            }
        });
        /* store in mysql! */
        connection.query(
            "INSERT into posts (user_id,file_name,caption,post_date) VALUES (?, ? ,?,CURRENT_DATE)", [req.session.user_id, newfilename, req.body.caption],
            (dbErr, dbResults) => {
                console.log(dbErr, dbResults);
            }
        );
        alert("You have successfully posted your image!");
        res.redirect('/profile/');

    } else { //wrong file extension
        alert("Unaccepted File Type!");
        return;
    }


});






//-----------ROUTE:----------- like an image (must be logged in)-----------------------------
app.post("/like", (req, res) => {
    console.log("Liking an Image!");
    var logged_in = false;
    if (req.session.username != undefined) {
        logged_in = true;
    }
    if (!logged_in) {
        alert("You need to login, or create an account first!");
        res.redirect('/');
    }
    //check if already liked
    const query = "SELECT * FROM likes WHERE user_id =" + req.session.user_id + " AND post_id=" + req.session.last_post_viewed_id;
    connection.query(query, function(err, result, _fields) {
        if (err != null) {
            console.error(err);
            return;
        }
        //is user is logged in and has not already like image!

        if (result.length == 0) {
            const like_query = "INSERT INTO likes (user_id,post_id) VALUES (" + req.session.user_id + "," + req.session.last_post_viewed_id + ")";
            connection.query(like_query, function(err, result, _fields) {
                alert("You've liked this picture! Its nice  to be nice!");
                if (err != null) {
                    console.error(err);

                }

                res.redirect("one-post-display");
            });

        }
        //user has already liked image - cannot like twice!
        else {
            alert("You've already liked this image!")
            return;
        }

    });


});





//-----------ROUTE:-----------comment on an image (must be logged in)-----------------------------
app.post("/comment", (req, res) => {
    var logged_in = false;
    if (req.session.username != undefined) {
        logged_in = true;
    }
    if (!logged_in) {
        alert("You need to login, or create an account first!");
        res.redirect('/');
    }
    const comment_query = 'INSERT INTO comments (user_id,post_id,comment) VALUES (' + req.session.user_id + ',' + req.session.last_post_viewed_id + ',"' + req.body.comment + '")';
    connection.query(comment_query, function(err, result, _fields) {

        if (err != null) {
            console.error(err);
            return;
        }
        alert("You just commented on this post :D");
        res.redirect("one-post-display");
        return;
    });
});


//-----------ROUTE:-----------comment on an image (must be logged in)-----------------------------
app.get("/accessiblity-statement", (req, res) => {

    res.render("accessibility-statement");


});





/*
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.set("trust proxy", 1); // trust first proxy

const router = require("./routes/routes")(io);
app.use("/", router)*/