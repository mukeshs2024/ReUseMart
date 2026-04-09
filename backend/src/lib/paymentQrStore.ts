export interface ProductPaymentQrData {
    productId: string;
    paymentText: string;
    qrCodeUrl: string;
    updatedAt: number;
}

const productPaymentQrStore: Record<string, ProductPaymentQrData> = {};

function buildQrCodeUrl(paymentText: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentText)}`;
}

export function setProductPaymentQr(productId: string, paymentText: string): ProductPaymentQrData {
    const payload: ProductPaymentQrData = {
        productId,
        paymentText,
        qrCodeUrl: buildQrCodeUrl(paymentText),
        updatedAt: Date.now(),
    };

    productPaymentQrStore[productId] = payload;
    return payload;
}

export function getProductPaymentQr(productId: string): ProductPaymentQrData | null {
    return productPaymentQrStore[productId] ?? null;
}

export function hasProductPaymentQr(productId: string): boolean {
    return Boolean(productPaymentQrStore[productId]);
}
