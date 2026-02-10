import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/contexts/AuthContext";
import { CurrencyProvider } from "@/components/contexts/CurrencyContext";
import { I18nProvider } from "@/components/contexts/I18nProvider";
import SubscriptionRefresher from "@/components/SubscriptionRefresher";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  display: "swap", // Prevents render blocking - shows fallback font immediately
});

export const metadata = {
  title: "KHbnb",
  description: "Experience the beauty of Cambodia with KHbnb",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head></head>
      <body className={nunitoSans.className}>
        <AuthProvider>
          <I18nProvider>
            <CurrencyProvider>
              <SubscriptionRefresher />
              {children}
            </CurrencyProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
