import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";

export default function Settings() {
  return (
    <>
      <Header />
      <div className="relative min-h-screen flex items-center justify-center">
        My name is Bookmark
      </div>
      <Navigation />
      <Footer />
    </>
  );
}
