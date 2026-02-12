import { useRole } from './context/RoleContext';
import LoginPage from './components/LoginPage';
import ArchDashboard from './dashboards/ArchDashboard';
import ForaneDashboard from './dashboards/ForaneDashboard';
import ParishDashboard from './dashboards/ParishDashboard';

function App() {
    const { role, isLoggedIn, setIsLoggedIn } = useRole();

    // If not logged in, show the login screen
    if (!isLoggedIn) {
        return <LoginPage />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation for the Dashboard */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
                <h2 className="text-xl font-bold text-blue-900">AccuFlow Central</h2>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-500 uppercase">
                        Logged in as: <span className="text-blue-600">{role}</span>
                    </span>
                    <button
                        onClick={() => setIsLoggedIn(false)}
                        className="text-sm text-red-600 hover:underline font-semibold"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <main className="p-8 max-w-7xl mx-auto">
                {role === 'arch' && <ArchDashboard />}
                {role === 'forane' && <ForaneDashboard />}
                {role === 'parish' && <ParishDashboard />}
            </main>
        </div>
    );
}

export default App;