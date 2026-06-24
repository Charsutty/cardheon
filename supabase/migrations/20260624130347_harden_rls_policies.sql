revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;

drop policy if exists "profiles are user-owned" on public.profiles;
create policy "profiles are user-owned"
  on public.profiles for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "player cards are user-owned" on public.player_cards;
create policy "player cards are user-owned"
  on public.player_cards for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "player attempts are user-owned" on public.player_attempts;
create policy "player attempts are user-owned"
  on public.player_attempts for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "player rewards are user-owned" on public.player_rewards;
create policy "player rewards are user-owned"
  on public.player_rewards for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "player constellations are user-owned" on public.player_constellations;
create policy "player constellations are user-owned"
  on public.player_constellations for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "sync events are user-owned" on public.sync_events;
create policy "sync events are user-owned"
  on public.sync_events for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
