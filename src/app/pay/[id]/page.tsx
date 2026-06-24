import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { PayButton } from "@/components/pay-button";
import { DEPOSIT_PERCENT } from "@/lib/constants";

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: { business: true },
  });

  if (!job || !["awaiting_deposit"].includes(job.status)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          {job?.status === "confirmed" ? (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Deposit Already Paid</h1>
              <p className="text-gray-600">Your deposit has been received. The business will be in touch to schedule your service.</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Not Available</h1>
              <p className="text-gray-600">This payment link is no longer active.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const depositAmount = job.depositAmount || job.estimatedPrice * DEPOSIT_PERCENT;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pay Your Deposit</h1>
          <p className="text-gray-500">Secure payment powered by Stripe</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500 uppercase font-medium mb-1">Service Provider</p>
            <p className="font-semibold text-gray-900">{job.business.businessName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase font-medium mb-1">Service</p>
            <p className="text-gray-900">{job.serviceType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase font-medium mb-1">Job Address</p>
            <p className="text-gray-900">{job.homeownerAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase font-medium mb-1">Description</p>
            <p className="text-sm text-gray-700">{job.description}</p>
          </div>

          <hr className="border-gray-200" />

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Job Value</span>
            <span className="text-gray-900">{formatCurrency(job.estimatedPrice)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg">
            <span className="text-gray-900">Deposit Due ({Math.round(DEPOSIT_PERCENT * 100)}%)</span>
            <span className="text-blue-600">{formatCurrency(depositAmount)}</span>
          </div>
          <p className="text-xs text-gray-400">
            Remaining {formatCurrency(job.estimatedPrice - depositAmount)} is due directly to the business upon completion.
          </p>

          {job.stripePaymentUrl && job.stripePaymentUrl.startsWith("https://checkout.stripe.com") ? (
            <a
              href={job.stripePaymentUrl}
              className="block w-full text-center bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Pay {formatCurrency(depositAmount)} Securely
            </a>
          ) : (
            <PayButton jobId={id} amount={depositAmount} />
          )}
        </div>
      </div>
    </div>
  );
}
