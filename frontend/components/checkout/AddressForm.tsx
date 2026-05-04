'use client';

interface AddressValues {
    fullName: string;
    phoneNumber: string;
    streetAddress: string;
    city: string;
    state: string;
    pincode: string;
}

interface AddressFormProps {
    value: AddressValues;
    errors: Partial<Record<keyof AddressValues, string>>;
    onChange: (field: keyof AddressValues, value: string) => void;
    onSubmit: () => void;
    submitting?: boolean;
}

const fields: Array<{ key: keyof AddressValues; label: string; placeholder: string; type?: string }> = [
    { key: 'fullName', label: 'Full Name', placeholder: 'Enter full name' },
    { key: 'phoneNumber', label: 'Phone Number', placeholder: '10-digit phone number', type: 'tel' },
    { key: 'streetAddress', label: 'Street Address', placeholder: 'House no, street, area' },
    { key: 'city', label: 'City', placeholder: 'Enter city' },
    { key: 'state', label: 'State', placeholder: 'Enter state' },
    { key: 'pincode', label: 'Pincode', placeholder: '6-digit pincode', type: 'text' },
];

export default function AddressForm({ value, errors, onChange, onSubmit, submitting = false }: AddressFormProps) {
    return (
        <form
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <div className="mb-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">Delivery Address</p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900">Where should we deliver this order?</h2>
                <p className="mt-2 text-sm text-gray-600">All fields are required before you can proceed to payment.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                    <label key={field.key} className={field.key === 'streetAddress' ? 'sm:col-span-2' : ''}>
                        <span className="mb-1.5 block text-sm font-medium text-gray-700">{field.label}</span>
                        <input
                            type={field.type || 'text'}
                            value={value[field.key]}
                            onChange={(event) => onChange(field.key, event.target.value)}
                            placeholder={field.placeholder}
                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${
                                errors[field.key] ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                            } ${field.key === 'streetAddress' ? 'sm:col-span-2' : ''}`}
                        />
                        {errors[field.key] ? <span className="mt-1 block text-xs text-red-600">{errors[field.key]}</span> : null}
                    </label>
                ))}
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
                {submitting ? 'Validating...' : 'Continue to Payment'}
            </button>
        </form>
    );
}