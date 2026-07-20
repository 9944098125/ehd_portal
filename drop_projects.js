const mongoose = require('mongoose');

async function dropProjects() {
  let uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ehdp'; // Assuming local if no env
  
  if (!process.env.MONGO_URI) {
    // Read from .env.local
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      const match = envFile.match(/MONGO_URI=(.*)/);
      if (match) {
        uri = match[1].trim();
      }
    }
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    // Check if collection exists before dropping
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (collectionNames.includes('projects')) {
      await mongoose.connection.db.dropCollection('projects');
      console.log('Dropped projects collection successfully.');
    } else {
      console.log('Projects collection does not exist. Nothing to drop.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

dropProjects();
