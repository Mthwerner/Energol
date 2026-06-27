import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  name:   z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(50).optional(),
  avatar: z.string().max(40).optional(),
}).refine((d) => d.name !== undefined || d.avatar !== undefined, {
  message: 'Informe name ou avatar',
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const data: { name?: string; avatar?: string } = {};
  if (parsed.data.name)   data.name   = parsed.data.name;
  if (parsed.data.avatar) data.avatar = parsed.data.avatar;

  await prisma.user.update({ where: { id: session.user.id }, data });

  return NextResponse.json({ ok: true, ...data });
}
