import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "EHDP - %s",
    default: "EHDP",
  },
  description: "Employee Helpdesk Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans selection:bg-indigo-500/30">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster 
            position="bottom-left" 
            richColors 
            theme="system" 
            toastOptions={{
              className: 'w-full sm:w-auto min-w-[320px] sm:min-w-[380px] md:min-w-[420px] p-4 md:p-5 text-sm md:text-base shadow-xl rounded-xl',
              classNames: {
                title: 'text-base md:text-lg font-semibold',
                description: 'text-sm md:text-base mt-1'
              }
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
