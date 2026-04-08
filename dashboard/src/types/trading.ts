export interface BookEntry {
    price: number;
    quantity: number;
}

export interface DealEntry {
    orderId: string;
    pair: string;
    side: 'buy' | 'sell';
    price: number;
    ts: number;
}
