import Page from "@/app/dashboard/page";
import { Button } from "@/components/ui/button"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // ✅ Ensure Card components are imported
import { Loader2 } from "lucide-react";

export const LoaderComponent = ({ name }) => {
  return (
    <Page>
      <div className="flex justify-center items-center h-full">
        <Button disabled>
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          Loading {name}
        </Button>
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

export const WithoutLoaderComponent = ({ name }) => {
  return (
    // <Page>
    <div className="flex justify-center items-center h-96">
      <Button disabled>
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        Loading {name}
      </Button>
    </div>
    // </Page>
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
