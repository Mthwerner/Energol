import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getPool, isParticipant } from '@/services/pool.service';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Trophy, Target, Star, Minus, HelpCircle, ListOrdered, Timer } from 'lucide-react';

export const metadata: Metadata = { title: 'Regras do Bolão' };

interface Props { params: Promise<{ id: string }> }

export default async function RulesPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const [pool, member] = await Promise.all([getPool(id), isParticipant(session.user.id, id)]);

  if (!pool || !pool.isActive) notFound();
  if (!member) redirect(`/pools/${id}`);

  return (
    <div>
      <Header
        title="Regras do Bolão"
        description={pool.name}
        actions={
          <Link href={`/pools/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} /> Voltar
            </Button>
          </Link>
        }
      />

      <div className="p-4 md:p-6 space-y-4 max-w-2xl">

        {/* Palpites */}
        <Card>
          <CardHeader className="pt-5 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock size={15} className="text-brand-400" />
              Palpites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-400">
            <p>Os palpites devem ser enviados <span className="text-slate-200 font-medium">até 1 hora antes</span> do início de cada partida. Após esse prazo, o jogo é bloqueado e não é possível alterar ou inserir palpites.</p>
            <p>Você pode atualizar seus palpites quantas vezes quiser antes do prazo.</p>
            <p>Jogos sem palpite registrado <span className="text-slate-200 font-medium">não pontuam</span>, mesmo que o resultado fosse correto.</p>
          </CardContent>
        </Card>

        {/* Pontuação */}
        <Card>
          <CardHeader className="pt-5 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star size={15} className="text-brand-400" />
              Sistema de Pontuação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                icon: <Trophy size={16} className="text-emerald-400" />,
                label: 'Placar exato',
                pts: 10,
                color: 'text-emerald-400',
                bg: 'bg-emerald-950/40 border-emerald-800',
                desc: 'Acertou o placar completo.',
                example: 'Palpite 2-1 · Resultado 2-1',
              },
              {
                icon: <Target size={16} className="text-cyan-400" />,
                label: 'Resultado + saldo de gols',
                pts: 7,
                color: 'text-cyan-400',
                bg: 'bg-cyan-950/40 border-cyan-800',
                desc: 'Acertou o vencedor (ou empate) e a diferença de gols, mas não o placar exato.',
                example: 'Palpite 2-0 · Resultado 3-1',
              },
              {
                icon: <Target size={16} className="text-amber-400" />,
                label: 'Resultado certo',
                pts: 5,
                color: 'text-amber-400',
                bg: 'bg-amber-950/40 border-amber-800',
                desc: 'Acertou quem venceu (ou que empataria), mas não o saldo.',
                example: 'Palpite 1-0 · Resultado 3-1',
              },
              {
                icon: <Star size={16} className="text-purple-400" />,
                label: 'Um placar certo',
                pts: 3,
                color: 'text-purple-400',
                bg: 'bg-purple-950/40 border-purple-800',
                desc: 'Acertou exatamente o número de gols de um dos dois times.',
                example: 'Palpite 2-1 · Resultado 2-3',
              },
              {
                icon: <Minus size={16} className="text-red-400" />,
                label: 'Errou',
                pts: 0,
                color: 'text-red-400',
                bg: 'bg-red-950/40 border-red-800',
                desc: 'Nenhum dos critérios acima foi satisfeito.',
                example: 'Palpite 0-1 · Resultado 2-0',
              },
            ].map((item) => (
              <div key={item.label} className={`rounded-lg border px-4 py-3 ${item.bg}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className={`text-sm font-semibold ${item.color}`}>{item.label}</span>
                  </div>
                  <span className={`text-lg font-bold ${item.color}`}>+{item.pts} pts</span>
                </div>
                <p className="text-xs text-slate-400">{item.desc}</p>
                <p className="text-xs text-slate-600 mt-0.5 italic">{item.example}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Prorrogação e Pênaltis */}
        <Card>
          <CardHeader className="pt-5 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer size={15} className="text-brand-400" />
              Prorrogação e Pênaltis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-400">
            <p>Nas fases eliminatórias, jogos empatados ao fim dos 90 minutos podem ir a <span className="text-slate-200 font-medium">prorrogação</span> e/ou <span className="text-slate-200 font-medium">pênaltis</span>.</p>
            <p>Os palpites são sempre comparados com o <span className="text-slate-200 font-medium">placar ao fim do tempo regulamentar (90 min)</span>. Gols marcados na prorrogação e o resultado dos pênaltis <span className="text-slate-200 font-medium">não são considerados</span> na pontuação.</p>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 space-y-1.5 text-xs">
              <p className="text-slate-300 font-medium">Exemplos</p>
              <p>Palpite <span className="text-slate-200">1-1</span> · Jogo termina 1-1 nos 90 min e vai a pênaltis → <span className="text-emerald-400 font-semibold">10 pts</span> (placar exato)</p>
              <p>Palpite <span className="text-slate-200">2-1</span> · Jogo termina 1-1 nos 90 min e o time da casa vence nos pênaltis → <span className="text-red-400 font-semibold">0 pts</span> (placar errado)</p>
              <p>Palpite <span className="text-slate-200">0-0</span> · Jogo termina 0-0 nos 90 min (qualquer resultado na prorrogação/pênaltis) → <span className="text-emerald-400 font-semibold">10 pts</span></p>
            </div>
          </CardContent>
        </Card>

        {/* Critérios de desempate */}
        <Card>
          <CardHeader className="pt-5 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ListOrdered size={15} className="text-brand-400" />
              Critérios de Desempate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-slate-400">
              {[
                'Maior número de pontos totais',
                'Maior número de placares exatos (10 pts)',
                'Maior número de resultados certos (5 ou 7 pts)',
                'Menor número de rodadas jogadas (maior média por rodada)',
                'Ordem alfabética do nome',
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">
                    {i + 1}
                  </span>
                  {rule}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Dúvidas */}
        <Card>
          <CardHeader className="pt-5 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HelpCircle size={15} className="text-brand-400" />
              Outras Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-400">
            <p>Os resultados são inseridos manualmente pelo administrador do bolão após o encerramento de cada jogo.</p>
            <p>Caso haja correção de placar, a pontuação é recalculada automaticamente para todos os participantes.</p>
            <p>Rodadas encerradas ficam visíveis na seção <span className="text-slate-200 font-medium">Finalizadas</span> após confirmação dos resultados.</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
