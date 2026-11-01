export function runtimeConfig() {
  const eventMode = process.env.APP_MODE === 'event';
  const paymentsConfigured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  const paymentsTestMode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') === true;
  return {
    eventMode,
    consultationsAvailable: !eventMode && process.env.CONSULTATIONS_ENABLED !== 'false',
    paymentsConfigured,
    paymentsTestMode,
    customerPaymentsAvailable: !eventMode && process.env.CUSTOMER_PAYMENTS_ENABLED === 'true' && paymentsConfigured,
    videoConfigured: !!(process.env.AGORA_APP_ID && process.env.AGORA_APP_CERTIFICATE),
    databaseConfigured: !!process.env.MONGODB_URI,
  };
}
