<script>
  import { onMount } from "svelte";
  import { navigate, playerSkills, playerProfile } from "../stores.js";
  import skillData from "../../skill_registry.json";
  import html2canvas from "html2canvas";

  let fileInput;
  let cardElement;
  let skillSearch = "";

  async function exportCard() {
    try {
      // Cria um card dedicado off-screen para exportação premium
      const exportDiv = document.createElement('div');
      exportDiv.style.cssText = `
        position: fixed; left: -9999px; top: 0;
        width: 900px; padding: 48px;
        background: #d4eed7;
        font-family: 'Space Grotesk', 'JetBrains Mono', sans-serif;
        color: #0b2f1f; border-radius: 32px;
        border: 4px solid #158425;
      `;

      const selectedSkills = $playerSkills.filter(s => s.selected);
      const totalSkills = $playerSkills.length;
      const xpVal = selectedSkills.length;
      const pct = totalSkills > 0 ? Math.round((xpVal / totalSkills) * 100) : 0;

      const skillChips = selectedSkills.slice(0, 5).map(s =>
        `<span style="
          display: inline-block; padding: 10px 18px; margin: 5px;
          background: #0e540c; border: 2px solid #1abc67;
          border-radius: 12px; font-size: 16px; font-weight: 600;
          color: #ffffff; font-family: 'JetBrains Mono', monospace;
        ">${s.name}</span>`
      ).join('');

      const extraCount = selectedSkills.length > 5 ? selectedSkills.length - 5 : 0;

      const avatarSrc = $playerProfile.avatar || '/perfil.png';

      exportDiv.innerHTML = `
        <div style="display: flex; gap: 36px; align-items: stretch;">
          <!-- Coluna Esquerda: Avatar -->
          <div style="flex-shrink: 0; width: 240px;">
            <div style="
              width: 240px; height: 300px; border-radius: 20px; overflow: hidden;
              border: 4px solid #158425; box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            ">
              <img src="${avatarSrc}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div style="
              margin-top: 16px; text-align: center; background: #eef9ef;
              border: 2px solid #158425; border-radius: 12px; padding: 12px;
            ">
              <div style="font-size: 13px; color: #158425; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Classe</div>
              <div style="font-size: 18px; font-weight: bold; color: #0e540c; margin-top: 4px;">
                ${$playerProfile.jobClass || 'Sem Classe'}
              </div>
            </div>
          </div>

          <!-- Coluna Direita: Info -->
          <div style="flex: 1; display: flex; flex-direction: column; gap: 20px;">
            <!-- Nome + Subtítulo -->
            <div style="
              background: #0e540c; border-radius: 16px; padding: 20px 28px;
              border: 3px solid #1abc67;
            ">
              <div style="font-size: 36px; font-weight: 800; color: #ffffff; line-height: 1.1;">
                ${$playerProfile.name || 'Aventureiro'}
              </div>
              ${$playerProfile.description ? `
                <div style="font-size: 14px; color: rgba(255,255,255,0.65); margin-top: 8px; font-family: 'JetBrains Mono', monospace; line-height: 1.5;">
                  ${$playerProfile.description}
                </div>
              ` : ''}
            </div>

            <!-- XP Bar -->
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="flex: 1; height: 28px; background: #ffffff; border-radius: 14px; border: 2px solid #158425; padding: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${pct}%; background: #1abc67; border-radius: 12px; box-shadow: 0 0 8px #19e697;"></div>
              </div>
              <span style="font-size: 22px; font-weight: 800; color: #0e540c; font-family: 'Space Mono', monospace;">${xpVal}/${totalSkills}</span>
              <span style="font-size: 14px; color: #5a8f6c;">(${pct}%)</span>
            </div>

            <!-- Skills Ativas (max 5) -->
            <div style="
              background: #eef9ef; border-radius: 20px; padding: 20px;
              border: 2px solid #158425;
            ">
              <div style="font-size: 13px; color: #158425; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 12px;">
                ⚔ Skills Ativas (${xpVal})
              </div>
              <div style="line-height: 2.2;">
                ${skillChips || '<span style="color: #5a8f6c; font-style: italic;">Nenhuma skill ativa</span>'}
                ${extraCount > 0 ? `<span style="color: #5a8f6c; font-size: 14px; margin-left: 8px;">+${extraCount} mais</span>` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="
          margin-top: 28px; padding-top: 20px; border-top: 3px solid #158425;
          display: flex; justify-content: space-between; align-items: center;
        ">
          <div style="font-size: 20px; font-weight: 800; color: #0e540c; letter-spacing: 1px;">UniQuest</div>
          <div style="font-size: 13px; color: #5a8f6c; font-family: 'JetBrains Mono', monospace;">${new Date().toLocaleDateString('pt-BR')}</div>
        </div>
      `;

      document.body.appendChild(exportDiv);

      const canvas = await html2canvas(exportDiv, {
        backgroundColor: '#d4eed7',
        scale: 2,
        useCORS: true,
        logging: false
      });

      document.body.removeChild(exportDiv);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `uniquest_${($playerProfile.name || 'card').replace(/\s+/g, '_').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Falha ao exportar imagem:', err);
    }
  }

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        $playerProfile.avatar = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  function triggerUpload() {
    fileInput.click();
  }

  // ── Cargos Multi-Área ──────────────────────────────────────────────
  const rolesByArea = {
    "TI": [
      "Desenvolvedor Front-end", "Desenvolvedor Back-end", "DevOps",
      "UI/UX Designer", "Gerente de Projetos TI", "QA / Tester",
      "Analista de Dados", "Engenheiro de Software", "DBA",
      "Engenheiro de Machine Learning", "Cientista de Dados",
      "Arquiteto de Soluções", "SRE / Cloud Engineer"
    ],
    "Artes": [
      "Concept Artist", "Ilustrador Digital", "Animator 2D/3D",
      "UI Artist", "Character Designer", "Diretor de Arte",
      "Motion Designer", "Modelador 3D"
    ],
    "Psicologia": [
      "Psicólogo Clínico", "Psicólogo Organizacional",
      "Neuropsicólogo", "Psicólogo Escolar",
      "Psicanalista", "Terapeuta Cognitivo-Comportamental"
    ],
    "Saúde": [
      "Enfermeiro(a)", "Fisioterapeuta", "Nutricionista",
      "Fonoaudiólogo(a)", "Terapeuta Ocupacional"
    ],
    "Direito": [
      "Advogado Cível", "Advogado Trabalhista",
      "Advogado Tributarista", "Paralegal", "Mediador"
    ],
    "Engenharia": [
      "Engenheiro Civil", "Engenheiro Mecânico",
      "Engenheiro Elétrico", "Engenheiro de Produção",
      "Engenheiro Ambiental"
    ],
    "Educação": [
      "Professor(a)", "Pedagogo(a)", "Coordenador Pedagógico",
      "Instrutor de Cursos", "Tutor EAD"
    ]
  };

  // Mapeamento de ícones por área (cicla os 3 ícones disponíveis)
  const areaIconMap = {
    "TI": "magoclasse.png",
    "Artes": "archerclasse.png",
    "Psicologia": "bardoclasse.png",
    "Saúde": "bardoclasse.png",
    "Direito": "magoclasse.png",
    "Engenharia": "archerclasse.png",
    "Educação": "bardoclasse.png",
  };

  // Determina a área do cargo selecionado
  function getAreaForRole(role) {
    for (const [area, roles] of Object.entries(rolesByArea)) {
      if (roles.includes(role)) return area;
    }
    return null;
  }

  // Ícone dinâmico baseado na área do cargo
  $: currentArea = getAreaForRole($playerProfile.jobClass);
  $: classIcon = currentArea
    ? areaIconMap[currentArea] || "espadaclasse.png"
    : "espadaclasse.png";

  // Lista de habilidades global
  $: if ($playerSkills.length === 0) {
    const allSkills = Array.from(new Set(Object.values(skillData).flat()));
    const skillIcons = ["bug.png", "pc.png", "distintivo.png", "document.png"];
    $playerSkills = allSkills.map((name, i) => ({
      name,
      selected: false,
      icon: skillIcons[i % skillIcons.length]
    }));
  }

  // ── Filtro de busca ────────────────────────────────────────────────
  $: filteredSkills = skillSearch.trim()
    ? $playerSkills
        .map((s, i) => ({...s, originalIndex: i}))
        .filter(s => s.name.toLowerCase().includes(skillSearch.toLowerCase()))
    : $playerSkills.map((s, i) => ({...s, originalIndex: i}));

  $: xp = $playerSkills.filter(s => s.selected).length;
  $: xpPercent = $playerSkills.length > 0 ? (xp / $playerSkills.length) * 100 : 0;

  function toggleSkill(originalIndex) {
    $playerSkills[originalIndex].selected = !$playerSkills[originalIndex].selected;
  }

  onMount(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@500;700&family=Space+Mono:wght@400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  });
</script>

<div class="container" bind:this={cardElement}>
  <div class="left">
    <!-- Foto de perfil com upload -->
    <div class="image-container" on:click={triggerUpload}>
      <img src={$playerProfile.avatar} alt="Personagem" class="character-img" />
      <div class="upload-overlay">Trocar Foto</div>
    </div>
    <input type="file" bind:this={fileInput} accept="image/*" style="display: none;" on:change={handleImageUpload} />
    <!-- Ícone da classe que muda dinamicamente -->
    <div class="overlay-icon">
      <img src="/{classIcon}" alt="Classe" />
    </div>
  </div>

  <div class="right">
    <div class="header">
      <input
        type="text"
        class="player-name-input"
        bind:value={$playerProfile.name}
        placeholder="Seu nome"
      />

      <div class="xp-container">
        <!-- O botão silencioso fica aqui (ao lado do status) -->
        <button class="export-btn" on:click={exportCard} title="Exportar Ficha (GitHub README)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>

        <div class="bar">
          <div class="bar-fill" style="width: {xpPercent}%"></div>
        </div>
        <img src="/medalha.png" alt="Medalha" class="medal-icon" />
        <div class="xp">{xp}</div>
      </div>
    </div>

    <select
      bind:value={$playerProfile.jobClass}
      class={$playerProfile.jobClass === "" ? "placeholder-active" : ""}
    >
      <option value="" disabled selected>[Selecione seu Cargo]</option>
      {#each Object.entries(rolesByArea) as [area, roles]}
        <optgroup label="⚔ {area}">
          {#each roles as role}
            <option value={role}>{role}</option>
          {/each}
        </optgroup>
      {/each}
    </select>

    <textarea placeholder="[Descrição do Jogador]" bind:value={$playerProfile.description}
    ></textarea>

    <!-- Barra de busca de skills -->
    <div class="search-wrapper">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        type="text"
        class="skill-search"
        placeholder="Buscar habilidade..."
        bind:value={skillSearch}
      />
      {#if skillSearch}
        <button class="clear-search" on:click={() => skillSearch = ""}>✕</button>
      {/if}
    </div>

    <!-- Habilidades com scroll -->
    <div class="skills-scrollable">
      {#each filteredSkills as skill}
        <div
          class="skill-item"
          class:selected={skill.selected}
          on:click={() => toggleSkill(skill.originalIndex)}
        >
          <img src="/{skill.icon}" alt="" class="skill-icon" />
          <span>{skill.name}</span>
        </div>
      {/each}
      {#if filteredSkills.length === 0 && skillSearch}
        <div class="no-results">Nenhuma habilidade encontrada</div>
      {/if}
    </div>

    <div class="footer-spacer"></div>
  </div>
</div>

<!-- Menu fixo com imagens -->
<div class="fixed-menu">
  <div class="footer-pill">
    <!-- Ícone esquerdo: vai para PlayerCard (home) -->
    <div class="icon-btn" on:click={() => navigate("/")}>
      <img src="/usericon.png" alt="Perfil" />
    </div>
    <!-- Ícone do meio: vai para FightScreen -->
    <div class="icon-btn" on:click={() => navigate("/fight")}>
      <img src="/battleicon.png" alt="Batalha" />
    </div>
    <!-- Ícone direito: vai para QuestLog -->
    <div role="button" tabindex="0" class="icon-btn" on:click={() => navigate("/quest")} on:keydown={(e) => e.key === 'Enter' && navigate('/quest')}>
      <img src="/questlog.png" alt="Missões" />
    </div>
  </div>
</div>

<style>
  * {
    box-sizing: border-box;
  }

  .container {
    width: 100%;
    min-height: 100vh;
    background: #d4eed7;
    padding: 48px;
    display: flex;
    gap: 40px;
    font-family: "JetBrains Mono", monospace;
    font-size: 1.2rem;
    margin: 0;
    color: #0b2f1f;
  }

  /* ESQUERDA */
  .left {
    width: 40%;
    position: relative;
    display: flex;
  }

  .image-container {
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
    border-radius: 20px;
    overflow: hidden;
    border: 3px solid #158425;
  }

  .character-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: filter 0.3s;
  }

  .upload-overlay {
    position: absolute;
    inset: 0;
    background: rgba(14, 84, 12, 0.7);
    color: #1abc67;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    font-family: "Space Grotesk", sans-serif;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .image-container:hover .character-img {
    filter: brightness(0.6) blur(2px);
  }

  .image-container:hover .upload-overlay {
    opacity: 1;
  }

  .overlay-icon {
    position: absolute;
    bottom: -30px;
    left: -30px;
    width: 120px;
    height: 120px;
    background: #0e540c;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 6px solid #d4eed7;
    padding: 10px;
  }

  .overlay-icon img {
    width: 80%;
    height: 80%;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }

  /* DIREITA */
  .right {
    width: 60%;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .player-name-input {
    background: #0e540c;
    color: #ffffff;
    padding: 16px 28px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 1.8rem;
    font-family: "Space Grotesk", sans-serif;
    border: 3px solid #1abc67;
    outline: none;
    width: auto;
    min-width: 250px;
    transition: all 0.2s;
  }

  .player-name-input:focus {
    border-color: #1abc67;
    box-shadow: 0 0 0 3px rgba(21, 132, 37, 0.2);
  }

  .player-name-input::placeholder {
    color: #5a8f6c;
    opacity: 0.7;
  }

  .xp-container {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .export-btn {
    background: transparent;
    border: none;
    color: #158425;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .export-btn:hover {
    background: rgba(21, 132, 37, 0.1);
    color: #0e540c;
    transform: translateY(-2px);
  }

  .bar {
    width: 180px;
    height: 28px;
    background: #ffffff;
    border: 2px solid #158425;
    border-radius: 20px;
    padding: 3px;
  }

  .bar-fill {
    height: 100%;
    background: #1abc67;
    border-radius: 15px;
    box-shadow: 0 0 8px #19e697;
  }

  .medal-icon {
    width: 36px;
    height: 36px;
    object-fit: contain;
  }

  .xp {
    font-weight: bold;
    font-size: 1.8rem;
    color: #0e540c;
    font-family: "Space Mono", monospace;
  }

  /* Select e Textarea */
  select,
  textarea {
    width: 100%;
    padding: 20px;
    border-radius: 20px;
    border: 2px solid #158425;
    background: #eef9ef;
    font-family: "JetBrains Mono", monospace;
    color: #0b2f1f;
    font-size: 1.2rem;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);
  }

  select {
    appearance: none;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23158425%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: right 20px top 50%;
    background-size: 16px auto;
    cursor: pointer;
  }

  /* Estilo do optgroup */
  select optgroup {
    font-weight: bold;
    color: #0e540c;
    font-family: "Space Grotesk", sans-serif;
    padding: 8px 0;
  }

  select option {
    font-weight: normal;
    padding: 6px 12px;
  }

  textarea {
    flex-grow: 1;
    resize: none;
    min-height: 140px;
  }

  textarea::placeholder,
  .placeholder-active {
    color: #5a8f6c;
  }

  /* ── Barra de busca ─────────────────────────────────────── */
  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 18px;
    color: #158425;
    pointer-events: none;
  }

  .skill-search {
    width: 100%;
    padding: 14px 44px 14px 48px;
    border-radius: 16px;
    border: 2px solid #158425;
    background: #eef9ef;
    font-family: "JetBrains Mono", monospace;
    color: #0b2f1f;
    font-size: 1.1rem;
    outline: none;
    transition: all 0.2s;
  }

  .skill-search:focus {
    border-color: #1abc67;
    box-shadow: 0 0 0 3px rgba(26, 188, 103, 0.15);
    background: #ffffff;
  }

  .skill-search::placeholder {
    color: #5a8f6c;
    opacity: 0.7;
  }

  .clear-search {
    position: absolute;
    right: 14px;
    background: rgba(21, 132, 37, 0.15);
    border: none;
    color: #0e540c;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .clear-search:hover {
    background: #1abc67;
    color: #fff;
  }

  .no-results {
    text-align: center;
    padding: 20px;
    color: #5a8f6c;
    font-style: italic;
    font-size: 1rem;
  }

  /* Habilidades com scroll */
  .skills-scrollable {
    max-height: 220px;
    overflow-y: auto;
    padding-right: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #eef9ef;
    border-radius: 20px;
    padding: 18px;
    border: 2px solid #158425;
    scrollbar-width: thin;
    scrollbar-color: #1abc67 #c8e6d9;
  }

  .skills-scrollable::-webkit-scrollbar {
    width: 8px;
  }

  .skills-scrollable::-webkit-scrollbar-track {
    background: #c8e6d9;
    border-radius: 10px;
  }

  .skills-scrollable::-webkit-scrollbar-thumb {
    background: #1abc67;
    border-radius: 10px;
  }

  .skill-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: #ffffff;
    border-radius: 14px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.15s;
    font-family: "JetBrains Mono", monospace;
    font-size: 1.1rem;
    color: #0b2f1f;
  }

  .skill-item:hover {
    background: #d4eed7;
    border-color: #158425;
  }

  .skill-item.selected {
    background: #0e540c;
    border-color: #1abc67;
    color: #ffffff;
    font-weight: bold;
    box-shadow: 0 0 8px #158425;
  }

  .skill-icon {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  /* Espaçador */
  .footer-spacer {
    height: 100px;
  }

  /* Menu fixo */
  .fixed-menu {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.2));
  }

  .footer-pill {
    background: #0e540c;
    border-radius: 60px;
    display: flex;
    gap: 24px;
    padding: 18px 40px;
    border: 3px solid #1abc67;
    backdrop-filter: blur(4px);
  }

  .icon-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #14250b;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #19e697;
    cursor: pointer;
    transition:
      transform 0.1s,
      background 0.2s;
    padding: 8px;
  }

  .icon-btn:hover {
    background: #1abc67;
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
    .container {
      flex-direction: column;
      padding: 24px;
    }
    .left,
    .right {
      width: 100%;
    }
    .character-img {
      max-height: 400px;
    }
    .overlay-icon {
      width: 90px;
      height: 90px;
    }
    .player-name-input {
      font-size: 1.4rem;
      padding: 12px 16px;
      min-width: 180px;
    }
    .fixed-menu {
      bottom: 20px;
    }
    .footer-pill {
      padding: 12px 24px;
    }
  }
</style>
