import { Home, Bookmark, Bell, User } from "lucide-react";

export default function Navigation() {
  return (
    <>
      <div className="absolute w-full flex justify-center bottom-7">
        <div className="flex gap-7 py-2 z-90 border-1 border-gray-300 rounded-full px-5">
          <Home />
          <Bookmark />
          <Bell />
          <User />
        </div>
      </div>
    </>
  );
}
