import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Building, Mail, Phone, MapPin, Save, ArrowLeft } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../styles/customers.module.css';

export default function CustomerForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;

    async function loadCustomer() {
      try {
        setLoading(true);
        const res = await api.get(`/api/customers/${id}`);
        if (res && res.customer) {
          setFormData({
            name: res.customer.name || '',
            company: res.customer.company || '',
            email: res.customer.email || '',
            phone: res.customer.phone || '',
            address: res.customer.address || '',
            city: res.customer.city || '',
            state: res.customer.state || '',
            zipCode: res.customer.zipCode || '',
            country: res.customer.country || '',
            notes: res.customer.notes || '',
          });
        }
      } catch (err) {
        console.error('Failed to load customer:', err);
        showToast('Failed to load customer details', 'error');
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [id, isEdit, navigate, showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/api/customers/${id}`, formData);
        showToast('Customer updated successfully', 'success');
      } else {
        await api.post('/api/customers', formData);
        showToast('Customer added successfully', 'success');
      }
      navigate('/customers');
    } catch (err) {
      console.error('Save customer error:', err);
      const msg =
        err.data?.error ||
        err.data?.message ||
        err.message ||
        'Failed to save customer';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading customer details..." />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.formContainer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.headerTitle}>
              {isEdit ? 'Edit Customer' : 'Add Customer'}
            </h1>
            <p className={styles.headerSubtitle}>
              {isEdit
                ? 'Update customer details and billing information'
                : 'Enter customer contact details for billing and documents'}
            </p>
          </div>
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate('/customers')}
          >
            Back to Customers
          </Button>
        </div>

        {/* Form Card */}
        <div className={styles.formCard}>
          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.formGrid}>
              <div className={styles.fullWidth}>
                <Input
                  label="Customer Name"
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g. Jane Smith"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  icon={User}
                  required
                  autoFocus
                />
              </div>

              <Input
                label="Company Name"
                id="company"
                name="company"
                type="text"
                placeholder="e.g. Acme Corp"
                value={formData.company}
                onChange={handleChange}
                icon={Building}
              />

              <Input
                label="Email Address"
                id="email"
                name="email"
                type="email"
                placeholder="e.g. jane@acmecorp.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={Mail}
              />

              <Input
                label="Phone Number"
                id="phone"
                name="phone"
                type="tel"
                placeholder="e.g. +1 (555) 012-3456"
                value={formData.phone}
                onChange={handleChange}
                icon={Phone}
              />

              <Input
                label="Street Address"
                id="address"
                name="address"
                type="text"
                placeholder="e.g. 100 Market St, Suite 300"
                value={formData.address}
                onChange={handleChange}
                icon={MapPin}
              />

              <Input
                label="City"
                id="city"
                name="city"
                type="text"
                placeholder="e.g. San Francisco"
                value={formData.city}
                onChange={handleChange}
              />

              <Input
                label="State / Province"
                id="state"
                name="state"
                type="text"
                placeholder="e.g. CA"
                value={formData.state}
                onChange={handleChange}
              />

              <Input
                label="ZIP / Postal Code"
                id="zipCode"
                name="zipCode"
                type="text"
                placeholder="e.g. 94105"
                value={formData.zipCode}
                onChange={handleChange}
              />

              <Input
                label="Country"
                id="country"
                name="country"
                type="text"
                placeholder="e.g. United States"
                value={formData.country}
                onChange={handleChange}
              />

              <div className={styles.fullWidth}>
                <label
                  htmlFor="notes"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#0f172a',
                    marginBottom: '0.375rem',
                  }}
                >
                  Customer Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  className={styles.textarea}
                  placeholder="Internal notes about billing preferences, customer contact, etc."
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/customers')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                loading={saving}
              >
                {saving ? 'Saving...' : isEdit ? 'Update Customer' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
