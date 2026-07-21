const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://omnipoolofficial_db_user:Freelance123@ac-cnlfh28-shard-00-00.chmyxmy.mongodb.net:27017,ac-cnlfh28-shard-00-01.chmyxmy.mongodb.net:27017,ac-cnlfh28-shard-00-02.chmyxmy.mongodb.net:27017/?ssl=true&replicaSet=atlas-11i29r-shard-0&authSource=admin&appName=Freelance';

const UserSchema = new mongoose.Schema({
  firebaseUid: String,
  fullName: String,
  email: String,
  phone: String,
  address: String,
  role: String,
});

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');
    
    const User = mongoose.model('User', UserSchema);
    const users = await User.find({});
    console.log('Users count:', users.length);
    console.log('Users details:');
    users.forEach(u => {
      console.log(`- Name: ${u.fullName}, Email: ${u.email}, Address: ${u.address}, Role: ${u.role}, UID: ${u.firebaseUid}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
