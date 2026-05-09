import { AllocatorSection } from "./_sections/AllocatorSection";
import { FAQ } from "./_sections/FAQ";
import { Footer } from "./_sections/Footer";
import { Founding } from "./_sections/Founding";
import { Hero } from "./_sections/Hero";
import { MathSection } from "./_sections/MathSection";

export default function Page() {
  return (
    <main className="bg-paper text-ink">
      <Hero />
      <AllocatorSection />
      <Founding />
      <FAQ />
      <MathSection />
      <Footer />
    </main>
  );
}
