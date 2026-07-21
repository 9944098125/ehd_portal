import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaves | EHDP",
  description: "Manage your leaves",
};

export default function LeavesPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
        Leaves Management
      </h1>
      <p className="text-muted-foreground mt-2">
        This module is currently under active development. You will be able to apply for and manage leaves here soon.
      </p>
    </div>
  );
}
