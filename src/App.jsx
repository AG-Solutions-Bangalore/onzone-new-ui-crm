import DisableInspect from "./components/DisableRightClick/DisableRightClick";
import ErrorBoundry from "./components/errorBoundry/ErrorBoundry";
import LoadingBar from "./components/loadingBar/LoadingBar";
import { Toaster } from "./components/ui/toaster";

import AppRoutes from "./routes/AppRoutes";
import { Suspense } from "react";
import { ConfirmProvider } from "./hooks/useConfirm";

function App() {
  return (
    <ConfirmProvider>
      <Toaster />
      {/* <DisableInspect/> */}
      <Suspense fallback={<LoadingBar />}>
        <ErrorBoundry>
          <AppRoutes />
        </ErrorBoundry>
      </Suspense>
    </ConfirmProvider>
  );
}

export default App;
