mport type { Metadata } from "next";
export const metadata: Metadata = {
  title: "KING DIMSUM",
  description: "Baca cerita favoritmu dan buka chapter eksklusif dengan KING COIN."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body style={{margin:0,fontFamily:"Arial, sans-serif",background:"#f7f5f0",color:"#24211c"}}>{children}</body></html>;
}
