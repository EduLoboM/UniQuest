<script>
  import PlayerCard from './components/PlayerCard.svelte';
  import FightScreen from './components/FightScreen.svelte';
  import QuestScreen from './components/QuestScreen.svelte';
  import { currentRoute } from './stores.js';
</script>

<main class="page">
  {#if $currentRoute === '/'}
    <PlayerCard />
  {:else if $currentRoute === '/fight'}
    <FightScreen />
  {:else if $currentRoute === '/quest'}
    <QuestScreen />
  {/if}
</main>

<style>
  .page {
    min-height: 100vh;
    background: #d4eed7;
    padding: 0;
  }

  :global(body) {
    margin: 0;
    background: #d4eed7;
    font-family: 'JetBrains Mono', monospace;
  }
</style>