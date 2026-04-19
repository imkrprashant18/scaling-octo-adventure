# Khalti Payment Setup Checklist

Follow these steps to complete the Khalti payment integration:

## ✅ Step 1: Environment Variables

Add to `.env.local`:

```env
# Khalti Credentials (Get from https://merchant.khalti.com)
KHALTI_SECRET_KEY=your_secret_key_here
KHALTI_PUBLIC_KEY=your_public_key_here

# Application URL (for Khalti redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ✅ Step 2: API Endpoints Created

The following endpoints are now available:

### Payment Initiation

- **POST** `/api/v1/patients/payments`
  - Initiates Khalti payment for an appointment
  - Returns: `pidx`, `paymentUrl`

### Payment Verification

- **POST** `/api/v1/patients/payments/verify`
  - Verifies payment after Khalti redirect
  - Updates appointment status to SCHEDULED
  - Updates payment status to COMPLETED

### Payment Status Check

- **GET** `/api/v1/patients/payments/[paymentId]`
  - Get payment and appointment details

### Khalti Webhook

- **POST** `/api/v1/payments/khalti-webhook`
  - Khalti sends payment notifications here
  - Auto-verifies and updates appointment

## ✅ Step 3: Khalti Dashboard Configuration

1. **Get API Keys:**
   - Visit https://merchant.khalti.com
   - Navigate to Settings → API Keys
   - Copy Secret Key and Public Key
   - Save to `.env.local`

2. **Configure Webhook:**
   - Go to Settings → Webhooks
   - Add endpoint: `https://yourdomain.com/api/v1/payments/khalti-webhook`
   - Select event: "Payment Completion"
   - Khalti will POST payment confirmations here

3. **Set Return URLs** (if needed):
   - Success: `https://yourdomain.com/appointments/[id]/success`
   - Failure: `https://yourdomain.com/appointments/[id]/failed`

## ✅ Step 4: Database Schema

Your Prisma schema already has the Payment model configured:

```prisma
model Payment {
  id            String        @id @default(uuid())
  amount        Int           // in rupees
  status        PaymentStatus // PENDING, COMPLETED, FAILED, REFUNDED
  pidx          String        @unique
  transactionId String?       @unique
  khaltiUser    String?       // Customer phone from Khalti
  appointmentId String        @unique
  appointment   Appointment   @relation(...)
  userId        String
  user          User          @relation(...)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

## ✅ Step 5: Frontend Implementation

### 1. Payment Page Component

```tsx
// pages/appointments/[id]/payment.tsx
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PaymentPage({ appointmentId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      // Call initiate endpoint
      const res = await fetch("/api/v1/patients/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });

      if (!res.ok) {
        throw new Error("Failed to initiate payment");
      }

      const { data } = await res.json();

      // Redirect to Khalti payment page
      window.location.href = data.paymentUrl;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Complete Your Payment</h1>
      {error && <p className="error">{error}</p>}
      <button onClick={handlePayment} disabled={loading}>
        {loading ? "Processing..." : "Pay Now with Khalti"}
      </button>
    </div>
  );
}
```

### 2. Success/Return Page

```tsx
// pages/appointments/[id]/payment-success.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const pidx = params.get("pidx");

  useEffect(() => {
    if (!pidx) return;

    // Verify payment
    fetch("/api/v1/patients/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pidx }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setTimeout(() => {
            router.push(`/appointments/${data.data.appointment.id}`);
          }, 2000);
        } else {
          setStatus("failed");
        }
      })
      .catch(() => setStatus("failed"));
  }, [pidx, router]);

  return (
    <div>
      {status === "verifying" && <p>Verifying payment...</p>}
      {status === "success" && <p>✓ Payment successful! Redirecting...</p>}
      {status === "failed" && <p>✗ Payment verification failed</p>}
    </div>
  );
}
```

## ✅ Step 6: Testing

### Test Payment Flow

1. **Create an appointment with amount:**

   ```bash
   curl -X POST http://localhost:3000/api/v1/patients/appointments \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "doctorId": "doctor_id",
       "startTime": "2026-04-20T10:00:00Z",
       "endTime": "2026-04-20T10:30:00Z",
       "amount": 5000
     }'
   ```

2. **Initiate payment:**

   ```bash
   curl -X POST http://localhost:3000/api/v1/patients/payments \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"appointmentId": "apt_123"}'
   ```

3. **Use Khalti test cards:**
   - Test Card: 4111111111111111
   - Month: Any
   - Year: Any (future)
   - CVV: Any 3 digits

## ✅ Step 7: Production Setup

### Before Going Live

1. **Enable HTTPS** - Required by Khalti
2. **Update NEXT_PUBLIC_APP_URL** to production domain
3. **Configure production API keys** in Khalti dashboard
4. **Set up webhook** with production URL
5. **Test end-to-end** payment flow
6. **Enable error logging** for payment failures

### Environment Variables (Production)

```env
KHALTI_SECRET_KEY=prod_secret_key
KHALTI_PUBLIC_KEY=prod_public_key
NEXT_PUBLIC_APP_URL=https://yourproductiondomain.com
```

## ✅ Step 8: Monitoring

### Logs to Check

- API logs: `/logs/payments/`
- Khalti webhook logs: Monitor in Khalti dashboard
- Database: `Payment` table for status tracking

### Error Scenarios

1. **Payment Pending** - Patient hasn't completed Khalti payment
2. **Payment Failed** - Khalti returned error
3. **Payment Duplicate** - User tried paying twice
4. **Webhook Failed** - Network issue, retry will happen

## ✅ Troubleshooting

### Issue: "KHALTI_SECRET_KEY is not set"

- Check `.env.local` file
- Restart Next.js dev server after adding env vars

### Issue: "pidx invalid"

- Ensure appointment exists
- Check payment amount matches

### Issue: "Webhook not received"

- Verify webhook URL is public (not localhost)
- Check Khalti dashboard webhook logs

## ✅ Testing Checklist

- [ ] Created `.env.local` with Khalti keys
- [ ] Updated Khalti dashboard webhook URL
- [ ] Tested appointment booking with amount
- [ ] Tested payment initiation
- [ ] Tested Khalti payment page redirect
- [ ] Tested payment verification
- [ ] Checked database for payment records
- [ ] Verified appointment status updated to SCHEDULED

## 📚 Documentation Files

- `KHALTI_INTEGRATION.md` - Complete integration guide
- `src/lib/khalti.ts` - Khalti utility functions
- API endpoint files:
  - `src/app/api/v1/patients/payments/route.ts`
  - `src/app/api/v1/patients/payments/verify/route.ts`
  - `src/app/api/v1/patients/payments/[paymentId]/route.ts`
  - `src/app/api/v1/payments/khalti-webhook/route.ts`

## 🆘 Support

- Khalti Docs: https://docs.khalti.com
- Khalti Support: https://support.khalti.com
- Your API is ready, just add env vars and test!
