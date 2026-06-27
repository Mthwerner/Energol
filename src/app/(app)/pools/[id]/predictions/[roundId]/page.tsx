import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getPool, isParticipant } from '@/services/pool.service';
import { getRound } from '@/services/round.service';
import { getUserPredictionsForRound, getRoundParticipantsPredictions } from '@/services/prediction.service';
import { fetchOddsEvents, type OddsEvent } from '@/lib/odds';
import { calculateScore } from '@/domain/scoring';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { RoundStatusBadge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { PredictionsForm } from '../predictions-form';
import { RoundResults } from './round-results';
import { ParticipantsPredictions } from './participants-predictions';
import type { Metadata } from 'next';

interface Props { params: Promise<{ id: string; roundId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roundId } = await params;
  const round = await getRound(roundId);
  return { title: round?.name ?? 'Palpites' };
}

export default async function RoundPredictionsPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id, roundId } = await params;
  const [pool, member, round] = await Promise.all([
    getPool(id),
    isParticipant(session.user.id, id),
    getRound(roundId),
  ]);

  if (!pool || !pool.isActive) notFound();
  if (!member) redirect(`/pools/${id}`);
  if (!round || round.poolId !== id) notFound();

  const isFinished = round.status === 'FINISHED';
  const isPlayable = round.status === 'OPEN' || round.status === 'IN_PROGRESS';
  const finishedGames = round.games.filter((g) => g.status === 'FINISHED' && g.homeScore !== null);

  const [userPredictions, participantsPredictions] = await Promise.all([
    getUserPredictionsForRound(session.user.id, roundId),
    finishedGames.length > 0 ? getRoundParticipantsPredictions(roundId, id) : Promise.resolve([]),
  ]);

  const predMap: Record<string, { homeScore: number; awayScore: number }> = {};
  const pointsMap: Record<string, number | null> = {};
  const basePointsMap: Record<string, number | null> = {};
  for (const p of userPredictions) {
    predMap[p.gameId] = { homeScore: p.homeScore, awayScore: p.awayScore };
    pointsMap[p.gameId] = p.points;
  }
  // Compute base points from game scores (avoids dependency on DB basePoints field)
  for (const game of round.games) {
    const pred = predMap[game.id];
    if (pred && game.homeScore !== null && game.awayScore !== null) {
      basePointsMap[game.id] = calculateScore(pred, { homeScore: game.homeScore, awayScore: game.awayScore }).points;
    }
  }

  // Fetch odds only for open/in-progress rounds
  let oddsEvents: OddsEvent[] = [];
  if (isPlayable) {
    const isWC = round.games.some((g) => g.group);
    const sportKey = isWC ? 'soccer_fifa_world_cup' : 'soccer_brazil_campeonato';
    oddsEvents = await fetchOddsEvents(sportKey);
  }

  return (
    <div>
      <Header
        title={round.name}
        description={pool.name}
        actions={
          <div className="flex items-center gap-2">
            <RoundStatusBadge status={round.status} />
            <Link href={`/pools/${id}/predictions`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft size={14} /> Rodadas
              </Button>
            </Link>
          </div>
        }
      />
      <div className="p-4 md:p-6 space-y-4">
        {isPlayable ? (
          <PredictionsForm
            poolId={id}
            games={round.games}
            initialPredictions={predMap}
            oddsEvents={oddsEvents}
            hasParticipantsBelow={participantsPredictions.length > 0 && finishedGames.length > 0}
          />
        ) : (
          <RoundResults
            games={round.games}
            predictions={predMap}
            predictionPoints={pointsMap}
            basePredictionPoints={basePointsMap}
          />
        )}
        {participantsPredictions.length > 0 && finishedGames.length > 0 && (
          <ParticipantsPredictions
            participants={participantsPredictions}
            games={finishedGames.map((g) => ({
              id: g.id,
              homeTeam: g.homeTeam,
              awayTeam: g.awayTeam,
              homeCrest: g.homeCrest,
              awayCrest: g.awayCrest,
              homeScore: g.homeScore,
              awayScore: g.awayScore,
              status: g.status,
            }))}
            currentUserId={session.user.id}
            isPartial={!isFinished}
          />
        )}
      </div>
    </div>
  );
}
