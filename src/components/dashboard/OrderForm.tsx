
function OrderForm() {
    return (
        <div className="gradient-background">
            <div className="flex space-x-2 mb-4">
                <button className="flex-1 bg-green-500 text-white py-2 rounded">Long</button>
                <button className="flex-1 bg-red-500 text-white py-2 rounded">Short</button>
            </div>
            <div className="space-y-4">
                {['Trigger Price', 'Order Price', 'Amount', 'Leverage'].map((field) => (
                    <div key={field} className="space-y-2">
                        <label className="text-sm text-gray-400">{field}</label>
                        <input
                            type="text"
                            className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                ))}
                <button className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600">
                    Place Order
                </button>
            </div>
        </div>
    )
}

export default OrderForm