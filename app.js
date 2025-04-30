const path = require("node:path");
const {Pool} = require("pg");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid');


// const {signupRouter} = require("./signupRouter");

const pool = new Pool ({

});

const app = express();

passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        const user = rows[0];
  
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          // passwords do not match!
          return done(null, false, { message: "Incorrect password" })
        }
        return done(null, user);
      } catch(err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      const user = rows[0];
  
      done(null, user);
    } catch(err) {
      done(err);
    }
  });
  
  app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
  });

  app.use(express.json());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({secret: "cats", resave: false, saveUninitialized: false}))
app.use(passport.session());
app.use(express.urlencoded({extended: false}));
// app.use("/", signupRouter);

app.use((req,res, next) => {
  req.me = users[1];
  next();
});


app.get("/sign-up",(req, res) => res.render("sign-up-form"));

app.post("/sign-up", async (req, res, next) => {
    try {
     const hashedPassword = await bcrypt.hash(req.body.password, 10);
     await pool.query("insert into users (username, password) values ($1, $2)", [req.body.username, hashedPassword]);
     res.redirect("/");
    } catch (error) {
       console.error(error);
       next(error);
      }
   });

app.get("/", (req, res) => {
    res.render("index", {user: req.user});
});


  
  app.post("/log-in", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/"
  }));

  app.get("/log-out", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
  });

let users = {
    1: {
      id: '1',
      username: 'Robin Wieruch',
    },
    2: {
      id: '2',
      username: 'Dave Davids',
    },
  };
  
  let messages = {
    1: {
      id: '1',
      text: 'Hello World',
      userId: '1',
    },
    2: {
      id: '2',
      text: 'By World',
      userId: '2',
    },
  };

  app.get('/users', (req, res) => {
    res.send(Object.values(users));
  });

  app.get('/users/:userId', (req, res) => {
    res.send(users[req.params.userId]);
  })

  app.get('/messages', (req,res) => {
    res.send(Object.values(messages));
  })

  app.get('/messages/:messageId', (req, res) => {
    return res.send(messages[req.params.messageId]);
  });

  app.post('/messages', (req, res) => {
    const id = uuidv4();
    const message = {id, 
      text: req.body.text,
      userId: req.me.id,
    }

    messages[id] = message;
    return res.send(message)
  })

  app.delete('/messages/:messageId', (req, res) => {
    const {
      [req.params.messageId]: message,
      ...otherMessages
    } = messages;

    messages = otherMessages;
    return res.send(message);
  });

  app.get('/session', (req,res) => {
    return res.send(users[req.me.id]);
  })
  
//   app.post('/users', (req, res) => {
//      res.send('POST HTTP method on user resource');
//   });
  
//   app.put('/users/:userId', (req, res) => {
//      res.send(`PUT HTTP method on user/${req.params.userId} resource`);
//   });
  
//   app.delete('/users/:userId', (req, res) => {
//      res.send(`DELETE HTTP method on user/${req.params.userId} resource`);
//   });
  


app.listen(3000, () => console.log("app listening on port 3000"))