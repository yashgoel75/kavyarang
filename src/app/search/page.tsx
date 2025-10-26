import { Suspense } from "react";
import SearchContent from "./SearchContent";

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-gray-500 p-8">Loading search...</p>}>
      <SearchContent />
    </Suspense>
  );
}
