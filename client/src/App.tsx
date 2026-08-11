import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import Forecast from "@/pages/Forecast";
import Comparison from "@/pages/Comparison";
import Feedback from "@/pages/Feedback";
import SurveyResults from "@/pages/SurveyResults";
import Settings from "@/pages/Settings";
import Survey from "@/pages/Survey";
import Goals from "@/pages/Goals";
import Team from "@/pages/Team";
import QRCodes from "@/pages/QRCodes";
import Scorecard from "@/pages/Scorecard";
import ImpactCalculator from "@/pages/ImpactCalculator";
import { useEffect } from "react";

/** Redirects to /login unless a valid session is present. */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/survey/:projectId?">
        {(params) => <Survey projectId={params?.projectId} />}
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/projects">
        <ProtectedRoute>
          <Projects />
        </ProtectedRoute>
      </Route>
      <Route path="/project/:id">
        <ProtectedRoute>
          <ProjectDetails />
        </ProtectedRoute>
      </Route>
      <Route path="/project/:id/forecast">
        <ProtectedRoute>
          <Forecast />
        </ProtectedRoute>
      </Route>
      <Route path="/comparison">
        <ProtectedRoute>
          <Comparison />
        </ProtectedRoute>
      </Route>
      <Route path="/feedback">
        <ProtectedRoute>
          <Feedback />
        </ProtectedRoute>
      </Route>
      <Route path="/feedback/:id">
        <ProtectedRoute>
          <SurveyResults />
        </ProtectedRoute>
      </Route>
      <Route path="/qr-codes">
        <ProtectedRoute>
          <QRCodes />
        </ProtectedRoute>
      </Route>
      <Route path="/scorecard">
        <ProtectedRoute>
          <Scorecard />
        </ProtectedRoute>
      </Route>
      <Route path="/calculator">
        <ProtectedRoute>
          <ImpactCalculator />
        </ProtectedRoute>
      </Route>
      <Route path="/goals">
        <ProtectedRoute>
          <Goals />
        </ProtectedRoute>
      </Route>
      <Route path="/team">
        <ProtectedRoute>
          <Team />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Signed-in users have no reason to sit on the login page.
  useEffect(() => {
    if (!isLoading && isAuthenticated && location === "/login") {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, location, navigate]);

  if (location === "/login") {
    return (
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          {isAuthenticated && <AppSidebar />}
          <div className="flex flex-col flex-1 overflow-hidden">
            {isAuthenticated && (
              <header className="flex items-center gap-4 p-4 border-b bg-card">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="flex-1" />
              </header>
            )}
            <main className="flex-1 overflow-auto p-6">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
