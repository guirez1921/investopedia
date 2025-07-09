import { BrowserRouter, Routes, Route, Outlet } from "react-router";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "../components/ui/tooltip";
import { Toaster } from "~/components/ui/toaster";
import { Toaster as Sonner } from "~/components/ui/sonner";

export default function Layout() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Outlet />
      </TooltipProvider>
    </ThemeProvider>
    // I wish I could see the stock prices in real-time.
  );
}
