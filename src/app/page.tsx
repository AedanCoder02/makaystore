import Hero from '@/components/Hero';
import FeaturedCollection from '@/components/FeaturedCollection';
import WhyMakay from '@/components/WhyMakay';
import Testimonials from '@/components/Testimonials';
import HowItWorks from '@/components/HowItWorks';
import Categories from '@/components/Categories';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="w-full">
      <Hero />
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
