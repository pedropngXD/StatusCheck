import DashboardPage from './pages/DashboardPage';
import { LanguageProvider } from './lib/i18n';

function App() {
  return (
    <LanguageProvider>
      <DashboardPage />
    </LanguageProvider>
  );
}

export default App;
