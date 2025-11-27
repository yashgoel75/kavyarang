import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";

export default function Competitions() {
  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-12 min-h-[85vh] inter-normal">
        <div className="mb-12">
          <h1 className="text-3xl font-semibold mb-2">
            Embrace the Challenge ✍️
          </h1>
          <p className="text-lg text-gray-600">
            Seize every literary chance to write, compete, and shine.
          </p>
        </div>
        <section>
          <div className="text-xl font-bold my-2">Upcoming Events</div>
          <div className="rounded-md p-4 border-gray-200 border-1"></div>
        </section>
      </main>

      <Navigation />
      <Footer />
    </>
  );
}
