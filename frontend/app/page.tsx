import { Navbar } from '@/components/layout/Navbar';
import Hero from '@/components/marketplace/Hero';
import TrustSection from '@/components/marketplace/TrustSection';
import { SellerCTA } from '@/components/marketplace/SellerCTA';
import { PremiumFooter } from '@/components/marketplace/PremiumFooter';

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24">
        <Hero />

        <TrustSection />

        {/* Hero-only homepage per request — product grid removed */}

        <SellerCTA />
      </main>

      <footer>
        <PremiumFooter />
      </footer>
    </div>
  );
}
