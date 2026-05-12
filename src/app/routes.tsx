import { createBrowserRouter } from "react-router";
import Onboarding from "./screens/Onboarding";
import PatientSelector from "./screens/PatientSelector";
import PatientDashboardDiabetes from "./screens/PatientDashboardDiabetes";
import PatientDashboardHypertension from "./screens/PatientDashboardHypertension";
import AdminDashboard from "./screens/AdminDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Onboarding,
  },
  {
    path: "/select-patient",
    Component: PatientSelector,
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
]);
