'use client';

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

export default function ShippingForm({
  formData,
  onChange,
  onSubmit,
  loading = false,
}: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.address || !formData.city || !formData.zip || !formData.country) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.email.includes('@')) {
      alert('Please enter a valid email');
      return;
    }

    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="shipping-form">
      <h2>Shipping Information</h2>

      <div className="form-group">
        <label htmlFor="name">Full Name *</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          required
          placeholder="John Doe"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          required
          placeholder="john@example.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="address">Street Address *</label>
        <input
          id="address"
          type="text"
          value={formData.address}
          onChange={(e) => onChange('address', e.target.value)}
          required
          placeholder="123 Main St"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="city">City *</label>
          <input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => onChange('city', e.target.value)}
            required
            placeholder="New York"
          />
        </div>

        <div className="form-group">
          <label htmlFor="zip">ZIP Code *</label>
          <input
            id="zip"
            type="text"
            value={formData.zip}
            onChange={(e) => onChange('zip', e.target.value)}
            required
            placeholder="10001"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="country">Country *</label>
        <select
          id="country"
          value={formData.country}
          onChange={(e) => onChange('country', e.target.value)}
          required
        >
          <option value="">Select a country</option>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="MX">Mexico</option>
          <option value="ES">Spain</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Processing...' : 'Continue to Payment'}
      </button>
    </form>
  );
}
