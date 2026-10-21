import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import QuotationList from './pages/QuotationList';
import QuotationEditor from './pages/QuotationEditor';
import InvoiceList from './pages/InvoiceList';
import InvoiceEditor from './pages/InvoiceEditor';
import Customers from './pages/Customers';
import CustomerForm from './pages/CustomerForm';
import CompanySettings from './pages/CompanySettings';
import AccountSettings from './pages/AccountSettings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public landing page at root */}
            <Route path="/" element={<Home />} />

            {/* Public authentication routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="documents" element={<Documents />} />
                <Route path="quotations" element={<QuotationList />} />
                <Route path="quotations/new" element={<QuotationEditor />} />
                <Route path="quotations/:id" element={<QuotationEditor />} />
                <Route path="quotations/:id/edit" element={<QuotationEditor />} />
                <Route path="invoices" element={<InvoiceList />} />
                <Route path="invoices/new" element={<InvoiceEditor />} />
                <Route path="invoices/:id" element={<InvoiceEditor />} />
                <Route path="invoices/:id/edit" element={<InvoiceEditor />} />
                <Route path="customers" element={<Customers />} />
                <Route path="customers/new" element={<CustomerForm />} />
                <Route path="customers/:id/edit" element={<CustomerForm />} />
                <Route path="settings/company" element={<CompanySettings />} />
                <Route path="settings/account" element={<AccountSettings />} />
              </Route>
            </Route>

            {/* Catch-all 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
