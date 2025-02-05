export const formatCurrency = (value: number, currency: 'NGN' | 'USD') => {
    if (currency === 'NGN') {
        return `₦${value.toLocaleString('en-US')}`;
    }

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return formatter.format(value);
};

export const formatNumber = (value: number, decimals?: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals ?? 0,
        maximumFractionDigits: decimals ?? 0,
    }).format(value);
};


export const formatLength = (value: number) => {
    
    if (value >= 1e9) {
        return formatNumber(value / 1e9, 2) + 'B';
    } else if (value >= 1e6) {
        return formatNumber(value / 1e6, 2) + 'M';
    }
    return formatNumber(value, 0);
}


export const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};