'use client';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuantityInput({ value, onChange, min = 0, max = 999, disabled = false }: QuantityInputProps) {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10) || 0;
    if (newValue >= min && newValue <= max) onChange(newValue);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDecrement}
        disabled={disabled || value === min}
        className="inline-flex items-center justify-center w-8 h-8 rounded border border-border bg-white hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        min={min}
        max={max}
        className="w-12 text-center border border-border rounded py-1 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        onClick={handleIncrement}
        disabled={disabled || value === max}
        className="inline-flex items-center justify-center w-8 h-8 rounded border border-border bg-white hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
