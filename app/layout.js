import "./globals.css";

export const metadata = {
  title: "Medical Appointment Booking",
  description: "Book your medical appointments online",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
