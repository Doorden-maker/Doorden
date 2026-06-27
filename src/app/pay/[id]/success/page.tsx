import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function PaySuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: { business: true },
  });

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Deposit Confirmed!</h1>
        <p className="text-gray-600 mb-6">
          Your deposit of{" "}
          <strong>{job ? formatCurrency(job.depositAmount || job.estimatedPrice * 0.18) : ""}</strong>{" "}
          has been received.
        </p>
        {job && (
          <div className="bg-gray-50 rounded-xl p-6 text-left space-y-3 mb-6">
            <div>
              <span className="text-sm text-gray-500">Service Provider</span>
              <p className="font-semibold">{job.business.businessName}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Service</span>
              <p className="font-medium">{job.serviceType}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Remaining Balance</span>
              <p className="font-medium">{formatCurrency(job.estimatedPrice - (job.depositAmount || job.estimatedPrice * 0.18))}</p>
              <p className="text-xs text-gray-400">Due directly to the business upon completion</p>
            </div>
          </div>
        )}
        <p className="text-sm text-gray-500">
          {job?.business.businessName} will contact you to schedule your service. Thank you!
        </p>
      </div>
    </div>
  );
}
