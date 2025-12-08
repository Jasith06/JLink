// utils/AlertManager.js
// Create this file in: mobile-app/utils/AlertManager.js

/**
 * Parse date from DD.MM.YYYY format
 */
const parseDate = (dateString) => {
    if (!dateString) return null;

    const parts = dateString.split('.');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);

        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(year, month, day);
        }
    }

    // Try ISO format as fallback
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
        return isoDate;
    }

    return null;
};

/**
 * Check for low stock items
 */
export const checkLowStock = (products) => {
    if (!Array.isArray(products)) return [];

    return products.filter(product => {
        const quantity = parseInt(product.quantity) || 0;
        const threshold = parseInt(product.lowStockThreshold) || 10;
        return quantity <= threshold && quantity > 0;
    });
};

/**
 * Check for out of stock items
 */
export const checkOutOfStock = (products) => {
    if (!Array.isArray(products)) return [];

    return products.filter(product => {
        const quantity = parseInt(product.quantity) || 0;
        return quantity === 0;
    });
};

/**
 * Check for items expiring soon (within specified days)
 */
export const checkExpiringSoon = (products, days = 15) => {
    if (!Array.isArray(products)) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return products.filter(product => {
        if (!product.expiryDate) return false;

        const expiryDate = parseDate(product.expiryDate);
        if (!expiryDate) return false;

        expiryDate.setHours(0, 0, 0, 0);

        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays <= days && diffDays > 0;
    });
};

/**
 * Check for expired items
 */
export const checkExpired = (products) => {
    if (!Array.isArray(products)) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return products.filter(product => {
        if (!product.expiryDate) return false;

        const expiryDate = parseDate(product.expiryDate);
        if (!expiryDate) return false;

        expiryDate.setHours(0, 0, 0, 0);

        return expiryDate < now;
    });
};

/**
 * Group products by name
 */
export const groupProductsByName = (products) => {
    if (!Array.isArray(products)) return {};

    const grouped = {};

    products.forEach(product => {
        const baseName = product.name || 'Unknown';

        if (!grouped[baseName]) {
            grouped[baseName] = {
                name: baseName,
                products: [],
                totalQuantity: 0,
                category: product.category || '',
                lowestPrice: product.price,
                highestPrice: product.price,
            };
        }

        grouped[baseName].products.push(product);
        grouped[baseName].totalQuantity += parseInt(product.quantity) || 0;

        // Track price range
        if (product.price < grouped[baseName].lowestPrice) {
            grouped[baseName].lowestPrice = product.price;
        }
        if (product.price > grouped[baseName].highestPrice) {
            grouped[baseName].highestPrice = product.price;
        }
    });

    return grouped;
};

/**
 * Get all alerts for products
 */
export const getAllAlerts = (products) => {
    const alerts = {
        lowStock: checkLowStock(products),
        outOfStock: checkOutOfStock(products),
        expiringSoon: checkExpiringSoon(products),
        expired: checkExpired(products)
    };

    alerts.total =
        alerts.lowStock.length +
        alerts.outOfStock.length +
        alerts.expiringSoon.length +
        alerts.expired.length;

    return alerts;
};

/**
 * Generate alert messages
 */
export const generateAlertMessage = (alerts) => {
    const messages = [];

    if (alerts.outOfStock.length > 0) {
        messages.push(`⚠️ ${alerts.outOfStock.length} item(s) out of stock`);
    }

    if (alerts.lowStock.length > 0) {
        messages.push(`📉 ${alerts.lowStock.length} item(s) low on stock`);
    }

    if (alerts.expired.length > 0) {
        messages.push(`❌ ${alerts.expired.length} item(s) expired`);
    }

    if (alerts.expiringSoon.length > 0) {
        messages.push(`⏰ ${alerts.expiringSoon.length} item(s) expiring soon`);
    }

    return messages.join('\n');
};

/**
 * Check if a specific product has alerts
 */
export const hasProductAlerts = (product) => {
    const quantity = parseInt(product.quantity) || 0;
    const threshold = parseInt(product.lowStockThreshold) || 10;

    const isLowStock = quantity <= threshold && quantity > 0;
    const isOutOfStock = quantity === 0;

    let isExpiringSoon = false;
    let isExpired = false;

    if (product.expiryDate) {
        const expiryDate = parseDate(product.expiryDate);
        if (expiryDate) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            expiryDate.setHours(0, 0, 0, 0);

            const diffTime = expiryDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            isExpiringSoon = diffDays <= 15 && diffDays > 0;
            isExpired = expiryDate < now;
        }
    }

    return {
        hasAlerts: isLowStock || isOutOfStock || isExpiringSoon || isExpired,
        isLowStock,
        isOutOfStock,
        isExpiringSoon,
        isExpired
    };
};