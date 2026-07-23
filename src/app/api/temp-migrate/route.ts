import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import LeaveBalance from "@/models/LeaveBalance";

export async function GET() {
  try {
    await connectToDatabase();
    
    const result = await LeaveBalance.updateMany(
      {},
      { 
        $set: { 
          totalCasual: 10,
          totalSick: 10
        }
      }
    );

    return NextResponse.json({ success: true, message: `Updated ${result.modifiedCount} records.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
