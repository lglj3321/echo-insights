import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import Forecast from "@/pages/Forecast";
import Comparison from "@/pages/Comparison";
import Feedback from "@/pages/Feedback";
import SurveyResults from "@/pages/SurveyResults";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import Survey from "@/pages/Survey";
import Goals from "@/pages/Goals";
import Team from "@/pages/Team";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/projects" component={Projects} />
      <Route path="/project/:id" component={ProjectDetails} />
      <Route path="/project/:id/forecast" component={Forecast} />
      <Route path="/comparison" component={Comparison} />
      <Route path="/feedback" component={Feedback} />
      <Route path="/feedback/:id" component={SurveyResults} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/goals" component={Goals} />
      <Route path="/team" component={Team} />
      <Route path="/settings" component={Settings} />
      <Route path="/survey/:projectId?" component={Survey} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center gap-4 p-4 border-b bg-card">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="flex-1" />
              </header>
              <main className="flex-1 overflow-auto p-6">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
