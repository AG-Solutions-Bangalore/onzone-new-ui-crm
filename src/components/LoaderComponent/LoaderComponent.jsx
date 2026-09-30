import Page from "@/app/dashboard/page";
import { Button } from "@/components/ui/button"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // ✅ Ensure Card components are imported
import { Loader2 } from "lucide-react";

export const LoaderComponent = () => {
  return (
    <Page>
      <div className="flex justify-center items-center min-h-[60vh] w-full">
        <Loader2 className="h-9 w-9 animate-spin text-[#A27B5C]" />
      </div>
    </Page>
  );
};

export const ErrorComponent = ({ message, refetch }) => {
  return (
    <Page>
      <Card className="w-full max-w-md mx-auto mt-10">
        <CardHeader>
          <CardTitle className="text-destructive">{message}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </Page>
  );
};

export const WithoutLoaderComponent = () => {
  return (
    <div className="flex justify-center items-center min-h-[60vh] w-full">
      <Loader2 className="h-9 w-9 animate-spin text-[#A27B5C]" />
    </div>
  );
};

export const WithoutErrorComponent = ({ message, refetch }) => {
  return (
    // <Page>
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle className="text-destructive">{message}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={refetch} variant="outline">
          Try Again
        </Button>
      </CardContent>
    </Card>
    // </Page>
  );
};
