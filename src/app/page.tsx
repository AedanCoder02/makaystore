import Hero from '@/components/Hero';
import HomepageEvents from '@/components/HomepageEvents';
import HomepageMembership from '@/components/HomepageMembership';
import HomeOfferings from '@/components/home/HomeOfferings';
import HomeWhy from '@/components/home/HomeWhy';
import HomeCommunity from '@/components/home/HomeCommunity';
import HomeDay from '@/components/home/HomeDay';
import '@/styles/home-sections.css';
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
      <HomeOfferings />
      <HomeWhy />
      <HomeDay />
      <HomeCommunity />
      <Categories />
      <Newsletter />
      <Footer />
    </main>
  );
}
