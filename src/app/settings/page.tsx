"use client";

import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getFirebaseToken } from "@/utils";

export default function Settings() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [useDefaultColor, setUseDefaultColor] = useState(false);
  const [defaultColor, setDefaultColor] = useState("#ffffff");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user?.email) {
        try {
          const token = await getFirebaseToken();
          const res = await fetch(
            `/api/getPostColor?email=${encodeURIComponent(user.email)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const data = await res.json();
          if (data?.user?.defaultPostColor) {
            setUseDefaultColor(true);
            setDefaultColor(data.user.defaultPostColor);
          }
        } catch (err) {
          console.error("Failed to fetch user color:", err);
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!firebaseUser?.email) return;

    const cached = localStorage.getItem("userData");
    if (cached) {
      const parsed = JSON.parse(cached);
      localStorage.setItem(
        "userData",
        JSON.stringify({
          ...parsed,
          defaultPostColor: useDefaultColor ? defaultColor : "null",
        })
      );
    } else {
      localStorage.setItem(
        "userData",
        JSON.stringify({
          defaultPostColor: useDefaultColor ? defaultColor : "null",
        })
      );
    }

    setSaving(true);
    setNotification(null);

    try {
      const token = await getFirebaseToken();
      await fetch("/api/getPostColor", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          defaultPostColor: useDefaultColor ? defaultColor : "null",
        }),
      });
      setNotification({
        type: "success",
        message: "Settings saved successfully!",
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error("Error saving default color:", err);
      setNotification({
        type: "error",
        message: "Failed to save settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#9a6f0bff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen px-5 md:px-20 py-10 bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-[#9a6f0bff] to-[#dbb56aff] bg-clip-text text-transparent mb-2">
              Settings
            </h2>
            <p className="text-gray-600">Customize your posting experience</p>
          </div>

          {notification && (
            <div
              className={`mb-6 p-4 rounded-lg border-l-4 shadow-sm transition-all duration-300 ${
                notification.type === "success"
                  ? "bg-green-50 border-green-500 text-green-800"
                  : "bg-red-50 border-red-500 text-red-800"
              }`}
            >
              <div className="flex items-center gap-3">
                {notification.type === "success" ? (
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <p className="font-medium">{notification.message}</p>
              </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9a6f0bff] to-[#dbb56aff] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-800">
                  Default Post Color
                </h3>
                <p className="text-sm text-gray-500">
                  Set a color that will be applied to all your posts
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-100">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex-1">
                  <span className="text-lg font-medium text-gray-800 group-hover:text-[#9a6f0bff] transition-colors">
                    Enable default color
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {useDefaultColor
                      ? "Your posts will use the selected color"
                      : "Posts will use their default colors"}
                  </p>
                </div>
                <div className="relative ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={useDefaultColor}
                    onChange={(e) => setUseDefaultColor(e.target.checked)}
                  />
                  <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-[#9a6f0bff] peer-checked:to-[#dbb56aff] transition-all duration-300"></div>
                  <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-7 shadow-md"></div>
                </div>
              </label>
            </div>

            {useDefaultColor && (
              <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border-2 border-dashed border-gray-200 mb-6 animate-in fade-in duration-300">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose your color
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <input
                      type="color"
                      value={defaultColor}
                      onChange={(e) => setDefaultColor(e.target.value)}
                      className="w-15 h-15 rounded-xl border-4 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200"
                      style={{ boxShadow: `0 4px 20px ${defaultColor}40` }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-bold text-gray-800">
                        {defaultColor.toUpperCase()}
                      </span>
                    </div>
                    <div
                      className="h-8 rounded-lg shadow-inner"
                      style={{ backgroundColor: defaultColor }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full cursor-pointer px-3 py-1 rounded-xl text-white font-semibold text-lg transition-all duration-300 shadow-lg ${
                saving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#9a6f0bff] to-[#dbb56aff] hover:shadow-2xl"
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Save Settings
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <Navigation />
      <Footer />
    </>
  );
}
