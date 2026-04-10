import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function GET() {
    await dbConnect();
    try {
        const users = await User.find({});
        return NextResponse.json({ success: true, data: users });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 400 });
    }
}