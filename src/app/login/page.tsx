import LoginForm from "./components/login-form";

export default function LoginPage() {
	return (
		<div className="relative min-h-screen w-full flex items-center overflow-hidden">
			{/* Full Screen Animated Video Background */}
			<video
				autoPlay
				muted
				loop
				playsInline
				preload="auto"
				className="absolute inset-0 w-full h-full object-cover z-0">
				<source src="/login-video.mp4" type="video/mp4" />
			</video>

			{/* Dark Overlay for Readability */}
			<div className="absolute inset-0 bg-black/50 z-10 backdrop-blur-[2px]"></div>

			{/* Form Container (Left aligned on Desktop, Centered on Mobile) */}
			<div className="relative z-20 w-full h-full flex items-center justify-center lg:justify-start px-6 md:px-12 lg:pl-12 xl:pl-16">
				<LoginForm />
			</div>
		</div>
	);
}
