
import ContentSection from "@/components/content-4";
import Features from "@/components/features-2";
import FooterSection from "@/components/footer";
import { HeroHeader } from "@/components/header";
import HeroSection from "@/components/hero-section";
import { InfiniteSlider } from "@/components/infinite-slider";
import IntegrationsSection from "@/components/integrations-7";
import { Content } from "next/font/google";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <Features />
      <IntegrationsSection />
      <ContentSection />  
      <FooterSection />
  

    </div>
  );
}
