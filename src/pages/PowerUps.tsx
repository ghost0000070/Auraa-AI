import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { db } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from "@/components/ui/sonner";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { Header } from "@/components/Header";

interface PowerUp {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'pending';
  details: Record<string, unknown>;
}

const PowerUps = () => {
  const { user } = useAuth();
  const [powerUps, setPowerUps] = useState<PowerUp[]>(
    [
      { id: "1", name: "AI-Driven Anomaly Detection", description: "Automatically detect anomalies in your data patterns.", status: "inactive", details: {} },
      { id: "2", name: "Automated Report Generation", description: "Generate comprehensive reports automatically.", status: "inactive", details: {} },
      { id: "3", name: "Predictive Analytics Module", description: "Forecast future trends and outcomes with high accuracy.", status: "inactive", details: {} },
    ]
  );

  useEffect(() => {
    if (!user) return;

    const fetchPowerUpStatus = async () => {
        const powerUpsCollectionRef = collection(db, `users/${user.uid}/powerUps`);
        const querySnapshot = await getDocs(powerUpsCollectionRef);
        if (!querySnapshot.empty) {
            const userPowerUps = querySnapshot.docs.map(doc => doc.data() as PowerUp);
            setPowerUps(currentPowerUps =>
                currentPowerUps.map(p => userPowerUps.find(up => up.id === p.id) || p)
            );
        }
    };

    fetchPowerUpStatus();
  }, [user]);

  const togglePowerUpStatus = async (id: string) => {
    if (!user) return;

    const powerUp = powerUps.find(p => p.id === id);
    if (!powerUp) return;

    const newStatus = powerUp.status === 'active' ? 'inactive' : 'active';
    const powerUpRef = doc(db, `users/${user.uid}/powerUps`, id);

    try {
        await setDoc(powerUpRef, { ...powerUp, status: newStatus }, { merge: true });
        setPowerUps(powerUps.map(pu => (pu.id === id ? { ...pu, status: newStatus } : pu)));
        toast("Power-up Toggled", {
            description: "Power-up status has been updated.",
        });
    } catch (error) {
        console.error("Error toggling power-up:", error);
        toast.error("Failed to update power-up status.");
    }
  };

  return (
    <SubscriptionGuard requiredTier="Premium">
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Power-Ups</h1>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {powerUps.map((powerUp) => (
              <Card key={powerUp.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{powerUp.name}</CardTitle>
                  {powerUp.status === 'active' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {powerUp.status === 'inactive' && <XCircle className="h-4 w-4 text-red-500" />}
                  {powerUp.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                </CardHeader>
                <CardContent>
                  <CardDescription>{powerUp.description}</CardDescription>
                  <div className="mt-4">
                    <button
                      onClick={() => togglePowerUpStatus(powerUp.id)}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${powerUp.status === 'active' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                    >
                      {powerUp.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </SubscriptionGuard>
  );
};

export default PowerUps;
