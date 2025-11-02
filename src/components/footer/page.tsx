"use client";

import "./page.css";
import logo from "@/assets/logo.png";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Footer() {
  const router = useRouter();
  const year = new Date().getFullYear();

  return (
    <footer
      id="app-footer"
      className="bg-gray-100 px-6 py-10 pt-10 onest-normal"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Link className="focus:outline-none" href={"/"}>
            <Image src={logo} width={150} alt="Kavyansh"></Image>
          </Link>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">About Us</h3>
          <p className="text-sm text-gray-400">
            A creative space for students to share their thoughts, poems,
            stories, and experiences - express yourself freely, connect with
            others, and let your voice be heard.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li
              className="hover:cursor-pointer"
              onClick={() => router.push("/")}
            >
              Home
            </li>
            <li
              className="hover:cursor-pointer"
              onClick={() => router.push("/about")}
            >
              About Us
            </li>
            <li
              className="hover:cursor-pointer"
              onClick={() => router.push("/team")}
            >
              Our Team
            </li>
            {/* <li
              className="hover:cursor-pointer"
              onClick={() => router.push("/releasenotes")}
            >
              Release Notes
            </li> */}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Connect</h3>
          <ul className="space-y-2 text-sm">
            {/* <li>
              <a
                href="mailto:connect@cleit.in"
                className="hover:text-gray-700 transition"
              >
                connect@cleit.in
              </a>
            </li> */}
            <li
              className="hover:cursor-pointer"
              onClick={() => router.push("/contact")}
            >
              Contact Us
            </li>
            {/* <li>
              <a
                href="https://twitter.com/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-gray-700 transition"
              >
                Instagram
              </a>
            </li>
             */}
            <li>
              <a
                href="https://linkedin.com/company/cleit"
                target="_blank"
                rel="noreferrer"
                className="hover:text-gray-700 transition"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center text-sm md:text-base mt-10 border-t border-gray-300 pt-5">
        © {year} Kavyansh. All rights reserved.
      </div>
    </footer>
  );
}
