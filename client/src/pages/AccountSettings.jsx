import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import Button from '../components/Button';
import Input from '../components/Input';
import { formatDate } from '../utils/formatters';
import styles from '../styles/settings.module.css';

export default function AccountSettings() {
  const { user, setUser, fetchUser } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Attempt PUT /api/auth/me if endpoint is available
      const res = await api.put('/api/auth/me', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      });

      if (res?.user) {
        setUser(res.user);
      } else {
        await fetchUser();
      }
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      // If PUT /api/auth/me isn't supported on backend, inform gracefully
      if (err.status === 404 || err.status === 405) {
        showToast('Profile updates are currently read-only on this server.', 'info');
      } else {
        showToast(err.message || 'Failed to update profile', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const initials =
    ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'U';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Account Settings</h1>
        <p className={styles.headerSubtitle}>
          Manage your personal profile and account credentials
        </p>
      </div>

      <div className={styles.accountCard}>
        <div className={styles.userProfileRow}>
          <div className={styles.userAvatar}>{initials}</div>
          <div className={styles.userInfo}>
            <h2>
              {user?.firstName} {user?.lastName}
            </h2>
            <p>{user?.email}</p>
            {user?.createdAt && (
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#94a3b8' }}>
                Member since {formatDate(user.createdAt)}
              </p>
            )}
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.gridTwoCols}>
            <Input
              label="First Name"
              id="firstName"
              name="firstName"
              type="text"
              icon={User}
              value={formData.firstName}
              onChange={handleChange}
              required
            />

            <Input
              label="Last Name"
              id="lastName"
              name="lastName"
              type="text"
              icon={User}
              value={formData.lastName}
              onChange={handleChange}
              required
            />

            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                label="Email Address (read-only)"
                id="email"
                name="email"
                type="email"
                icon={Mail}
                value={formData.email}
                disabled
                helperText="To change your login email address, please contact system administration."
              />
            </div>
          </div>

          <div className={styles.saveBar}>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              loading={saving}
            >
              {saving ? 'Updating...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
