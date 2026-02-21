import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AddInventoryForm from "@/components/inventory/AddInventoryForm";

export default async function InventoryPage() {
    const session = await auth()

    if (!session) {
        redirect("/api/auth/signin")
    }

    const inventory = await prisma.inventoryItem.findMany({
        where: {
            userId: session.user?.id
        },
        include: {
            foodItem: true
        },
        orderBy: { foodItem: { name: "asc" } }
    })

    const foodItems = await prisma.foodItem.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <main className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">My Inventory</h1>

            {/* Inventory List */}
            <div className="bg-white rounded-lg shadow mb-8">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold">Current Stock</h2>
                </div>

                {inventory.length === 0 ? (
                    <p className="p-4 text-gray-500">No items in your
                        inventory yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {inventory.map((item) => (
                            <li key={item.id} className="p-4 flex            
  justify-between items-center hover:bg-gray-50">
                                <div>
                                    <span
                                        className="font-medium">{item.foodItem.name}</span>
                                    <span className="ml-2 text-sm            
  text-gray-500">
                                        ({item.location})
                                    </span>
                                </div>
                                <span className="text-gray-700">
                                    {item.quantity} {item.unit}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Add Item Form */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold">Add Item</h2>
                </div>
                <div className="p-4">
                    <AddInventoryForm foodItems={foodItems} />
                </div>
            </div>
        </main>
    )
} 