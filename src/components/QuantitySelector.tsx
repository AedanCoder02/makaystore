'use client';

interface Props {
  maxQuantity: number;
  selectedQuantity: number;
  onChange: (qty: number) => void;
}

export default function QuantitySelector({
  maxQuantity,
  selectedQuantity,
  onChange,
}: Props) {
  const handleDecrement = () => {
    if (selectedQuantity > 1) onChange(selectedQuantity - 1);
  };

  const handleIncrement = () => {
    if (selectedQuantity < maxQuantity) onChange(selectedQuantity + 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 1;
    if (value < 1) value = 1;
    if (value > maxQuantity) value = maxQuantity;
    onChange(value);
  };

  return (
    <div className="quantity-selector">
      <label>Quantity</label>
      <div className="quantity-controls">
        <button
          onClick={handleDecrement}
          disabled={selectedQuantity <= 1}
          className="qty-btn"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <input
          type="number"
          min="1"
          max={maxQuantity}
          value={selectedQuantity}
          onChange={handleChange}
          className="qty-input"
        />
        <button
          onClick={handleIncrement}
          disabled={selectedQuantity >= maxQuantity}
          className="qty-btn"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <p className="qty-available">
        {maxQuantity > 0 ? `${maxQuantity} available` : 'Out of stock'}
      </p>
    </div>
  );
}
