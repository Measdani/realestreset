import { NextResponse } from "next/server"; import { isAdmin } from "@/lib/auth"; import { ensureSchema,getDb } from "@/lib/db";
export async function GET(){if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});await ensureSchema();const rows=await getDb()`SELECT * FROM quote_requests ORDER BY created_at DESC LIMIT 200`;return NextResponse.json({quotes:rows})}
