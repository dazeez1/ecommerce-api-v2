const simulatePayment = async (paymentData) => {
  try {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    // 80% success rate simulation
    const isSuccess = Math.random() < 0.8;

    if (isSuccess) {
      return {
        success: true,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        amount: paymentData.amount,
        currency: paymentData.currency || "USD",
        status: "completed",
        timestamp: new Date().toISOString(),
        message: "Payment processed successfully",
      };
    } else {
      // Simulate different failure reasons
      const failureReasons = [
        "Insufficient funds",
        "Card declined",
        "Invalid card information",
        "Network timeout",
        "Payment gateway error",
      ];
      const randomReason = failureReasons[Math.floor(Math.random() * failureReasons.length)];

      return {
        success: false,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        amount: paymentData.amount,
        currency: paymentData.currency || "USD",
        status: "failed",
        timestamp: new Date().toISOString(),
        message: randomReason,
        errorCode: `ERR-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      status: "error",
      timestamp: new Date().toISOString(),
      message: "Payment processing error",
      error: error.message,
    };
  }
};

const validatePaymentData = (paymentData) => {
  const requiredFields = ["amount", "paymentMethod"];
  const missingFields = requiredFields.filter((field) => !paymentData[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  if (paymentData.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const validPaymentMethods = ["credit_card", "debit_card", "paypal", "stripe"];
  if (!validPaymentMethods.includes(paymentData.paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  return true;
};

const generatePaymentReceipt = (paymentResult, orderData) => {
  if (!paymentResult.success) {
    return null;
  }

  return {
    receiptNumber: `RCP-${Date.now()}`,
    transactionId: paymentResult.transactionId,
    orderNumber: orderData.orderNumber,
    amount: paymentResult.amount,
    currency: paymentResult.currency,
    paymentMethod: orderData.paymentMethod,
    status: paymentResult.status,
    timestamp: paymentResult.timestamp,
    customer: {
      name: `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`,
      email: orderData.user.email,
    },
    items: orderData.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    })),
    totals: {
      subtotal: orderData.subtotal,
      shipping: orderData.shippingCost,
      tax: orderData.tax,
      total: orderData.total,
    },
  };
};

module.exports = {
  simulatePayment,
  validatePaymentData,
  generatePaymentReceipt,
};
