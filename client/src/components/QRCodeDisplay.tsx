import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Download, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeDisplayProps {
  projectId: string;
  projectTitle: string;
  surveyUrl: string;
}

export function QRCodeDisplay({ projectId, projectTitle, surveyUrl }: QRCodeDisplayProps) {
  const { toast } = useToast();

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(surveyUrl);
    toast({
      title: "URL Copied",
      description: "Survey URL copied to clipboard",
    });
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-code-${projectId}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `${projectTitle.replace(/\s+/g, '-')}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">QR Code for Survey</CardTitle>
        <p className="text-sm text-muted-foreground">{projectTitle}</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-md">
          <QRCodeSVG
            id={`qr-code-${projectId}`}
            value={surveyUrl}
            size={200}
            level="H"
            data-testid={`qr-code-${projectId}`}
          />
        </div>
        <div className="w-full space-y-2">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <code className="text-xs flex-1 break-all">{surveyUrl}</code>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCopyUrl}
              data-testid="button-copy-url"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex-1"
              data-testid="button-download-qr"
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(surveyUrl, '_blank')}
              className="flex-1"
              data-testid="button-open-survey"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Survey
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
