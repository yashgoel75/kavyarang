import GradientText from "../GradientText";
import "./page.css";
import { Search, User } from "lucide-react";

export default function Header() {
  return (
    <>
      <div className="flex justify-between items-center px-5 mt-2 md:mt-0">
        <GradientText
          colors={[
            "#9a6f0bff",
            "#bd9864ff",
            "#dbb56aff",
            "#7f7464ff",
            "#e9e99dff",
          ]}
          animationSpeed={5}
          showBorder={false}
          className="custom-class text-[35px] md:text-[65px] ml-1"
        >
          kavyansh
        </GradientText>
        <div className="mr-5 md:hidden">
          <Search></Search>
        </div>
        <div className="flex items-center bg-gray-100 border-1 hidden md:flex md:w-[500px] border-gray-300 px-3 focus:outline-none rounded-md md:rounded-2xl h-[30px] md:h-[50px] mx-5">
          <Search color="gray" />
          <input
            className="text-lg mx-3 h-full w-full focus:outline-none"
            placeholder="Search stories, authors, or topics..."
          ></input>
        </div>
        <div>
          <User />
        </div>
      </div>
    </>
  );
}
