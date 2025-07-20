import { AuthProvider } from "./components/hooks/useAuth";
import AppRoutes from "./Routes";


function App() {

  return (
    <AuthProvider>
      <AppRoutes/>
    </AuthProvider>
  );
}

export default App;