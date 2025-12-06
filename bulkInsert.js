require('dotenv').config();
require('pg');
const Sequelize = require('sequelize');

// Import JSON data
const projectData = require("./data/projectData");
const sectorData = require("./data/sectorData");
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
      ssl: { rejectUnauthorized: false }
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
  timestamps: false
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
  timestamps: false
});

// Create Association
Project.belongsTo(Sector, {foreignKey: 'sector_id'});

// Bulk Insert Function
sequelize.sync().then(() => {
  // Insert Sectors
  Sector.bulkCreate(sectorData, {
    returning: true,
    updateOnDuplicate: ['sector_name']
  }).then(() => {
    console.log("Sectors inserted successfully");
    
    // Insert Projects
    Project.bulkCreate(projectData, {
      returning: true,
      updateOnDuplicate: ['title', 'feature_img_url', 'summary_short', 'intro_short', 'impact', 'original_source_url', 'sector_id']
    }).then(() => {
      console.log("Projects inserted successfully");
      console.log("✅ Data inserted successfully!");
      process.exit(0);
    }).catch((err) => {
      console.error("Error inserting projects:", err);
      process.exit(1);
    });
  }).catch((err) => {
    console.error("Error inserting sectors:", err);
    process.exit(1);
  });
}).catch((err) => {
  console.error("Error syncing database:", err);
  process.exit(1);
});
