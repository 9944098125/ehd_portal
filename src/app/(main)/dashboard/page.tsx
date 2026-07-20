"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import TicketsPage from "@/components/tickets/page";
import EmployeesPage from "@/components/employees/page";

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, user, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<"tickets" | "employees">("tickets");

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    } else {
      setIsChecking(false);
    }
  }, [accessToken, router]);

  if (isChecking) {
    return null;
  }

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  return (
    <div className="w-full flex flex-col min-h-[calc(100vh-80px)] rounded-xl">
      {/* Tickets Section: 70% of viewport height approximately, full width */}
      <section className="w-full h-[70vh]">
        <TicketsPage />
      </section>

      {/* Employees Section: Below Tickets */}
      {user?.role !== "Employee" && (
        <section className="w-full mt-8 flex-1">
          <EmployeesPage />
        </section>
      )}
    </div>
  );
}
