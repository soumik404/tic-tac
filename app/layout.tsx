import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "../minikit.config";
import { RootProvider } from "./rootProvider";
import "./globals.css";

export const metadata = {
  title: "Tic Tac Toe — Play & Win",
  description: "Play Tic Tac Toe vs a smart bot",
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootProvider>
      <html lang="en">
        <body className={`${inter.variable} ${sourceCodePro.variable}`}>
          <div className="app-shell">
            <header className="header">
              <div className="brand">
                <h1>Tic Tac Toe</h1>
                <span className="tag">Play vs Bot • Win ETH (placeholder)</span>
              </div>
              
            </header>

            <main className="main">{children}</main>

            <footer className="footer">
              Created with ❤️ by <a href="https://x.com/gainchainn" target="_blank">Gainchainn </a><br></br>
 Smart-contract and payout integration coming
              next.
            </footer>
          </div>
        </body>
      </html>
    </RootProvider>
  );
}
