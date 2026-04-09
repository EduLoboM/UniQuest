<script>
  import PlayerCard from './components/PlayerCard.svelte';
</script>

<main class="page">
  <PlayerCard />
</main>

<style>
  .page {
    min-height: 100vh;
    background: #e9f6ed;
    /* removido display flex e centralização */
    padding: 0; /* opcional: remova completamente a margem interna */
  }

  :global(body) {
    margin: 0;
    background: #e9f6ed;
    font-family: Inter, system-ui, sans-serif;
  }
</style>