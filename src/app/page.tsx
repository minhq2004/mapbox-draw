import { Map } from "@/components/Map";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
  return (
    <main className="w-screen h-screen relative">
      <Navbar />
      <Map />
    </main>
  );
}
