import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Transfers from "./pages/Transfers";
import Audit from "./pages/Audit";
import RecordPage from "./components/RecordPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
            <Route index element={<Dashboard />} />
            <Route path="purchases" element={<RecordPage title="Purchases" endpoint="purchases" />}/>
            <Route path="transfers" element={<Transfers />} />
            <Route path="records" element={
                <div className="space-y-10">
                  <RecordPage
                    title="Personnel Assignments"
                    endpoint="assignments"
                    extraField/>
                  <RecordPage title="Expenditures" endpoint="expenditures" />
                </div>
                }/>
            <Route path="audit" element={<Audit />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
