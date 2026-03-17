import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WhyWeBuiltThis from "@/components/WhyWeBuiltThis";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import ReadinessStrip from "@/components/ReadinessStrip";
import TeamSection from "@/components/TeamSection";
import Footer from "@/components/Footer";
import ClickSpark from "@/components/ClickSpark";

const Index = () => (
  <ClickSpark sparkColor="#00D4FF" sparkCount={9} sparkRadius={18} duration={450}>
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <WhyWeBuiltThis />
      <Features />
      <HowItWorks />
      <ReadinessStrip />
      <TeamSection />
      <Footer />
    </div>
  </ClickSpark>
);

export default Index;
