import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./ProtectedRoute";

const LoginPage = lazy(() => import("../pages/Login/LoginPage"));
const DashboardPage = lazy(() => import("../pages/Dashboard/DashboardPage"));
const InvoicePage = lazy(() => import("../pages/Invoice/InvoicePage"));
const EditInvoicePage = lazy(() => import("../pages/Invoice/EditInvoicePage"));
const GenerateInvoicePdfPage = lazy(() => import("../pages/Invoice/GenerateInvoicePdfPage"));
const ConsigneeDetailsGridPage = lazy(() => import("../pages/ConsigneeDetails/ConsigneeDetailsGridPage"));
const ConsigneeDetailsFormPage = lazy(() => import("../pages/ConsigneeDetails/ConsigneeDetailsFormPage"));
const InvoiceGridPage = lazy(() => import("../pages/Invoice/InvoiceGridPage"));

// Dynamically set basename based on deployment environment
const basename = process.env.PUBLIC_URL || "/";

const router = createBrowserRouter(
  [
    { path: "/", element: <LoginPage /> },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/invoice",
      element: (
        <ProtectedRoute>
          <InvoicePage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/editInvoice/:id/:timeStamp",
      element: (
        <ProtectedRoute>
          <EditInvoicePage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/pdfInvoice/:id/:timeStamp",
      element: (
        <ProtectedRoute>
          <GenerateInvoicePdfPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/cdGrid",
      element: (
        <ProtectedRoute>
          <ConsigneeDetailsGridPage />
        </ProtectedRoute>
      ),
    },
    // Updated this route to support dynamic "id"
    {
      path: "/cdForm/:id?", // ":id?" makes the id parameter optional
      element: (
        <ProtectedRoute>
          <ConsigneeDetailsFormPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/invoiceGrid",
      element: (
        <ProtectedRoute>
          <InvoiceGridPage />
        </ProtectedRoute>
      ),
    },
  ],
  { basename },
);

const AppRouter = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default AppRouter;
