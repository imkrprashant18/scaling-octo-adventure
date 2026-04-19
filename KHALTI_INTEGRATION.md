# Khalti Payment Integration Guide

This guide explains how to set up and use Khalti payment integration in your MediCare Plus application.

## Environment Variables

Add these to your `.env.local` file:

```env
# Khalti Configuration
KHALTI_SECRET_KEY=your_khalti_secret_key_here
KHALTI_PUBLIC_KEY=your_khalti_public_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Frontend URL for redirects
```

## Getting Khalti Credentials

1. Go to [Khalti Merchant Dashboard](https://merchant.khalti.com)
2. Sign up or log in
3. Navigate to Settings → API Keys
4. Copy your Secret Key and Public Key
5. Add them to your environment variables

## Payment Flow

### 1. Appointment Booking (Already Implemented)

When a patient books an appointment with a payment amount:

```javascript
POST /api/v1/patients/appointments

Body: {
  "doctorId": "doctor_id",
  "startTime": "2026-04-20T10:00:00Z",
  "endTime": "2026-04-20T10:30:00Z",
  "patientDescription": "General checkup",
  "amount": 5000  // Amount in rupees
}

Response: {
  "appointment": {
    "id": "apt_123",
    "status": "PAYMENT_PENDING",
    "payment": {
      "id": "pay_123",
      "amount": 5000,
      "status": "PENDING",
      "pidx": "xxx"
    }
  }
}
```

### 2. Initiate Payment

Frontend calls this endpoint to get the payment URL:

```javascript
POST /api/v1/patients/payments

Body: {
  "appointmentId": "apt_123"
}

Response: {
  "pidx": "xxx",
  "paymentUrl": "https://pay.khalti.com/?pidx=xxx",
  "appointmentId": "apt_123"
}
```

**Frontend Implementation:**

```javascript
// Initiate payment
const response = await fetch("/api/v1/patients/payments", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ appointmentId }),
});

const data = await response.json();

// Redirect to Khalti payment page
window.location.href = data.data.paymentUrl;
```

### 3. Payment Verification (After Payment)

After Khalti redirects back to your app:

```javascript
POST /api/v1/patients/payments/verify

Body: {
  "pidx": "xxx"  // From query params after Khalti redirect
}

Response: {
  "payment": {
    "status": "COMPLETED",
    "transactionId": "..."
  },
  "appointment": {
    "status": "SCHEDULED",
    "appointmentTime": "2026-04-20T10:00:00Z"
  }
}
```

**Frontend Implementation:**

```javascript
// After redirect from Khalti
const params = new URLSearchParams(window.location.search);
const pidx = params.get("pidx");

if (pidx) {
  const response = await fetch("/api/v1/patients/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pidx }),
  });

  const data = await response.json();

  if (data.success) {
    // Payment successful, redirect to appointment confirmation
    router.push(`/appointments/${data.data.appointment.id}`);
  }
}
```

### 4. Check Payment Status

```javascript
GET /api/v1/patients/payments/[paymentId]

Response: {
  "payment": {
    "id": "pay_123",
    "amount": 5000,
    "status": "COMPLETED",  // PENDING, COMPLETED, FAILED, REFUNDED
    "transactionId": "..."
  },
  "appointment": {
    "id": "apt_123",
    "status": "SCHEDULED",
    "doctorName": "Dr. John",
    "startTime": "2026-04-20T10:00:00Z"
  }
}
```

## Payment Status Flow

```
Appointment Booked
    ↓
Payment Record Created (PENDING)
    ↓
Initiate Payment (generates pidx)
    ↓
Patient redirected to Khalti
    ↓
Payment Completed on Khalti
    ↓
Two parallel methods:
  1. User redirects back → Verify endpoint
  2. Khalti sends webhook → Auto verified
    ↓
Payment Status: COMPLETED
Appointment Status: SCHEDULED
```

## Webhook Setup (Khalti Dashboard)

1. Go to Khalti Merchant Dashboard
2. Settings → Webhooks
3. Add webhook URL: `https://yourdomain.com/api/v1/payments/khalti-webhook`
4. Khalti will send POST requests when payments complete

The webhook handler automatically:

- Verifies Khalti signature
- Updates payment status to COMPLETED
- Changes appointment status from PAYMENT_PENDING to SCHEDULED
- Handles duplicate webhook calls gracefully

## Error Handling

### Common Error Codes

- `400` - Invalid request (missing appointmentId, pidx, etc.)
- `403` - Unauthorized (patient doesn't own this appointment/payment)
- `404` - Not found (appointment or payment not found)
- `500` - Khalti API error

### Payment Failures

If payment fails:

1. Payment status remains PENDING
2. Appointment status remains PAYMENT_PENDING
3. Patient can retry by calling `/api/v1/patients/payments` again

### Refunds

To refund a payment (admin only):

```javascript
// Future endpoint to implement
POST /api/v1/admin/payments/[paymentId]/refund

Response: {
  "status": "REFUNDED",
  "refundId": "..."
}
```

## Security Notes

1. **Never expose KHALTI_SECRET_KEY** - Keep it server-side only
2. **Verify signatures** on webhook - Already implemented
3. **Validate amounts** - Check before sending to Khalti
4. **Use HTTPS only** - Required for production
5. **Idempotency** - Same payment can be verified multiple times safely

## Testing in Development

Use Khalti's test credentials:

```env
KHALTI_SECRET_KEY=test_secret_xxx
KHALTI_PUBLIC_KEY=test_public_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For testing, use test payment gateway at:

- Dashboard: https://merchant.khalti.com (use test mode toggle)
- Test API endpoint: Already configured in the code

## Payment Amounts

Khalti stores amounts in **paisa** (smallest unit):

- 1 rupee = 100 paisa
- Frontend sends: 5000 (rupees)
- API sends to Khalti: 500000 (paisa)
- Conversion is handled automatically in the API

## Frontend Integration Example

```javascript
// pages/appointments/[id]/payment.tsx

import { useEffect, useState } from "react";

export default function PaymentPage({ appointmentId }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // 1. Initiate payment
      const res = await fetch("/api/v1/patients/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });

      const data = await res.json();

      // 2. Redirect to Khalti
      window.location.href = data.data.paymentUrl;
    } catch (error) {
      console.error("Payment initiation failed:", error);
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? "Processing..." : "Pay with Khalti"}
    </button>
  );
}
```

## Troubleshooting

### Issue: `pidx` not updating

- Check if appointment exists
- Verify patient owns the appointment
- Ensure KHALTI_SECRET_KEY is set correctly

### Issue: Payment verification fails

- Verify `pidx` is from URL params
- Check if amount matches
- Ensure webhook signature validation isn't too strict

### Issue: Webhook not called

- Verify webhook URL is publicly accessible
- Check Khalti dashboard webhook status
- Look for webhook delivery logs

## Support

For Khalti support, visit: https://support.khalti.com
For API docs, see: https://docs.khalti.com
