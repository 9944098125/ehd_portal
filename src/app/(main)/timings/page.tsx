import { Metadata } from "next";
import TimingsClient from "./components/TimingsClient";

export const metadata: Metadata = {
  title: "Timings | EHDP",
  description: "Weekly Time Tracking",
};

export default function TimingsPage() {
  return <TimingsClient />;
}
