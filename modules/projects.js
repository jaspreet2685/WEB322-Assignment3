require('dotenv').config();
require('pg');
const Sequelize = require('sequelize');

// Create Sequelize instance
let sequelize = new Sequelize(
  process.env.PGDATABASE, 
  process.env.PGUSER, 
  process.env.PGPASSWORD, 
  {
    host: process.env.PGHOST,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

// Define Sector Model
const Sector = sequelize.define('Sector', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sector_name: Sequelize.STRING
}, {
  timestamps: false // Disable createdAt and updatedAt
});

// Define Project Model
const Project = sequelize.define('Project', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: Sequelize.STRING,
  feature_img_url: Sequelize.STRING,
  summary_short: Sequelize.TEXT,
  intro_short: Sequelize.TEXT,
  impact: Sequelize.TEXT,
  original_source_url: Sequelize.STRING,
  sector_id: Sequelize.INTEGER
}, {
  timestamps: false // Disable createdAt and updatedAt
});

// Create Association
Project.belongsTo(Sector, {foreignKey: 'sector_id'});

// Initialize function - sync with database
function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync()
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject("Unable to sync the database");
      });
  });
}

// Get all projects with Sector data
function getAllProjects() {
  return new Promise((resolve, reject) => {
    Project.findAll({
      include: [Sector]
    })
      .then((projects) => {
        resolve(projects);
      })
      .catch(() => {
        reject("No projects available");
      });
  });
}

// Get project by ID
function getProjectById(projectId) {
  return new Promise((resolve, reject) => {
    Project.findAll({
      include: [Sector],
      where: { id: projectId }
    })
      .then((projects) => {
        if (projects.length > 0) {
          resolve(projects[0]); // Return first element
        } else {
          reject("Unable to find requested project");
        }
      })
      .catch(() => {
        reject("Unable to find requested project");
      });
  });
}

// Get projects by sector
function getProjectsBySector(sector) {
  return new Promise((resolve, reject) => {
    Project.findAll({
      include: [Sector],
      where: {
        '$Sector.sector_name$': {
          [Sequelize.Op.iLike]: `%${sector}%`
        }
      }
    })
      .then((projects) => {
        if (projects.length > 0) {
          resolve(projects);
        } else {
          reject("Unable to find requested projects");
        }
      })
      .catch(() => {
        reject("Unable to find requested projects");
      });
  });
}

// Add new project
function addProject(projectData) {
  return new Promise((resolve, reject) => {
    Project.create(projectData)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err.errors[0].message);
      });
  });
}

// Edit existing project
function editProject(id, projectData) {
  return new Promise((resolve, reject) => {
    Project.update(projectData, {
      where: { id: id }
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err.errors[0].message);
      });
  });
}

// Delete project
function deleteProject(id) {
  return new Promise((resolve, reject) => {
    Project.destroy({
      where: { id: id }
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err.errors[0].message);
      });
  });
}

module.exports = { 
  initialize, 
  getAllProjects, 
  getProjectById, 
  getProjectsBySector,
  addProject,
  editProject,
  deleteProject
};
