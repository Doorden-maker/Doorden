import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function TrainingSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-10 pb-10">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Received!</h1>
          <p className="text-gray-600 mb-6">
            Your training purchase is pending admin confirmation.
            Your training level will be updated once confirmed — usually within 24 hours.
          </p>
          <Link href="/rep" className="text-blue-600 hover:underline block mb-2">← Back to Dashboard</Link>
          <Link href="/rep/training" className="text-blue-600 hover:underline text-sm">View Training Center</Link>
        </CardContent>
      </Card>
    </div>
  );
}
