import { createBrowserRouter } from "react-router";
import Onboarding from "./screens/Onboarding";
import PatientDashboardDiabetes from "./screens/PatientDashboardDiabetes";
import PatientDashboardHypertension from "./screens/PatientDashboardHypertension";
import AdminDashboard from "./screens/AdminDashboard";
import CreateAdmin from "./screens/CreateAdmin";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Onboarding,
  },
  {
    path: "/patient/diabetes",
    Component: PatientDashboardDiabetes,
  },
  {
    path: "/patient/hypertension",
    Component: PatientDashboardHypertension,
  },
  {
    path: "/admin",
    Component: AdminDashboard,
  },
  {
    path: "/create-admin",
    Component: CreateAdmin,
  },
]);
