import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Image,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
  Hash,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../styles/settings.module.css';

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

export default function CompanySettings() {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    taxId: '',
    logoUrl: '',
    defaultCurrency: 'USD',
    defaultTaxRate: 0,
    defaultPaymentTerms: '',
    defaultNotes: '',
    quotePrefix: 'QT',
    invoicePrefix: 'INV',
    nextQuoteNumber: 1,
    nextInvoiceNumber: 1,
  });

  useEffect(() => {
    async function loadCompanyData() {
      try {
        setLoading(true);
        const res = await api.get('/api/company');
        if (res && res.company) {
          setFormData({
            companyName: res.company.companyName || '',
            email: res.company.email || '',
            phone: res.company.phone || '',
            website: res.company.website || '',
            address: res.company.address || '',
            city: res.company.city || '',
            state: res.company.state || '',
            zipCode: res.company.zipCode || '',
            country: res.company.country || '',
            taxId: res.company.taxId || '',
            logoUrl: res.company.logoUrl || '',
            defaultCurrency: res.company.defaultCurrency || 'USD',
            defaultTaxRate: res.company.defaultTaxRate ?? 0,
            defaultPaymentTerms: res.company.defaultPaymentTerms || '',
            defaultNotes: res.company.defaultNotes || '',
            quotePrefix: res.company.quotePrefix || 'QT',
            invoicePrefix: res.company.invoicePrefix || 'INV',
            nextQuoteNumber: res.company.nextQuoteNumber ?? 1,
            nextInvoiceNumber: res.company.nextInvoiceNumber ?? 1,
          });
        }
      } catch (err) {
        console.error('Failed to load company profile:', err);
        showToast('Failed to load company settings', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadCompanyData();
  }, [showToast]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      showToast('Please select a PNG or JPEG image.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('File size must be under 2MB.', 'error');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('logo', file);

    try {
      setUploadingLogo(true);
      const res = await api.upload('/api/company/logo', uploadData);
      if (res && res.logoUrl) {
        setFormData((prev) => ({ ...prev, logoUrl: res.logoUrl }));
        showToast('Logo uploaded successfully', 'success');
      }
    } catch (err) {
      console.error('Logo upload failed:', err);
      showToast(err.message || 'Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        defaultTaxRate: parseFloat(formData.defaultTaxRate) || 0,
        nextQuoteNumber: parseInt(formData.nextQuoteNumber, 10) || 1,
        nextInvoiceNumber: parseInt(formData.nextInvoiceNumber, 10) || 1,
      };

      const res = await api.put('/api/company', payload);
      if (res && res.company) {
        showToast('Company settings saved successfully', 'success');
      }
    } catch (err) {
      console.error('Save company settings failed:', err);
      showToast(err.message || 'Failed to save company settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading company settings..." />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Company Settings</h1>
        <p className={styles.headerSubtitle}>
          Configure your business profile, document numbering, and defaults
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Section 1: Company Information */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <Building2 size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>1. Company Information</h2>
          </div>

          <div className={styles.gridTwoCols}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="companyName">
                Company Name <span className={styles.required}>*</span>
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                className={styles.input}
                placeholder="Acme Corp"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="email">
                Company Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={styles.input}
                placeholder="billing@acmecorp.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={styles.input}
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="website">
                Website
              </label>
              <input
                id="website"
                name="website"
                type="text"
                className={styles.input}
                placeholder="https://acmecorp.com"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Logo */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <Image size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>2. Company Logo</h2>
          </div>

          <div className={styles.logoSection}>
            <div className={styles.logoPreviewWrapper}>
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Company Logo Preview"
                  className={styles.logoImg}
                />
              ) : (
                <div className={styles.logoPlaceholder}>
                  <Image size={32} />
                  <span>No logo</span>
                </div>
              )}
            </div>

            <div className={styles.logoUploadActions}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg"
                className={styles.fileInputHidden}
                onChange={handleLogoUpload}
              />
              <Button
                type="button"
                variant="secondary"
                icon={Upload}
                loading={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
              <span className={styles.helpText}>
                PNG or JPEG formats up to 2MB. Recommended minimum 200x200px.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Address */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <MapPin size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>3. Business Address</h2>
          </div>

          <div className={styles.gridTwoCols}>
            <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label} htmlFor="address">
                Street Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                className={styles.input}
                placeholder="123 Business Way, Suite 400"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="city">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                className={styles.input}
                placeholder="San Francisco"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="state">
                State / Province
              </label>
              <input
                id="state"
                name="state"
                type="text"
                className={styles.input}
                placeholder="CA"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="zipCode">
                ZIP / Postal Code
              </label>
              <input
                id="zipCode"
                name="zipCode"
                type="text"
                className={styles.input}
                placeholder="94107"
                value={formData.zipCode}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="country">
                Country
              </label>
              <input
                id="country"
                name="country"
                type="text"
                className={styles.input}
                placeholder="United States"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Tax & Legal */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <ShieldCheck size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>4. Tax &amp; Legal</h2>
          </div>

          <div className={styles.gridTwoCols}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="taxId">
                Tax ID / VAT Number
              </label>
              <input
                id="taxId"
                name="taxId"
                type="text"
                className={styles.input}
                placeholder="e.g. US123456789 or GB999 9999 73"
                value={formData.taxId}
                onChange={handleChange}
              />
              <span className={styles.helpText}>
                Printed on your quotation and invoice headers
              </span>
            </div>
          </div>
        </div>

        {/* Section 5: Defaults */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <SlidersHorizontal size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>5. Default Document Settings</h2>
          </div>

          <div className={styles.gridTwoCols}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="defaultCurrency">
                Default Currency
              </label>
              <select
                id="defaultCurrency"
                name="defaultCurrency"
                className={styles.select}
                value={formData.defaultCurrency}
                onChange={handleChange}
              >
                {CURRENCY_OPTIONS.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="defaultTaxRate">
                Default Tax Rate (%)
              </label>
              <input
                id="defaultTaxRate"
                name="defaultTaxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className={styles.input}
                placeholder="0"
                value={formData.defaultTaxRate}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label} htmlFor="defaultPaymentTerms">
                Default Payment Terms
              </label>
              <textarea
                id="defaultPaymentTerms"
                name="defaultPaymentTerms"
                className={styles.textarea}
                placeholder="e.g. Payment due within 14 days of invoice date via wire transfer or credit card."
                value={formData.defaultPaymentTerms}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label} htmlFor="defaultNotes">
                Default Notes / Thank You Message
              </label>
              <textarea
                id="defaultNotes"
                name="defaultNotes"
                className={styles.textarea}
                placeholder="e.g. Thank you for your business! Please contact support for any billing questions."
                value={formData.defaultNotes}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Section 6: Document Numbering */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <Hash size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>6. Document Numbering</h2>
          </div>

          <div className={styles.gridTwoCols}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="quotePrefix">
                Quotation Prefix
              </label>
              <input
                id="quotePrefix"
                name="quotePrefix"
                type="text"
                className={styles.input}
                placeholder="QT"
                value={formData.quotePrefix}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="nextQuoteNumber">
                Next Quotation Sequence #
              </label>
              <input
                id="nextQuoteNumber"
                name="nextQuoteNumber"
                type="number"
                min="1"
                step="1"
                className={styles.input}
                placeholder="1"
                value={formData.nextQuoteNumber}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="invoicePrefix">
                Invoice Prefix
              </label>
              <input
                id="invoicePrefix"
                name="invoicePrefix"
                type="text"
                className={styles.input}
                placeholder="INV"
                value={formData.invoicePrefix}
                onChange={handleChange}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="nextInvoiceNumber">
                Next Invoice Sequence #
              </label>
              <input
                id="nextInvoiceNumber"
                name="nextInvoiceNumber"
                type="number"
                min="1"
                step="1"
                className={styles.input}
                placeholder="1"
                value={formData.nextInvoiceNumber}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className={styles.saveBar}>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
