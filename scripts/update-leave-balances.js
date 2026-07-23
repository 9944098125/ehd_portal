const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://srinivas:thisisasecret@cluster0.pll6b.mongodb.net/employee_helpdesk_portal";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const LeaveBalance = mongoose.connection.collection("leavebalances");
  const result = await LeaveBalance.updateMany({}, {
    $set: {
      totalCasual: 10,
      totalSick: 10
    }
  });

  console.log(`Matched ${result.matchedCount}, Modified ${result.modifiedCount}`);
  await mongoose.disconnect();
}

run().catch(console.error);
