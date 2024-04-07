import "./App.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import CurrentUser from "./pages/CurrentUser";
import { queryClient } from "./firebase";

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <h1>Cat Litter Tracker</h1>
        <div className="card">
          <CurrentUser />
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </>
  );
}

export default App;
