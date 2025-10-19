"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GradientText from "@/components/GradientText";
import "./page.css";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 3000); // Redirect after 3 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="main-container bg-[#2E2B26] flex flex-col items-center justify-center min-h-screen p-4">
      <span className="text-4xl text-[#D8C3A5]">Welcome to</span>
      <GradientText
        colors={["#F5F5DC", "#D8C3A5", "#CBB994", "#A39887", "#F5F5DC"]}
        animationSpeed={5}
        showBorder={false}
        className="custom-class text-[100px]"
      >
        KavyaRang
      </GradientText>

      {/* Loading animation below KavyaRang */}
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
