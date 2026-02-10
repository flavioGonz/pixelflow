import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Obtener el token de las cookies
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Obtener los datos del body
        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Se requieren ambas contraseñas' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            );
        }

        // Hacer la petición al backend de Express
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || 'Error al cambiar contraseña' },
                { status: response.status }
            );
        }

        return NextResponse.json(
            { message: 'Contraseña actualizada correctamente' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
