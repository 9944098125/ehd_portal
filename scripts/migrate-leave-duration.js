const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://srinivas:thisisasecret@cluster0.pll6b.mongodb.net/employee_helpdesk_portal";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const Leave = mongoose.connection.collection("leaves");
  
  // Find all leaves that have duration but missing fromHalf
  const leaves = await Leave.find({ fromHalf: { $exists: false } }).toArray();
  console.log(`Found ${leaves.length} leaves to migrate`);

  for (const leave of leaves) {
    let fromHalf = "FULL_DAY";
    let toHalf = "FULL_DAY";
    
    if (leave.duration === "FIRST_HALF") {
        fromHalf = "FIRST_HALF";
        toHalf = "FIRST_HALF";
    } else if (leave.duration === "SECOND_HALF") {
        fromHalf = "SECOND_HALF";
        toHalf = "SECOND_HALF";
    }

    await Leave.updateOne(
        { _id: leave._id },
        { 
            $set: { fromHalf, toHalf },
            $unset: { duration: "" }
        }
    );
  }

  console.log("Migration complete");
  await mongoose.disconnect();
}

run().catch(console.error);
