import Landing from "@/components/Landing";
import Mainlayout from "@/components/layout/Mainlayout";
import { AuthProvider } from "@/context/AuthContext";
import PageShell from "@/components/PageShell";

/**
 * Home — root page
 *
 * Structure (unchanged):
 *   AuthProvider → Mainlayout → Landing
 *
 * UI additions:
 *   PageShell  → shows branded SplashScreen while Firebase resolves auth,
 *                then fades the page in with a smooth spring animation.
 */
export default function Home() {
  return (
    <AuthProvider>
      <Mainlayout>
        <PageShell>
          <Landing />
        </PageShell>
      </Mainlayout>
    </AuthProvider>
  );
}