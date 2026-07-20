import mongoose, { Document, Schema, Model } from "mongoose";

export interface IUser extends Document {
	employeeId: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	password: string;
	role: "Super Admin" | "Admin" | "Manager" | "Employee";
	department: string;
	designation: string;
	status: "Active" | "Inactive" | "Suspended";
	profileImage?: string;
	isEmailVerified: boolean;
	isActive: boolean;
	lastLogin?: Date;
	passwordChangedAt?: Date;
	createdBy?: mongoose.Types.ObjectId;
	updatedBy?: mongoose.Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
	{
		employeeId: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},

		firstName: {
			type: String,
			required: true,
			trim: true,
		},

		lastName: {
			type: String,
			required: true,
			trim: true,
		},

		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},

		phone: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},

		password: {
			type: String,
			required: true,
			minlength: 6,
			select: false,
		},

		role: {
			type: String,
			enum: ["Super Admin", "Admin", "Employee"],
			default: "Employee",
		},

		department: {
			type: String,
			enum: [
				"Human Resource",
				"Information Technology",
				"Finance",
				"Administration",
				"Research & Development",
				"Legal",
				"Security",
			],
			required: true,
		},

		designation: {
			type: String,
			required: true,
			trim: true,
		},

		status: {
			type: String,
			enum: ["Active", "Inactive", "Suspended"],
			default: "Active",
		},

		profileImage: {
			type: String,
			default: "",
		},

		isEmailVerified: {
			type: Boolean,
			default: false,
		},

		isActive: {
			type: Boolean,
			default: true,
		},

		lastLogin: {
			type: Date,
		},

		passwordChangedAt: {
			type: Date,
		},

		createdBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},

		updatedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

const User: Model<IUser> =
	mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
