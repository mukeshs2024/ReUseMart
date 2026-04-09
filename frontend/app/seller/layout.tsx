import SellerGuard from '@/components/SellerGuard';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
    return <SellerGuard>{children}</SellerGuard>;
}
