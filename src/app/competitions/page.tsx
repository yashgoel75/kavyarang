import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";

export default function Competitions() {
  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-12 min-h-[85vh] inter-normal">
        {/* Slogan Section */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-semibold mb-2">
            Embrace the Challenge ✍️
          </h1>
          <p className="text-lg text-gray-600">
            Seize every literary chance to write, compete, and shine.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {[
            "Debate",
            "Open-mic",
            "Poetry",
            "Literature-Quiz",
            "Story-Telling",
            "Just-a-Minute",
          ].map((item) => (
            <button
              key={item}
              className="px-5 py-2 border border-gray-300 rounded-full hover:bg-gray-100 transition"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Event Cards Carousel (static layout like mockup) */}
        <div className="relative flex items-center gap-6 overflow-x-auto pb-4">
          {/* Left Arrow */}
          <button className="absolute left-0 bg-white p-2 rounded-full shadow cursor-pointer">
            ◀
          </button>

          {/* Cards */}
          {[1, 2, 3, 4, 5].map((id) => (
            <div
              key={id}
              className="min-w-[200px] border border-gray-300 rounded-xl p-4 flex-shrink-0"
            >
              <div className="w-full h-24 bg-gray-200 rounded-md mb-3"></div>
              <h3 className="text-lg font-semibold mb-1">Dastan 2.0</h3>

              <p className="text-sm text-gray-600">Mode: Online</p>
              <p className="text-sm text-gray-600">Date: 25th November, 2025</p>

              <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                <span>1 Applied</span>
              </div>

              <p className="text-sm text-gray-500">13 days left</p>

              <div className="text-center mt-2 text-xl cursor-pointer">⌄</div>
            </div>
          ))}

          {/* Right Arrow */}
          <button className="absolute right-0 bg-white p-2 rounded-full shadow cursor-pointer">
            ▶
          </button>
        </div>
      </main>

      <Navigation />
      <Footer />
    </>
  );
}
