"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TrainingContent {
  id: string;
  level: number;
  title: string;
  contentType: string;
  content: string;
}

const LEVEL_NAMES: Record<number, string> = { 1: "Foundation", 2: "Intermediate", 3: "Advanced", 4: "Expert" };
const LEVEL_PRICES: Record<number, string> = { 2: "$15", 3: "$30", 4: "$50" };

export default function TrainingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgradeLevel = searchParams.get("upgrade");

  const [content, setContent] = useState<TrainingContent[]>([]);
  const [repLevel, setRepLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetch("/api/training/content").then(r => r.json()).then(setContent);
    fetch("/api/rep/profile").then(r => r.json()).then(d => setRepLevel(d.trainingLevel || 1));
  }, []);

  async function purchaseTraining(level: number) {
    setPurchasing(true);
    const res = await fetch("/api/training/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level }),
    });
    const json = await res.json();
    setPurchasing(false);

    if (json.url) {
      if (json.demo) {
        alert("Demo mode: Stripe not configured. In production, you'd be redirected to pay. Redirecting to success page.");
      }
      window.location.href = json.url;
    } else {
      alert(json.error || "Error starting payment");
    }
  }

  const byLevel: Record<number, TrainingContent[]> = { 1: [], 2: [], 3: [], 4: [] };
  content.forEach(c => { if (byLevel[c.level]) byLevel[c.level].push(c); });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Training Center</h1>
        <p className="text-gray-500">Your current level: <strong>Level {repLevel} — {LEVEL_NAMES[repLevel]}</strong></p>
      </div>

      {upgradeLevel && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Upgrade to Level {upgradeLevel} — {LEVEL_NAMES[parseInt(upgradeLevel)]}</h3>
                <p className="text-sm text-gray-600">One-time payment of {LEVEL_PRICES[parseInt(upgradeLevel)]}</p>
              </div>
              <Button onClick={() => purchaseTraining(parseInt(upgradeLevel))} disabled={purchasing}>
                {purchasing ? "Processing..." : `Pay ${LEVEL_PRICES[parseInt(upgradeLevel)]}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {[1, 2, 3, 4].map(level => (
        <Card key={level} className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Level {level} — {LEVEL_NAMES[level]}</CardTitle>
                <CardDescription>{level === 1 ? "Free" : LEVEL_PRICES[level]}</CardDescription>
              </div>
              {repLevel >= level ? (
                <Badge variant="success">Unlocked</Badge>
              ) : (
                <Button size="sm" onClick={() => purchaseTraining(level)} disabled={purchasing || level <= repLevel}>
                  Upgrade {LEVEL_PRICES[level]}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {repLevel >= level ? (
              byLevel[level].length === 0 ? (
                <p className="text-sm text-gray-500 italic">No content added yet for this level.</p>
              ) : (
                <div className="space-y-4">
                  {byLevel[level].map(item => (
                    <div key={item.id} className="border rounded-md p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{item.title}</h4>
                      {item.contentType === "video" ? (
                        <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                          <iframe src={item.content} className="w-full h-full" allowFullScreen />
                        </div>
                      ) : item.contentType === "lesson" ? (
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>
                        </div>
                      ) : (
                        <a href={item.content} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm">
                          📄 Open document →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-4xl mb-2">🔒</p>
                <p className="text-sm">Purchase Level {level} training to access this content</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
