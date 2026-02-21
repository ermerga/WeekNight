// INVENTORY API - /api/inventory
// Handles HTTP requests for inventory operations
// GET: Fetch user's inventory items
// POST: Add new inventory item
// (Individual item operations like PUT/DELETE go in [id]/route.ts)
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {                                                                                          
    // 1. Check if user is logged in                                                                                                      
    const session = await auth()                                                                                                          
    if (!session?.user?.id) {                                                                                                             
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })                                                                
    }                                                                                                                                     
                                                                                                                                          
    // 2. Parse the request body                                                                                                          
    const body = await request.json()                                                                                                     
    const { foodItemId, quantity, unit, location } = body                                                                                 
                                                                                                                                          
    // 3. Validate required fields                                                                                                        
    if (!foodItemId || !quantity || !unit) {                                                                                              
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })                                                     
    }                                                                                                                                     
                                                                                                                                          
    // 4. Create the inventory item                                                                                                       
    const item = await prisma.inventoryItem.create({                                                                                      
      data: {                                                                                                                             
        userId: session.user.id,                                                                                                          
        foodItemId,                                                                                                                       
        quantity: parseFloat(quantity),                                                                                                   
        unit,                                                                                                                             
        location,                                                                                                                         
      },                                                                                                                                  
      include: {                                                                                                                          
        foodItem: true,                                                                                                                   
      },                                                                                                                                  
    })                                                                                                                                    
                                                                                                                                          
    // 5. Return the created item                                                                                                         
    return NextResponse.json(item, { status: 201 })                                                                                       
  }  