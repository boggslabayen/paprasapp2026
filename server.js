require("dotenv").config();
const express = require('express');
const {dbInit} = require("./config/db");
const bcrypt = require("bcrypt");
const app = express();
const PORT = process.env.PORT || 3000;
const Mongoose = require("mongoose")

const session = require('express-session');
// const MongoStore = require("connect-mongo");

// const dotenv = require('dotenv');

// Middleware exports
const {validation} = require("./middleware/validation");
const {authentication,authorization} = require("./middleware/authentication");
const { default: axios } = require('axios');
const { doctorModel } = require('./models/doctorModel');
const { userModel } = require("./models/userModel");
const { procedureModel } = require("./models/procedureModel");
const { articleModel } = require("./models/articlesModel");
const { eventsModel } = require("./models/eventsModel");
const sanitizeHtml  = require("sanitize-html");
const uploadRoutes = require("./routes/uploadRoutes");

const { programs,consortium1, consortium2 } =require( "./data/programs.js")
const { board } =require( "./data/bod.js")



app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(uploadRoutes);

app.set('view engine', 'ejs');

dbInit();



// Session Middleware Setup
app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))


// Middleware to make user data available in all views
app.use((req,res,next)=> {
    res.locals.currentUser = req.session.user || null;
    next();
})


// Get and post routes for home
app.get('/', (req, res) => {
    res.render('index', { title: 'Home Page' });
});




// Get and post routes for events


// Get and post routes for about
app.get('/about', (req, res) => {
    res.render('about/index', { title: 'About Papras', board: board });
});

// Get and post routes for procedures > reconstructive
app.get('/procedures/reconstructive', async (req, res) => {
    const reconstructiveProcedures = await procedureModel.find({ category: "Reconstructive" });
    res.render('procedures/reconstructive/index', { title: 'Reconstructive Procedures', procedures: reconstructiveProcedures });
});

app.get('/procedures/reconstructive/:id', async (req, res) => {

    const {id}= req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Procedure not found");
  }

    const procedure = await procedureModel.findOne({_id:id, category:"Reconstructive"});
    if (!procedure) {
        return res.status(404).send("Procedure not found");
    }
    res.render('procedures/procedure_detail', { title: procedure.title, procedure });
});

// Get and post routes for procedures > non-surgical
app.get('/procedures/non-surgical', async (req, res) => {
    const nonSurgicalProcedures = await procedureModel.find({ category: "Non Surgical" });
    res.render('procedures/non-surgical/index', { title: 'Non-surgical Procedures', procedures: nonSurgicalProcedures });
});

app.get('/procedures/non-surgical/:id', async (req, res) => {

    const {id}= req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Procedure not found");
  }

    const procedure = await procedureModel.findOne({_id:id, category:"Non Surgical"});
    if (!procedure) {
        return res.status(404).send("Procedure not found");
    }
    res.render('procedures/procedure_detail', { title: procedure.title, procedure });
});

// Get and post routes for procedures > aesthetic
app.get('/procedures/aesthetic', async (req, res) => {
    const aestheticProcedures = await procedureModel.find({ category: "Aesthetic" });
    res.render('procedures/aesthetic/index', { title: 'Aesthetic Procedures', procedures: aestheticProcedures });
});

app.get('/procedures/aesthetic/:id', async (req, res) => {

    const {id}= req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Procedure not found");
  }

    const procedure = await procedureModel.findOne({_id:id, category:"Aesthetic"});
    if (!procedure) {
        return res.status(404).send("Procedure not found");
    }
    res.render('procedures/procedure_detail', { title: procedure.title, procedure });
});

// Get routes for doctors
app.get("/doctors", async (req, res) => {
  try {
    const selectedLocation = (req.query.location || "").trim();

    // Build filter object only if a location is provided
    const filter = {};
    if (selectedLocation) {
      // exact match (simple)
      filter.location = selectedLocation;

      // If you want case-insensitive match instead, use:
      // filter.location = { $regex: `^${selectedLocation}$`, $options: "i" };
    }

    const doctors = await doctorModel
      .find(filter)
      .sort({ lastName: 1, firstName: 1 });

    // Build a unique list of locations for the dropdown
    const locations = await doctorModel.distinct("location");

    res.render("find-doctors/index", {
      doctors,
      locations: locations.filter(Boolean).sort(),
      selectedLocation,
      title: "Doctors"
    });
  } catch (err) {
    res.status(500).send(err.message || "Failed to load doctors");
  }
});

// Get routes for articles
app.get("/articles", async (req, res) => {
    const articles = await articleModel.find({}).sort({ createdAt: -1 });
      res.render('articles/index', { title: 'Articles', articles: articles});
});

app.get('/articles/:id', async (req, res) => {

    const {id}= req.params;

     if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Article not found");
  }

    const article = await articleModel.findOne({_id:id});
    if (!article) {
        return res.status(404).send("Article not found");
    }
    res.render('articles/article_detail', { title: article.title, article });
});

// Get routes for events
app.get("/events", async (req, res) => {
    const events = await eventsModel.find({});
      res.render('events/index', { title: 'Articles', events: events});;
});

app.get('/events/:id', async (req, res) => {

    const {id}= req.params;

     if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("Events not found");
  }
  
    const events = await eventsModel.findOne({_id:id});
    if (!events) {
        return res.status(404).send("event not found");
    }
    res.render('events/events_detail', { title: events.title, events });
});


// Get and post routes for become a member
app.get('/become-a-member', (req, res) => {
    res.render('become-a-member/index', { title: 'Become A Member', programs: programs , consortium1: consortium1, consortium2: consortium2 });
});


// Get and Post routes for registration
app.get("/dashboard/auth/register", (req,res)=> {
    res.render("dashboard/auth/register",{errors: null})
})

app.post("/dashboard/auth/register",validation, async (req,res)=> {
    
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const user = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashedPassword,
        type: "customer",
    }
    
    await userModel.create(user);
    console.log("Admin user created");
    res.redirect("/");
})

// Get and Post routes for login
app.get("/dashboard/auth/login", (req,res)=> {
    res.render("dashboard/auth/login",{error: null})
})

app.post("/dashboard/auth/login", async (req, res) => {
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) return res.render("dashboard/auth/login", { error: "Invalid email or password" });

  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) return res.render("dashboard/auth/login", { error: "Invalid email or password" });

  req.session.regenerate((err) => {
    if (err) return res.status(500).send("Session error");

    req.session.user = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      type: user.type
    };

    req.session.save((err) => {
      if (err) return res.status(500).send("Session save error");
      return res.redirect("/dashboard");
    });
  });
});

// Protected dashboard route
app.get('/dashboard',authentication,authorization, (req, res) => {
    res.render('dashboard/index', { title: 'Dashboard' });
});

// Dashboard > doctors route
app.get('/dashboard/doctors',authentication,authorization, async(req, res) => {
    const doctorsList = await doctorModel.find({});

    res.render('dashboard/doctors/index', { title: 'Dashboard Doctors', doctors: doctorsList });
});

// Dashboard > doctors > get and post route
app.get('/dashboard/doctors/add',authentication,authorization, (req, res) => {

    res.render('dashboard/doctors/add', { title: 'Add Doctor' });
});

app.post("/dashboard/doctors/add",validation, async (req,res)=> {

    const doctor = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        location: req.body.city
    }
    await doctorModel.create(doctor);
    console.log(`Doctor ${doctor.firstName} ${doctor.lastName} added`);
    res.redirect("/dashboard/doctors");
})

// Dashboard > procedures route
app.get('/dashboard/procedures',authentication,authorization, async (req, res) => {
    const proceduresList = await procedureModel.find({});
    res.render('dashboard/procedures/index', { title: 'Dashboard Procedures', procedures: proceduresList });
});

app.get('/dashboard/procedures/add',authentication,authorization, (req, res) => {
    res.render('dashboard/procedures/add', { title: 'Add Procedures' });
});

app.post("/dashboard/procedures/add", authentication, authorization, async (req, res) => {
  try {
    const procedure = {
      title: req.body.title,
      category: req.body.category,
      bannerUrl: req.body.bannerUrl,
      contentHtml: req.body.contentHtml
    };

    if (!procedure.title || !procedure.category || !procedure.contentHtml) {
      return res.status(400).send("Missing required fields");
    }

    const cleanHtml = sanitizeHtml(procedure.contentHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2", "h3", "img"]),
      allowedAttributes: {
        a: ["href", "target", "rel"],
        img: ["src", "alt"]
      }
    });

    const cleanProcedure = {
      title: procedure.title,
      category: procedure.category,
      bannerUrl: procedure.bannerUrl,
      contentHtml: cleanHtml
    };

    await procedureModel.create(cleanProcedure);

    console.log(`Procedure ${procedure.title} added`);
    return res.redirect("/dashboard/procedures");
  } catch (err) {
    return res.status(500).send(err.message || "Failed to add procedure");
  }
});

// Get and post routes for articles
app.get('/dashboard/articles',authentication,authorization, async (req, res) => {
    const articleList = await articleModel.find({});
    res.render('dashboard/articles/index', { title: 'Dashboard Articles', articles: articleList });
});

app.get('/dashboard/articles/add',authentication,authorization, (req, res) => {
    res.render('dashboard/articles/add', { title: 'Add Articles' });
});

app.post("/dashboard/articles/add", authentication, authorization, async (req, res) => {
  try {
    const article = {
      title: req.body.title,
      bannerUrl: req.body.bannerUrl,
      contentHtml: req.body.contentHtml
    };

    if (!article.title || !article.contentHtml) {
      return res.status(400).send("Missing required fields");
    }

    const cleanHtml = sanitizeHtml(article.contentHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2", "h3", "img"]),
      allowedAttributes: {
        a: ["href", "target", "rel"],
        img: ["src", "alt"]
      }
    });

    const cleanArticle = {
      title: article.title,
      category: article.category,
      bannerUrl: article.bannerUrl,
      contentHtml: cleanHtml
    };

    await articleModel.create(cleanArticle);

    console.log(`Procedure ${article.title} added`);
    return res.redirect("/dashboard/articles");
  } catch (err) {
    return res.status(500).send(err.message || "Failed to add article");
  }
});

// Get and post routes for events


app.get('/dashboard/events',authentication,authorization, async (req, res) => {
    
    res.render('dashboard/events/index', { title: 'Dashboard Events'});
});

app.get('/dashboard/events/add',authentication,authorization, async (req, res) => {
    
    res.render('dashboard/events/add', { title: 'Add Events'});
});

app.post("/dashboard/events/add", authentication, authorization, async (req, res) => {
  try {
    const events = {
      title: req.body.title,
      eventUrl: req.body.eventUrl,
      bannerUrl: req.body.bannerUrl,
      contentHtml: req.body.contentHtml
    };

    if (!events.title || !events.contentHtml || !events.bannerUrl) {
      return res.status(400).send("Missing required fields");
    }

    const cleanHtml = sanitizeHtml(events.contentHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2", "h3", "img"]),
      allowedAttributes: {
        a: ["href", "target", "rel"],
        img: ["src", "alt"]
      }
    });

    const cleanEvents = {
      title: events.title,
      eventUrl: events.eventUrl,
      bannerUrl: events.bannerUrl,
      contentHtml: cleanHtml
    };

    await eventsModel.create(cleanEvents);

    console.log(`Events ${events.title} added`);
    return res.redirect("/dashboard/events");
  } catch (err) {
    return res.status(500).send(err.message || "Failed to add event");
  }
});





app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});