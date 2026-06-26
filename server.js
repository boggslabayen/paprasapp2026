require("dotenv").config();
const express = require('express');
const {dbInit} = require("./config/db");
const bcrypt = require("bcrypt");
const app = express();
const PORT = process.env.PORT || 3000;
const mongoose = require("mongoose")

const session = require('express-session');
const MongoStore = require("connect-mongo").default;

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
const { board } =require( "./data/bod.js");
const { Session } = require("express-session");



app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());

const locationsRoutes = require("./routes/locations");
app.use("/api/locations", locationsRoutes);

app.set('view engine', 'ejs');

dbInit();



// Session Middleware Setup
app.set('trust proxy', 1);


app.use(session({
  name: "sid",
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  // proxy: true, // uncomment in prod
  store: MongoStore.create({
    mongoUrl: process.env.DB_CONNECTION_STRING,
    ttl: 7 * 24 * 60 * 60
  }),
  cookie: {
    path: "/",
    secure: false, // change to true in prod
    httpOnly: true, // change this to true in prod
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(uploadRoutes);

app.use((req, res, next) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  next();
});

app.use((req, res, next) => {
  console.log("REQ", req.method, req.path, {
    sessionID: req.sessionID,
    hasUser: !!req.session?.user,
    cookieHeader: req.headers.cookie
  });
  next();
});

app.use((req, res, next) => {
  console.log("req.secure:", req.secure, "x-forwarded-proto:", req.headers["x-forwarded-proto"]);
  next();
});


// Middleware to make user data available in all views
app.use((req,res,next)=> {
    res.locals.currentUser = req.session.user || null;
    next();
})


// Get and post routes for home
app.get('/', (req, res) => {
    res.render('index', { title: 'Home Page' });
});

// This below are debug codes

app.get("/__session_debug", (req, res) => {
  res.json({
    sessionID: req.sessionID,
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    user: req.session?.user || null
  });
});

app.get("/dashboard/__debug", (req, res) => {
  res.json({
    path: req.path,
    sessionID: req.sessionID,
    hasUser: !!req.session?.user,
    user: req.session?.user || null
  });
});


app.get("/health", (req, res) => res.status(200).send("ok"));



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


// app.get("/doctors", async (req, res) => {
//   try {
//     const selectedRegion = (req.query.region || "").trim();

//     const filter = {};
//     if (selectedRegion) {
//       filter.region = selectedRegion; // you said you store regionName string
//     }

//     const doctors = await doctorModel
//       .find(filter)
//       .sort({ lastName: 1, firstName: 1 });

//     // Regions for the dropdown
//     const regions = (await doctorModel.distinct("region"))
//       .filter(Boolean)
//       .sort();

//     // When region selected, show all provinces + cities that exist in that region
//     let provinces = [];
//     let cities = [];

//     if (selectedRegion) {
//       provinces = (await doctorModel.distinct("province", { regionName: selectedRegion }))
//         .filter(Boolean)
//         .sort();

//       cities = (await doctorModel.distinct("city", { regionName: selectedRegion }))
//         .filter(Boolean)
//         .sort();
//     }

//     res.render("find-doctors/index", {
//       title: "Doctors",
//       doctors,
//       regions,
//       selectedRegion,
//       provinces,
//       cities
//     });
//   } catch (err) {
//     res.status(500).send(err.message || "Failed to load doctors");
//   }
// });

app.get("/doctors", async (req, res) => {
  try {
    const selectedRegion = (req.query.region || "").trim();
    const selectedType = (req.query.doctor_type || "licensed-surgeon").trim(); 
    // examples: "Licensed Surgeon", "Board Eligible"

    const filter = {};
    if (selectedRegion) filter.region = selectedRegion;
    if (selectedType) filter.doctor_type = selectedType;

    const doctors = await doctorModel
      .find(filter)
      .sort({ lastName: 1, firstName: 1 });

    // Regions dropdown (can be global; not dependent on type)
    const regions = (await doctorModel.distinct("region"))
      .filter(Boolean)
      .sort();

    // Types for tabs/dropdown
    const doctorTypes = (await doctorModel.distinct("doctor_type"))
      .filter(Boolean)
      .sort();

    // When region selected (and optionally type selected), show provinces + cities in that scope
    let provinces = [];
    let cities = [];

    if (selectedRegion || selectedType) {
      const scopeFilter = {};
      if (selectedRegion) scopeFilter.region = selectedRegion;
      if (selectedType) scopeFilter.doctor_type = selectedType;

      provinces = (await doctorModel.distinct("province", scopeFilter))
        .filter(Boolean)
        .sort();

      cities = (await doctorModel.distinct("city", scopeFilter))
        .filter(Boolean)
        .sort();
    }

    res.render("find-doctors/index", {
      title: "Doctors",
      doctors,
      regions,
      doctorTypes,
      selectedRegion,
      selectedType,
      provinces,
      cities
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
      res.render('events/index', { title: 'Events', events: events});;
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
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.render("dashboard/auth/login", { error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("dashboard/auth/login", { error: "Invalid email or password" });
    }

    // Prevent session fixation
    req.session.regenerate((err) => {
      if (err) return res.status(500).send("Session error");

      req.session.user = {
        _id: user._id.toString(),
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
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
});

// Protected dashboard route
app.get('/dashboard',authentication, async(req, res) => {
   console.log("SESSION:", req.session);
   console.log("dashboard sessionID:", req.sessionID, "user:", req.session?.user);


    const doctorCount = await doctorModel.countDocuments({});
    const doctorLicensed = await doctorModel.countDocuments({doctor_type: "licensed-surgeon"});
    const doctorEligible = await doctorModel.countDocuments({doctor_type: "board-eligible"});

    const proceduresCount = await procedureModel.countDocuments({});
    const reconstrcutiveCount = await procedureModel.countDocuments({category: "Reconstructive"});
    const aestheticCount = await procedureModel.countDocuments({category: "Aesthetic"});
    const nonsurgicalCount = await procedureModel.countDocuments({category: "Non Surgical"});

    const articleCount = await articleModel.countDocuments({});

    const eventsCount = await eventsModel.countDocuments({});
    const usersCount = await userModel.countDocuments({});
    const adminCount = await userModel.countDocuments({type: "admin"});
    const editorCount = await userModel.countDocuments({type: "editor"});

    res.render('dashboard/index', { title: 'Dashboard',
      doctorCount,
      doctorLicensed,
      doctorEligible,
      proceduresCount,
      reconstrcutiveCount,
      aestheticCount,
      nonsurgicalCount,
      articleCount,
      eventsCount,
      usersCount,
      adminCount,
      editorCount
     });
});


// Dashboard > doctors route
app.get("/dashboard/doctors", authentication, async (req, res) => {
  try {
    const selectedRegion = (req.query.region || "").trim();
    const selectedType = (req.query.doctor_type || "licensed-surgeon").trim();
    const search = (req.query.search || "").trim();

    const filter = {
      doctor_type: selectedType
    };

    if (selectedRegion) {
      filter.region = selectedRegion;
    }

    // Search filter
    if (search) {
      const regex = new RegExp(search, "i"); // case-insensitive
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: search,
              options: "i"
            }
          }
        }
      ];
    }

    const doctors = await doctorModel
      .find(filter)
      .sort({ lastName: 1, firstName: 1 });

    const regions = (await doctorModel.distinct("region"))
      .filter(Boolean)
      .sort();

    res.render("dashboard/doctors/index", {
      title: "Dashboard Doctors",
      doctors,
      regions,
      selectedRegion,
      selectedType,
      search
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load dashboard doctors");
  }
});

// Dashboard > doctors > get and post route
app.get('/dashboard/doctors/add',authentication, (req, res) => {
    res.set("Content-Type", "text/html; charset=utf-8");
    res.render('dashboard/doctors/add', { title: 'Add Doctor' });
});

app.post("/dashboard/doctors/add",validation, async (req,res)=> {

    const doctor = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        doctor_type: req.body.doctor_type,
        region: req.body.region_name,
        province: req.body.province_name,
        city: req.body.city_municipality_name,
    }
    await doctorModel.create(doctor);
    console.log(`Doctor ${doctor.firstName} ${doctor.lastName} ${doctor.region} ${doctor.province} ${doctor.city} added`);
    res.redirect("/dashboard/doctors");
})

app.get("/dashboard/doctors/:id/delete", authentication, async(req,res)=> {
const id= req.params.id;
  const doctor = await doctorModel.findOne({_id: id});

  // create 404 page later

  res.render("dashboard/doctors/deleteDoctor", {doctor})
});

app.post("/dashboard/doctors/:id/delete", authentication, async(req,res)=> {
  const id=req.params.id;
    await doctorModel.findOneAndDelete({_id:id});
    return res.redirect("/dashboard/doctors")
});

app.get("/dashboard/doctors/:id/edit", authentication, async(req,res) =>{
  const id= req.params.id;
  const doctor = await doctorModel.findOne({_id: id});

  // create 404 page later

  res.render("dashboard/doctors/edit", {doctor})
});

app.post("/dashboard/doctors/:id/edit", validation, async (req, res) => {
  try {
    const updatedDoctor = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      doctor_type: req.body.doctor_type,
      region: req.body.region_name,
      province: req.body.province_name,
      city: req.body.city_municipality_name,
    };

    await doctorModel.findByIdAndUpdate(
      req.params.id,
      updatedDoctor,
      { new: true } // optional but good practice
    );

    console.log(
      `Doctor ${updatedDoctor.firstName} ${updatedDoctor.lastName} updated`
    );

    res.redirect("/dashboard/doctors");
  } catch (err) {
    res.status(500).send("Failed to update doctor");
  }
});

// Dashboard > procedures route
app.get('/dashboard/procedures',authentication, async (req, res) => {
    const procedure = await procedureModel.find({});
    res.render('dashboard/procedures/index', { title: 'Dashboard Procedures', procedures: procedure });
});

app.get('/dashboard/procedures/add',authentication, (req, res) => {
    res.render('dashboard/procedures/add', { title: 'Add Procedures' });
});

app.post("/dashboard/procedures/add", authentication, async (req, res) => {
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
        a: ["href", "target", "rel", "class"],
        img: ["src", "alt"]
      },
      allowedClasses: {
        a: ["content-button"]
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

app.get("/dashboard/procedures/:id/edit", authentication, async(req,res) =>{
  const id= req.params.id;
  const procedure = await procedureModel.findOne({_id: id});

  // create 404 page later

  res.render("dashboard/procedures/editProcedure", {procedure})
});

app.post("/dashboard/procedures/:id/edit",authentication,async (req, res) => {
    try {
      const { id } = req.params;

      const title = (req.body.title || "").trim();
      const category = (req.body.category || "").trim();
      const bannerUrl = (req.body.bannerUrl || "").trim();
      const contentHtml = (req.body.contentHtml || "").trim();

      if (!title || !category || !contentHtml) {
        return res.status(400).send("Missing required fields");
      }

      const cleanHtml = sanitizeHtml(contentHtml, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          "h1",
          "h2",
          "h3",
          "img"
        ]),
        allowedAttributes: {
          a: ["href", "target", "rel", "class"],
          img: ["src", "alt"]
        },
        allowedClasses: {
          a: ["content-button"]
        }
      });

      const updatePayload = {
        title,
        category,
        bannerUrl: bannerUrl || null, // allows banner removal
        contentHtml: cleanHtml,
        updatedAt: new Date()
      };

      const updatedProcedure = await procedureModel.findByIdAndUpdate(
        id,
        updatePayload,
        { new: true }
      );

      if (!updatedProcedure) {
        return res.status(404).send("Procedure not found");
      }

      console.log(`Procedure ${updatedProcedure.title} updated`);
      return res.redirect("/dashboard/procedures");
    } catch (err) {
      return res.status(500).send(err.message || "Failed to update procedure");
    }
  });

app.get("/dashboard/procedures/:id/delete", authentication, async(req,res) =>{
  const id= req.params.id;
  const procedure = await procedureModel.findOne({_id: id});

  // create 404 page later

  res.render("dashboard/procedures/deleteProcedures", {procedure})
});

app.post("/dashboard/procedures/:id/delete", authentication, authorization, async (req, res) => {
    const id=req.params.id;
    await procedureModel.findOneAndDelete({_id:id});
    return res.redirect("/dashboard/procedures")
  }
);


// Get and post routes for articles

app.get('/dashboard/articles',authentication, async (req, res) => {
    const articleList = await articleModel.find({});
    res.render('dashboard/articles/index', { title: 'Dashboard Articles', articles: articleList });
});

app.get('/dashboard/articles/add',authentication, (req, res) => {
    res.render('dashboard/articles/add', { title: 'Add Articles' });
});

app.post("/dashboard/articles/add", authentication, async (req, res) => {
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
        a: ["href", "target", "rel", "class"],
        img: ["src", "alt"]
      },
      allowedClasses: {
        a: ["content-button"]
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

app.get("/dashboard/articles/:id/edit", authentication, async(req,res) =>{
  const id= req.params.id;
  const article = await articleModel.findOne({_id: id});

  // create 404 page later

  res.render("dashboard/articles/editArticle", {article})
});

app.post(
  "/dashboard/articles/:id/edit",
  authentication,
  async (req, res) => {
    try {
      const { id } = req.params;

      const { title, bannerUrl, contentHtml } = req.body;

      if (!title || !contentHtml) {
        return res.status(400).send("Missing required fields");
      }

      const cleanHtml = sanitizeHtml(contentHtml, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          "h1",
          "h2",
          "h3",
          "img"
        ]),
        allowedAttributes: {
          a: ["href", "target", "rel", "class"],
          img: ["src", "alt"]
        },
        allowedClasses: {
          a: ["content-button"]
        }
      });

      const updatePayload = {
        title: title.trim(),
        bannerUrl: bannerUrl?.trim() || null, // allows removing banner
        contentHtml: cleanHtml,
        updatedAt: new Date()
      };

      const updatedArticle = await articleModel.findByIdAndUpdate(
        id,
        updatePayload,
        { new: true } // return updated document
      );

      if (!updatedArticle) {
        return res.status(404).send("Article not found");
      }

      console.log(`Article ${updatedArticle.title} updated`);
      return res.redirect("/dashboard/articles");
    } catch (err) {
      return res.status(500).send(err.message || "Failed to update article");
    }
  }
);

app.get("/dashboard/articles/:id/delete", authentication, async(req,res) =>{
  const id= req.params.id;
  const article = await articleModel.findOne({_id: id});

  // create 404 page later

  res.render("dashboard/articles/deleteArticles", {article})
});

app.post(
  "/dashboard/articles/:id/delete",
  authentication,
  authorization,
  async (req, res) => {
    const id=req.params.id;
    await articleModel.findOneAndDelete({_id:id});
    return res.redirect("/dashboard/articles")
  }
);


// Get and post routes for events

app.get('/dashboard/events',authentication, async (req, res) => {
    const events = await eventsModel.find({});
    res.render('dashboard/events/index', { title: 'Dashboard Events',  events: events});
});

app.get('/dashboard/events/add',authentication, async (req, res) => {
    
    res.render('dashboard/events/add', { title: 'Add Events'});
});

app.post("/dashboard/events/add", authentication, async (req, res) => {
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
        a: ["href", "target", "rel", "class"],
        img: ["src", "alt"]
      },
      allowedClasses: {
        a: ["content-button"]
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

app.get("/dashboard/events/:id/edit", authentication, async(req,res) =>{
  const id= req.params.id;
  const events = await eventsModel.findOne({_id: id});

  // create 404 page later

  res.render("dashboard/events/editEvent", {events})
});

app.post(
  "/dashboard/events/:id/edit",
  authentication,
  authorization,
  async (req, res) => {
    try {
      const { id } = req.params;

      const { title, bannerUrl, contentHtml } = req.body;

      if (!title || !contentHtml) {
        return res.status(400).send("Missing required fields");
      }

      const cleanHtml = sanitizeHtml(contentHtml, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          "h1",
          "h2",
          "h3",
          "img"
        ]),
        allowedAttributes: {
          a: ["href", "target", "rel", "class"],
          img: ["src", "alt"]
        },
        allowedClasses: {
          a: ["content-button"]
        }
      });

      const updatePayload = {
        title: title.trim(),
        bannerUrl: bannerUrl?.trim() || null, // allows removing banner
        contentHtml: cleanHtml,
        updatedAt: new Date()
      };

      const updatedEvent = await eventsModel.findByIdAndUpdate(
        id,
        updatePayload,
        { new: true } // return updated document
      );

      if (!updatedEvent) {
        return res.status(404).send("Event not found");
      }

      console.log(`Event ${updatedEvent.title} updated`);
      return res.redirect("/dashboard/events");
    } catch (err) {
      return res.status(500).send(err.message || "Failed to update event");
    }
  }
);

app.get("/dashboard/events/:id/delete", authentication, async(req,res) =>{
  const id= req.params.id;
  const events = await eventsModel.findOne({_id: id});

  // create 404 page later

  res.render("dashboard/events/deleteEvent", {events})
});

app.post(
  "/dashboard/events/:id/delete",
  authentication,
  authorization,
  async (req, res) => {
    const id=req.params.id;
    await eventsModel.findOneAndDelete({_id:id});
    return res.redirect("/dashboard/events")
  }
);



// settings
app.get("/dashboard/settings", authentication, async(req,res)=>{
  const users = await userModel.find({});

  res.render("dashboard/settings/index", {title: 'Settings', users: users})
});

app.get("/dashboard/settings/add", authentication, authorization, async(req,res)=>{
  res.render("dashboard/settings/add", {title: 'Add User'})
});

app.post("/dashboard/settings/add",validation, authentication, authorization, async (req,res)=> {
    
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const user = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashedPassword,
        type: req.body.type,
    }
    
    await userModel.create(user);
    console.log("user created");
    res.redirect("/dashboard/settings");
})

//   const id= req.params.id;
//   const users = await userModel.findOne({_id: id});
//   console.log(id)

//   // create 404 page later

//   res.render("dashboard/settings/updatePassword", {
//     users
//   })
// });

app.post(
  "/dashboard/settings/:id/update",
  validation,
  authentication,
  async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 12);

      await userModel.findByIdAndUpdate(
        req.params.id,
        { password: hashedPassword },
        { new: true }
      );

      console.log("Password updated");
      return res.redirect("/dashboard/settings");

    } catch (err) {
      console.error(err);
      return res.status(500).send("Error updating password");
    }
  }
);

// session user passwordUpdate
app.get("/dashboard/settings/:id/update", authentication, async (req, res) => {
  const sessionUser = req.session.user;
  const requestedId = req.params.id;

  // Non-admin can only update themselves
  if (sessionUser.type !== "admin" &&
      requestedId !== sessionUser._id.toString()) {
    return res.status(403).send("Unauthorized");
  }

  const user = await userModel.findById(requestedId);

  if (!user) return res.status(404).send("User not found");

  res.render("dashboard/settings/updatePassword", {
    user,
    currentUser: sessionUser
  });
});


// Logout
app.post("/auth/logout", (req, res) => {
  const sid = req.sessionID;

  req.sessionStore.destroy(sid, (err) => {
    if (err) return res.status(500).send("Unable to log out");

    res.clearCookie("sid", {
      path: "/",
      secure: false,
      sameSite: "lax"
    });

    return res.redirect("/dashboard");
  });
});



app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});