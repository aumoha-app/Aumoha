const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://omnipoolofficial_db_user:Freelance123@ac-cnlfh28-shard-00-00.chmyxmy.mongodb.net:27017,ac-cnlfh28-shard-00-01.chmyxmy.mongodb.net:27017,ac-cnlfh28-shard-00-02.chmyxmy.mongodb.net:27017/?ssl=true&replicaSet=atlas-11i29r-shard-0&authSource=admin&appName=Freelance';

const SosReportSchema = new mongoose.Schema(
  {
    userEmail: String,
    userPhone: String,
    category: String,
    severity: String,
    location: String,
    reason: String,
    status: String,
  },
  {
    timestamps: true,
  }
);

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');
    
    const SosReport = mongoose.model('SosReport', SosReportSchema);
    const reports = await SosReport.find({});
    console.log('SosReports count:', reports.length);
    console.log('SosReports details:');
    reports.forEach(r => {
      console.log(`- ID: ${r._id}, Category: ${r.category}, Severity: ${r.severity}, Location: ${r.location}, Reason: ${r.reason}, Status: ${r.status}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
