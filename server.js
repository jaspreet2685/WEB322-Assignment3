/********************************************************************************
*  WEB322 – Assignment 03
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: JASPREET KAUR Student ID: 150081230 Date: December 05, 2025
*
*  Published URL: https://web-322-assignment3-eight.vercel.app/ 
*
********************************************************************************/

require('dotenv').config();
const express = require('express');
const clientSessions = require('client-sessions');
const projectData = require('./modules/projects');

const app = express();
const PORT = process.env.PORT || 8080;

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the public folder
app.use(express.static('public'));

// Add urlencoded middleware for form data
app.use(express.urlencoded({extended: true}));

// Configure client-sessions middleware
app.use(clientSessions({
  cookieName: "session",
  secret: process.env.SESSIONSECRET,
  duration: 2 * 60 * 1000, // 2 minutes
  activeDuration: 1000 * 60 // 1 minute
}));

// Make session available to all templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Helper middleware to ensure user is logged in
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}

// Route: Home page
app.get('/', (req, res) => {
  res.render('home');
});

// Route: About page
app.get('/about', (req, res) => {
  res.render('about');
});

// Route: GET Login page
app.get('/login', (req, res) => {
  res.render('login', { errorMessage: "", userName: "" });
});

// Route: POST Login
app.post('/login', (req, res) => {
  const { userName, password } = req.body;
  
  if (userName === process.env.ADMINUSER && password === process.env.ADMINPASSWORD) {
    req.session.user = {
      userName: process.env.ADMINUSER
    };
    res.redirect('/solutions/projects');
  } else {
    res.render('login', {
      errorMessage: 'Invalid User Name or Password',
      userName: userName
    });
  }
});

// Route: Logout
app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

// Route: Get all projects or filter by sector
app.get('/solutions/projects', (req, res) => {
  if (req.query.sector) {
    projectData.getProjectsBySector(req.query.sector)
      .then((projects) => {
        if (projects.length > 0) {
          res.render('projects', { projects: projects });
        } else {
          res.status(404).render('404', { 
            message: `No projects found for sector: ${req.query.sector}` 
          });
        }
      })
      .catch((error) => {
        res.status(404).render('404', { message: error });
      });
  } else {
    projectData.getAllProjects()
      .then((projects) => {
        res.render('projects', { projects: projects });
      })
      .catch((error) => {
        res.status(404).render('404', { message: error });
      });
  }
});

// Route: Get project by ID
app.get('/solutions/projects/:id', (req, res) => {
  projectData.getProjectById(req.params.id)
    .then((project) => {
      res.render('project', { project: project });
    })
    .catch((error) => {
      res.status(404).render('404', { message: error });
    });
});

// Route: GET Add Project form (protected)
app.get('/solutions/addProject', ensureLogin, (req, res) => {
  res.render('addProject');
});

// Route: POST Add Project (protected)
app.post('/solutions/addProject', ensureLogin, (req, res) => {
  projectData.addProject(req.body)
    .then(() => {
      res.redirect('/solutions/projects');
    })
    .catch((err) => {
      res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
    });
});

// Route: GET Edit Project form (protected)
app.get('/solutions/editProject/:id', ensureLogin, (req, res) => {
  projectData.getProjectById(req.params.id)
    .then((project) => {
      res.render('editProject', { project: project });
    })
    .catch((err) => {
      res.status(404).render('404', { message: err });
    });
});

// Route: POST Edit Project (protected)
app.post('/solutions/editProject', ensureLogin, (req, res) => {
  projectData.editProject(req.body.id, req.body)
    .then(() => {
      res.redirect('/solutions/projects');
    })
    .catch((err) => {
      res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
    });
});

// Route: GET Delete Project (protected)
app.get('/solutions/deleteProject/:id', ensureLogin, (req, res) => {
  projectData.deleteProject(req.params.id)
    .then(() => {
      res.redirect('/solutions/projects');
    })
    .catch((err) => {
      res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
    });
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).render('404', { 
    message: "I'm sorry, we're unable to find what you're looking for" 
  });
});

// Initialize project data and START the server
projectData.initialize()
  .then(() => {
    console.log("Project data initialized successfully");
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Failed to initialize project data:", error);
  });
