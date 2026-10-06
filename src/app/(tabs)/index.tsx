import { router } from 'expo-router';
import { Gift, HandHeart, Megaphone, Phone, Send, Sparkles } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { CampaignCard, OpportunityCard, PrimaryActionCard, SourceCitationCard, TrustBadge } from '@/components/domain';
import { AppHeader, Button, Card, Chip, EmptyState, FadeIn, Row, Screen, SectionTitle, T, ToggleRow, useT, useTheme } from '@/components/ui';
import { PASSAGES } from '@/data/seed';
import { currentPathStep } from '@/lib/derive';
import { matchSevakToRequest, explainMatch, recommendCampaign } from '@/services/matching';
import { useApp, useMe } from '@/store/useApp';

export default function Home() {
  const c = useTheme();
  const t = useT();
  const me = useMe();
  const available = useApp((s) => s.available);
  const setAvailable = useApp((s) => s.setAvailable);
  const requests = useApp((s) => s.requests);
  const campaigns = useApp((s) => s.campaigns);
  const dismissed = useApp((s) => s.dismissed);
  const matches = useApp((s) => s.matches);
  const commitments = useApp((s) => s.commitments);
  const prasad = useApp((s) => s.prasad);
  const app = useApp();
  const step = me ? currentPathStep(app, me.id) : undefined;
  const lang = useApp((s) => s.settings.lang);
  const update = useApp((s) => s.updateSettings);
  const blocked = useApp((s) => s.blocked);

  if (!me) return null;

  const nearRequests = requests
    .filter((r) => r.status === 'open' && !blocked.includes(r.requesterId) && r.visibility !== 'private')
    .map((r) => ({ r, m: matchSevakToRequest(me, r) }))
    .filter((x) => x.m.eligible)
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, 2);
  const nearCampaign = campaigns
    .map((cp) => ({ cp, rec: recommendCampaign(me, cp, dismissed) }))
    .filter((x) => x.rec)
    .sort((a, b) => (b.rec?.score ?? 0) - (a.rec?.score ?? 0))[0];
  const myMatches = matches.filter((m) => (m.sevakId === me.id || m.sahabhagiId === me.id) && m.status !== 'cancelled' && m.status !== 'completed');
  const myCommit = commitments.filter((x) => x.personId === me.id && !x.done).slice(0, 2);
  const unreadPrasad = prasad.filter((p) => p.toId === me.id && !p.opened).length;
  const quote = PASSAGES.find((p) => p.id === 'ps-3')!;
  const icon = { size: 28, color: c.indigo };

  return (
    <Screen
      header={<AppHeader back={false} bell title={`${t('home.greeting')}, ${me.displayName}`} subtitle={t('home.tagline')}
        right={<Chip label={lang === 'en' ? 'हिन्दी' : 'English'} onPress={() => update({ lang: lang === 'en' ? 'hi' : 'en' })} />} />}
    >
      <FadeIn>
        <Card>
          <ToggleRow label={t('home.available')} detail={available ? 'People may suggest you for help. Rest whenever you need.' : 'You are resting. Nobody is notified.'} value={available} onChange={setAvailable} />
        </Card>
      </FadeIn>

      <SourceCitationCard p={quote} />

      <View style={{ gap: 12 }}>
        <Row gap={12}>
          <PrimaryActionCard icon={<HandHeart {...icon} />} title={t('home.request')} onPress={() => router.push('/sathi/new')} />
          <PrimaryActionCard icon={<Send {...icon} />} title={t('home.offer')} onPress={() => router.push('/sathi')} />
        </Row>
        <Row gap={12}>
          <PrimaryActionCard icon={<Megaphone {...icon} />} title={t('home.join')} onPress={() => router.push('/abhiyan')} />
          <PrimaryActionCard icon={<Gift {...icon} />} title={t('home.share')} onPress={() => router.push('/daan/new')} />
        </Row>
      </View>

      {unreadPrasad > 0 && (
        <Card tone="saffron" onPress={() => router.push('/prasad')} label="You have a private Prasad message">
          <T v="h3">A private Prasad has arrived</T>
          <T v="small" color="ink">A message from a past act of service. Open it whenever you are ready.</T>
        </Card>
      )}

      {myMatches.length > 0 && (
        <>
          <SectionTitle>Upcoming meetings</SectionTitle>
          {myMatches.map((m) => {
            const req = requests.find((r) => r.id === m.requestId);
            return (
              <Card key={m.id} onPress={() => router.push(`/sathi/room/${m.id}`)} label={`Open match room for ${req?.title}`}>
                <T v="h3">{req?.title}</T>
                <T v="small">{m.plan.when} · {m.plan.place}</T>
              </Card>
            );
          })}
        </>
      )}

      <SectionTitle action={{ label: 'See all', onPress: () => router.push('/sathi') }}>{t('home.near')}</SectionTitle>
      {nearRequests.length === 0 && !nearCampaign && <EmptyState title="Nothing nearby right now" body="Check back later, or ask Seva Guide for ideas." />}
      {nearRequests.map(({ r, m }) => (
        <OpportunityCard key={r.id} title={r.title} meta={`${r.mode === 'remote' ? 'Remote' : `${r.distanceKm.toFixed(1)} km`} · ${r.minutes} min · ${r.language}`} why={explainMatch(m.reasons)}
          badges={<TrustBadge label={r.risk === 'low' ? 'Low risk' : 'Medium risk'} tone={r.risk === 'low' ? 'green' : 'saffron'} />} onPress={() => router.push(`/sathi/${r.id}`)} />
      ))}
      {nearCampaign && <CampaignCard c={nearCampaign.cp} why={`Recommended because ${nearCampaign.rec?.reasons.join(' and ') || 'it is open to everyone'}.`} onPress={() => router.push(`/abhiyan/${nearCampaign.cp.id}`)} />}

      <SectionTitle>{t('home.continue')}</SectionTitle>
      {myCommit.length === 0 ? <T v="small">No open commitments. That is perfectly fine.</T> : myCommit.map((x) => (
        <Card key={x.id}><T>{x.text}</T></Card>
      ))}
      <Button label="Open Seva Journal" kind="secondary" onPress={() => router.push('/journal')} />

      {step && (
        <Card tone="indigo" onPress={() => router.push('/path')} label={`Suggested Seva Path step: ${step.title}`}>
          <Row><Sparkles size={20} color={c.indigo} /><T v="label" color="indigo">SUGGESTED NEXT STEP ON YOUR SEVA PATH</T></Row>
          <T v="h3">{step.title}</T>
          <T v="small" color="ink">{step.blurb}</T>
        </Card>
      )}

      <SectionTitle>{t('home.safety')}</SectionTitle>
      <Card tone="green" onPress={() => router.push('/safety')} label="Open safety resources">
        <Row><Phone size={20} color={c.green} /><T v="h3">Safety centre</T></Row>
        <T v="small" color="ink">Report a concern, set a trusted contact, read the Code of Conduct, or find helplines.</T>
      </Card>
    </Screen>
  );
}
