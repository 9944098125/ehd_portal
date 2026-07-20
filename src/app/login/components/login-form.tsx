"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { motion } from "framer-motion";

export default function LoginForm() {
	const router = useRouter();
	const {
		login,
		isLoading,
		error: authError,
		clearError,
		accessToken,
	} = useAuthStore();

	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [rememberMe, setRememberMe] = useState(false);
	const [errors, setErrors] = useState<{
		identifier?: string;
		password?: string;
	}>({});

	useEffect(() => {
		if (accessToken) {
			router.replace("/dashboard");
		}
	}, [accessToken, router]);

	const validate = () => {
		const newErrors: { identifier?: string; password?: string } = {};

		if (!identifier) {
			newErrors.identifier = "Email or phone number is required";
		} else if (
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) &&
			!/^\+?[1-9]\d{1,14}$/.test(identifier) &&
			!/^\d{10}$/.test(identifier)
		) {
			newErrors.identifier = "Please enter a valid email or phone number";
		}

		if (!password) {
			newErrors.password = "Password is required";
		} else if (password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		clearError();

		if (validate()) {
			try {
				await login({ identifier, password, rememberMe });
				router.push("/dashboard");
			} catch (err) {
				// Error is captured and stored in Zustand state
			}
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: -40 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.6, ease: "easeOut" }}
			className="w-full max-w-md lg:max-w-[50vw] xl:max-w-[800px] p-8 md:p-10 lg:p-12 rounded-[32px] bg-gradient-to-br from-black/80 to-zinc-900/50 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/50">
			<div className="mb-8 text-center md:text-left">
				<div className="w-16 h-16 mb-5 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 mx-auto md:mx-0 shadow-lg">
					<img
						src="/tab-logo.png"
						alt="EHDP Logo"
						className="w-10 h-10 object-contain drop-shadow-md brightness-0 invert"
					/>
				</div>

				<h3 className="text-zinc-400 font-medium text-xs tracking-widest uppercase mb-2">
					Employee Help Desk Portal
				</h3>
				<h2 className="text-3xl font-bold tracking-tight text-white mb-3">
					Welcome Back
				</h2>
				<p className="text-sm text-zinc-400 leading-relaxed">
					Manage projects, tickets, attendance and payroll seamlessly.
				</p>
			</div>

			{authError && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-start gap-3 text-red-200 text-sm backdrop-blur-md">
					<svg
						className="w-5 h-5 shrink-0 mt-0.5 text-red-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p>{authError}</p>
				</motion.div>
			)}

			<form onSubmit={handleSubmit} className="space-y-5" noValidate>
				<div>
					<label
						htmlFor="identifier"
						className="block text-sm font-medium text-zinc-200 mb-1.5">
						Email or Phone{" "}
						<span className="text-xs text-zinc-500 font-normal ml-1">
							(include country code too if entering phone number)
						</span>
					</label>
					<input
						id="identifier"
						type="text"
						value={identifier}
						onChange={(e) => {
							setIdentifier(e.target.value);
							if (errors.identifier)
								setErrors({ ...errors, identifier: undefined });
							if (authError) clearError();
						}}
						placeholder="hello@example.com"
						disabled={isLoading}
						className={`w-full px-4 py-3.5 rounded-xl border bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:bg-white/10 backdrop-blur-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
							errors.identifier
								? "border-red-400/50 focus:ring-red-400/50"
								: "border-white/10 hover:border-white/20 focus:border-white focus:ring-white/30"
						}`}
					/>
					{errors.identifier && (
						<p className="mt-1.5 text-sm text-red-300">{errors.identifier}</p>
					)}
				</div>

				<div>
					<label
						htmlFor="password"
						className="block text-sm font-medium text-zinc-200 mb-1.5">
						Password
					</label>
					<input
						id="password"
						type="password"
						value={password}
						onChange={(e) => {
							setPassword(e.target.value);
							if (errors.password)
								setErrors({ ...errors, password: undefined });
							if (authError) clearError();
						}}
						placeholder="••••••••"
						disabled={isLoading}
						className={`w-full px-4 py-3.5 rounded-xl border bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:bg-white/10 backdrop-blur-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
							errors.password
								? "border-red-400/50 focus:ring-red-400/50"
								: "border-white/10 hover:border-white/20 focus:border-white focus:ring-white/30"
						}`}
					/>
					{errors.password && (
						<p className="mt-1.5 text-sm text-red-300">{errors.password}</p>
					)}
				</div>

				<div className="flex items-center justify-between text-sm pt-1">
					<label className="flex items-center gap-2.5 cursor-pointer group">
						<div className="relative flex items-center justify-center">
							<input
								type="checkbox"
								checked={rememberMe}
								onChange={(e) => setRememberMe(e.target.checked)}
								disabled={isLoading}
								className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded bg-white/5 checked:bg-blue-500 checked:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							/>
							<svg
								className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={3}>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<span className="text-zinc-300 group-hover:text-white transition-colors">
							Remember me
						</span>
					</label>
					<a
						href="#"
						className="font-medium text-zinc-300 hover:text-white transition-colors">
						Forgot password?
					</a>
				</div>

				<motion.button
					whileHover={{ scale: 1.02, translateY: -2 }}
					whileTap={{ scale: 0.98 }}
					type="submit"
					disabled={isLoading}
					className="w-full mt-2 py-4 px-4 flex justify-center items-center gap-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/30 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0">
					{isLoading ? (
						<>
							<svg
								className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
								fill="none"
								viewBox="0 0 24 24">
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Authenticating...
						</>
					) : (
						"Sign In to Portal"
					)}
				</motion.button>
			</form>
		</motion.div>
	);
}
