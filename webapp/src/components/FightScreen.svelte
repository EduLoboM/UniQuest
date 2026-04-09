<script>
  import { navigate, playerSkills, currentJob } from '../stores.js';
  import SupremeSkillEngine from '../../LexerParser.js';
  import skillData from '../../skill_registry.json';

  let showModal = false;
  let jobText = "";

  const engine = new SupremeSkillEngine(skillData);

  if (!$currentJob.skills) {
    $currentJob.skills = [];
  }

  // Alternar descrição completa
  let showFullDescription = false;

  function parseJob() {
    if (!jobText.trim()) return;
    
    // Parse the text through LexerParser
    const result = engine.parseVaga(jobText, 'Outros'); 
    
    // Replace skills
    $currentJob.skills = Object.entries(result).map(([key, weight]) => {
       const originalSkill = $playerSkills.find(s => s.name.toLowerCase() === key);
       const active = originalSkill ? originalSkill.selected : false;
       const name = originalSkill ? originalSkill.name : key.toUpperCase();
       
       return {
         name,
         icon: originalSkill ? originalSkill.icon : "document.png",
         value: Math.min(Math.max(weight, 5), 100),
         active
       };
    }).sort((a,b) => b.value - a.value);

    // Update job description
    $currentJob.title = "Vaga Inspecionada";
    $currentJob.description = jobText; // Guarda TODO o texto em vez de fatiar
    
    showModal = false;
    jobText = "";
  }
</script>

{#if showModal}
<div class="modal-overlay">
  <div class="modal-content">
    <h2>Colar Descrição da Vaga</h2>
    <textarea bind:value={jobText} placeholder="Cole aqui a vaga copiada..."></textarea>
    <div class="modal-actions">
      <button class="close-btn" on:click={() => showModal = false}>Voltar</button>
      <button class="parse-btn" on:click={parseJob}>LexerParser( )</button>
    </div>
  </div>
</div>
{/if}

<div class="fight-container">
  <!-- HEADER -->
  <div class="header">
    <div class="title">{$currentJob.title}</div>
    <button class="add-job-btn" on:click={() => showModal = true}>+</button>
  </div>

  <!-- SUB HEADER -->
  <div class="sub-header">
    <div class="tag">Status</div>
    <div class="description-wrapper">
      
      <!-- Base (mantém o grid da página seguro) -->
      <div class="description" on:click={() => showFullDescription = true}>
        <div class="short-text">
          { ($currentJob.description || "").length > 40 
              ? $currentJob.description.substring(0, 40) + '...' 
              : $currentJob.description 
          }
        </div>
        <span class="plus">+</span>
      </div>

      <!-- Overlay Absoluto -->
      {#if showFullDescription}
        <div class="description expanded" on:click={() => showFullDescription = false}>
          <div class="full-text">{$currentJob.description}</div>
          <span class="plus">−</span>
        </div>
      {/if}

    </div>
  </div>

  <!-- SKILLS -->
  <div class="skills-box">
    {#each $currentJob.skills as skill}
      <div class="skill">
        <div class="skill-header">
          <img src="/{skill.icon}" alt="" class="icon" />
          <span class="name">{skill.name}</span>
          {#if skill.active}
            <span class="status success">✔</span>
          {:else}
            <span class="status fail">✖</span>
          {/if}
        </div>
        <div class="bar">
          <div class="fill" style="width: {skill.value}%"></div>
        </div>
      </div>
    {/each}
  </div>

  <!-- BATTLE -->
  <div class="battle">
    <img src="/battle.gif" alt="battle scene" />
  </div>

  <!-- Espaçador para menu fixo -->
  <div class="spacer"></div>
</div>

<!-- Menu fixo igual ao PlayerCard -->
<div class="fixed-menu">
  <div class="footer-pill">
    <div class="icon-btn" on:click={() => navigate('/')}>
      <img src="/usericon.png" alt="Perfil" />
    </div>
    <div class="icon-btn" on:click={() => navigate('/fight')}>
      <img src="/battleicon.png" alt="Batalha" />
    </div>
    <div class="icon-btn">
      <img src="/questlog.png" alt="Missões" />
    </div>
  </div>
</div>

<style>
  * {
    box-sizing: border-box;
  }

  .fight-container {
    width: 100%;
    min-height: 100vh;
    background: #d4eed7;
    padding: 48px;
    padding-bottom: 120px; /* espaço extra para menu fixo */
    font-family: 'JetBrains Mono', monospace;
    color: #0b2f1f;
  }

  /* HEADER */
  .header {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
  }

  .title {
    flex: 1;
    background: #0E540C;
    color: #19E697;
    text-align: center;
    padding: 20px 16px;
    border-radius: 20px;
    font-size: 1.8rem;
    font-weight: bold;
    font-family: 'Space Grotesk', sans-serif;
    border: 3px solid #1ABC67;
    box-shadow: 0 4px 0 #0b2f1f;
  }

  .add-job-btn {
    background: #0E540C;
    color: #19E697;
    text-align: center;
    padding: 0 24px;
    border-radius: 20px;
    font-size: 2rem;
    font-weight: bold;
    font-family: 'Space Grotesk', sans-serif;
    border: 3px solid #1ABC67;
    box-shadow: 0 4px 0 #0b2f1f;
    cursor: pointer;
    transition: transform 0.1s, background 0.2s;
  }

  .add-job-btn:hover {
    background: #1ABC67;
    color: #0E540C;
    border-color: #0E540C;
  }

  .add-job-btn:active {
    transform: translateY(4px);
    box-shadow: 0 0 0 #0b2f1f;
  }

  /* MODAL */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(212, 238, 215, 0.4);
    backdrop-filter: blur(16px) contrast(1.2); 
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .modal-content {
    background: #0E540C;
    padding: 32px;
    border-radius: 24px;
    border: 3px solid #1ABC67;
    width: 85%;
    max-width: 700px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
  }

  .modal-content h2 {
    color: #19E697;
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
  }

  .modal-content textarea {
    width: 100%;
    min-height: 250px;
    background: #eef9ef;
    color: #0b2f1f;
    padding: 20px;
    border-radius: 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.1rem;
    border: 2px solid #158425;
    resize: vertical;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
  }

  .modal-actions button {
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: bold;
    font-size: 1.2rem;
    cursor: pointer;
    font-family: 'Space Grotesk', sans-serif;
    transition: all 0.2s;
  }

  .close-btn {
    background: transparent;
    color: #19E697;
    border: 2px solid #19E697;
  }

  .close-btn:hover {
    background: rgba(25, 230, 151, 0.2);
  }

  .parse-btn {
    background: #1ABC67;
    color: #0E540C;
    border: 2px solid #1ABC67;
  }

  .parse-btn:hover {
    filter: brightness(1.2);
  }

  /* SUB HEADER */
  .sub-header {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
  }

  .tag {
    background: #eef9ef;
    padding: 14px 24px;
    border-radius: 20px;
    border: 2px solid #158425;
    font-weight: bold;
    font-size: 1.3rem;
    color: #0E540C;
    display: flex;
    align-items: center;
  }

  .description-wrapper {
    flex: 1;
    position: relative;
    /* não precisa de flex aqui para que as divs absolutas fiquem bem atreladas a esse bloco principal */
  }

  .description {
    width: 100%;
    background: #eef9ef;
    padding: 14px 24px;
    border-radius: 20px;
    border: 2px solid #158425;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .description.expanded {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    max-height: 60vh;
    overflow-y: auto;
  }

  .description:hover {
    background: #c8e6d9;
  }

  .full-text {
    white-space: pre-wrap;
    word-break: break-word;
    flex: 1;
    margin-right: 12px;
  }

  .plus {
    font-weight: bold;
    font-size: 1.8rem;
    color: #0E540C;
    margin-left: auto;
  }

  /* SKILLS */
  .skills-box {
    background: #eef9ef;
    padding: 24px;
    border-radius: 24px;
    border: 2px solid #158425;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-height: 300px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #1ABC67 #c8e6d9;
    margin-bottom: 24px;
  }

  .skills-box::-webkit-scrollbar {
    width: 8px;
  }

  .skills-box::-webkit-scrollbar-track {
    background: #c8e6d9;
    border-radius: 10px;
  }

  .skills-box::-webkit-scrollbar-thumb {
    background: #1ABC67;
    border-radius: 10px;
  }

  .skill {
    font-size: 1rem;
  }

  .skill-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  .name {
    font-weight: bold;
    color: #0b2f1f;
  }

  .status {
    margin-left: auto;
    font-size: 1.2rem;
  }

  .success {
    color: #158425;
  }

  .fail {
    color: #b00020;
  }

  .bar {
    height: 10px;
    background: #c8e6d9;
    border-radius: 10px;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: #1ABC67;
    border-radius: 10px;
    box-shadow: 0 0 6px #19E697;
  }

  /* BATTLE */
  .battle {
    border-radius: 24px;
    overflow: hidden;
    border: 3px solid #158425;
    background: #0E540C;
  }

  .battle img {
    width: 100%;
    display: block;
    object-fit: cover;
    max-height: 300px;
  }

  /* Espaçador */
  .spacer {
    height: 20px;
  }

  /* Menu fixo (idêntico ao PlayerCard) */
  .fixed-menu {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    filter: drop-shadow(0 8px 20px rgba(0,0,0,0.2));
  }

  .footer-pill {
    background: #0E540C;
    border-radius: 60px;
    display: flex;
    gap: 24px;
    padding: 18px 40px;
    border: 3px solid #1ABC67;
    backdrop-filter: blur(4px);
  }

  .icon-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #14250B;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #19E697;
    cursor: pointer;
    transition: transform 0.1s, background 0.2s;
    padding: 8px;
  }

  .icon-btn:hover {
    background: #1ABC67;
    transform: scale(1.1);
  }

  .icon-btn img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }

  /* Responsividade */
  @media (max-width: 900px) {
    .fight-container {
      padding: 24px;
      padding-bottom: 100px;
    }
    .header {
      flex-direction: column;
      gap: 12px;
    }
    .skills-box {
      grid-template-columns: repeat(2, 1fr);
    }
    .title {
      font-size: 1.4rem;
      padding: 14px;
    }
  }
</style>