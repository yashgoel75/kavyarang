"use client"

import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";

export default function ShippingPolicy() {
    return (
        <>
            <Header />
            <Navigation />

            <main className="max-w-4xl mx-auto px-6 py-12 text-[#222] leading-relaxed">
                <h1 className="text-3xl font-semibold mb-6">Shipping & Delivery Policy</h1>

                <p className="mb-4">
                    At <strong>Kavyalok</strong>, all products, tickets, passes, and registrations are delivered 
                    digitally. Since we do not ship any physical goods, this Shipping & Delivery Policy explains 
                    how and when digital items are delivered after a successful purchase.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">1. Digital Delivery</h2>
                <p className="mb-4">
                    All tickets, event passes, registration confirmations, or digital documents are delivered 
                    instantly to the email address and account associated with the user. In most cases, delivery 
                    occurs <strong>within a few seconds of successful payment confirmation</strong>.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">2. Instant Access</h2>
                <p className="mb-4">
                    Upon completing the payment, users will:
                </p>
                <ul className="list-disc ml-6 mb-4">
                    <li>Receive an email containing the digital ticket or confirmation.</li>
                    <li>See the purchased item instantly available in their <strong>Kavyalok Dashboard</strong>.</li>
                    <li>Be able to download or view the ticket at any time from their account.</li>
                </ul>

                <h2 className="text-xl font-semibold mt-8 mb-3">3. Delivery Delays</h2>
                <p className="mb-4">
                    In rare cases, due to payment gateway verification, network issues, or email service delays, 
                    delivery may take up to <strong>1 hour</strong>. This typically occurs when:
                </p>
                <ul className="list-disc ml-6 mb-4">
                    <li>The payment is marked as “pending” or “processing” by the bank or gateway.</li>
                    <li>There is temporary downtime affecting email delivery.</li>
                    <li>Incorrect or mistyped email addresses were provided.</li>
                </ul>

                <p className="mb-4">
                    If your ticket or confirmation is not delivered within 1 hour, please contact our support team 
                    with your payment reference ID, and we will manually verify and deliver the digital item.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">4. No Physical Shipping</h2>
                <p className="mb-4">
                    Kavyalok does not ship, courier, or deliver any physical products. All items are digital and 
                    accessible directly through the platform. There are no shipping fees, logistics charges, or 
                    delivery partners involved.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">5. Failed Deliveries</h2>
                <p className="mb-4">
                    If a user does not receive their digital ticket or registration confirmation within 1 hour, they 
                    may reach out to our support team. We will resolve the issue by:
                </p>
                <ul className="list-disc ml-6 mb-4">
                    <li>Re-sending the digital item to the correct email address</li>
                    <li>Updating the associated email after verification</li>
                    <li>Providing the ticket directly inside the user’s Kavyalok dashboard</li>
                </ul>

                <h2 className="text-xl font-semibold mt-8 mb-3">6. Email & Account Responsibility</h2>
                <p className="mb-4">
                    Users are responsible for ensuring:
                </p>
                <ul className="list-disc ml-6 mb-4">
                    <li>The email they provide is correct and accessible.</li>
                    <li>Their inbox is not full or blocking automated emails.</li>
                    <li>They check spam/junk folders if the email does not appear.</li>
                </ul>

                <h2 className="text-xl font-semibold mt-8 mb-3">7. Need Help?</h2>
                <p className="mb-4">
                    For support related to digital delivery, payment confirmation, or missing tickets, please 
                    contact us through our support email or the help section on your dashboard. We usually respond 
                    within a few hours.
                </p>

                <p className="mt-8 text-sm text-gray-600">
                    This Shipping & Delivery Policy is effective as of the date of its publication on the website.
                </p>
            </main>

            <Footer />
        </>
    )
}
