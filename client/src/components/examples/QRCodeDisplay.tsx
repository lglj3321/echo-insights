import { QRCodeDisplay } from '../QRCodeDisplay';
import { Toaster } from "@/components/ui/toaster";

export default function QRCodeDisplayExample() {
  return (
    <>
      <div className="p-6 max-w-md">
        <QRCodeDisplay
          projectId="project-1"
          projectTitle="100% Recycled Packaging"
          surveyUrl="https://echo-insights.app/survey/project-1"
        />
      </div>
      <Toaster />
    </>
  );
}
