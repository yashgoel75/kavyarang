"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GradientText from "@/components/GradientText";
import "./page.css";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     router.push("/dashboard");
  //   }, 3000);

  //   return () => clearTimeout(timer);
  // }, [router]);

  return (
    <main className="main-container bg-[#2E2B26] flex flex-col items-center justify-center min-h-screen p-4">
      <span className="text-4xl text-[#D8C3A5] dm-serif-display-regular-italic">
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
          className="welcome-text"
        >
          Welcome to
        </GradientText>
      </span>
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
        className="custom-class text-[65px] md:text-[100px]"
      >
        KavyaRang
      </GradientText>

      {loading && (
        <div className="loader mt-8">
          <div></div>
          <div></div>
          <div></div>
        </div>
      )}
    </main>
  );
}
