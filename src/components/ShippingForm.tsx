'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface FormData {
  name: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  country: string;
}

interface Props {
  formData: FormData;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export default function ShippingForm({ formData, onChange, onSubmit, loading = false }: Props) {
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');

  // Pre-fill from lead capture form if fields are empty
  useEffect(() => {
    try {
      const stored = localStorage.getItem('makay_lead');
      if (!stored) return;
      const lead = JSON.parse(stored) as { name?: string; email?: string };
      if (lead.name && !formData.name)  onChange('name', lead.name);
      if (lead.email && !formData.email) onChange('email', lead.email);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.email && !formData.email.includes('@')) {
      alert(t('invalidEmail'));
      return;
    }
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="shipping-form">
      <h2>{t('shippingInfo')}</h2>

      <div className="form-group">
        <label htmlFor="name">{t('fullName')}</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Nombre completo"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">{t('email')}</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="correo@ejemplo.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="address">{t('address')}</label>
        <input
          id="address"
          type="text"
          value={formData.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Dirección (opcional)"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="city">{t('city')}</label>
          <input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="Ciudad"
          />
        </div>

        <div className="form-group">
          <label htmlFor="zip">{t('zipCode')}</label>
          <input
            id="zip"
            type="text"
            value={formData.zip}
            onChange={(e) => onChange('zip', e.target.value)}
            placeholder="Código postal"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="country">{t('country')}</label>
        <select
          id="country"
          value={formData.country}
          onChange={(e) => onChange('country', e.target.value)}
        >
          <option value="">{t('selectCountry')}</option>
          <option value="VE">Venezuela</option>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="MX">Mexico</option>
          <option value="ES">Spain</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? tCommon('processing') : t('continueToPayment')}
      </button>
    </form>
  );
}
