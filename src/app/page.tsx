import Hero from '@/components/Hero';
import HomepageEvents from '@/components/HomepageEvents';
import HomepageMembership from '@/components/HomepageMembership';
import FeaturedCollection from '@/components/FeaturedCollection';
import WhyMakay from '@/components/WhyMakay';
import Testimonials from '@/components/Testimonials';
import HowItWorks from '@/components/HowItWorks';
import Categories from '@/components/Categories';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import ScrollColorEngine from '@/components/ScrollColorEngine';

export default function Home() {
  return (
    <main className="w-full">
      <ScrollColorEngine />
      <div id="hero-section">
        <Hero />
      </div>
      <HomepageEvents />
      <HomepageMembership />
      <FeaturedCollection />
      <WhyMakay />
      <Testimonials />
      <HowItWorks />
      <Categories />
      <Newsletter />
      <Footer />
    </main>
  );
}
