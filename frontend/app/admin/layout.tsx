import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin — ReUse Mart',
    robots: { index: false, follow: false },
};

// Admin pages use their own layout — no public Navbar
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-bgPrimary text-textPrimary">
            {children}
        </div>
    );
}
