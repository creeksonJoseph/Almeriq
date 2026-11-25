/**
 * Pages/LandingPage.jsx - Primary Landing & Waitlist Page for ALIMERIQ.
 */
import { useEffect } from "react";
import { Hero, EcosystemSection, CapabilitiesSection, WaitlistFormSection, Footer } from "../../components/landing/LandingSections";

export default function LandingPage() {
  useEffect(() => {
    if (window.location.hash === "#access-console") {
      const timer = window.setTimeout(() => {
        document.getElementById("access-console")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => window.clearTimeout(timer);
    }
  }, []);

  return (
    <div className="w-full bg-[#0c0e13] text-white font-sans antialiased">
      <Hero />
      <EcosystemSection />
      <CapabilitiesSection />
      <WaitlistFormSection />
      <Footer />
    </div>
  );
}
