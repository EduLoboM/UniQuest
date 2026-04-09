<script>
  import { navigate, currentJob, coursesStore } from '../stores.js';
  import staticCourses from '../../skill_courses.json';

  // Initialize coursesStore from static JSON if empty
  if (!$coursesStore) {
    $coursesStore = { ...staticCourses };
  }

  // Computed state for extracting unfulfilled skills and fetching related courses
  $: courses = $coursesStore || staticCourses;
  $: missingSkills = $currentJob.skills
    .filter(s => !s.active)
    .map(s => {
      // Clean string handling
      const nameKey = s.name.trim().toLowerCase();
      
      // We look into the course dictionary (reactive store)
      const recommendations = courses[nameKey] || [];
      
      return {
        name: s.name,
        icon: s.icon || "document.png",
        recommendations
      };
    });

</script>

<div class="quest-container">
  
  <div class="header">
    <div class="title">Missões de Aprimoramento</div>
  </div>

  <div class="board-wrapper">
    <!-- State 1: Sem Vagas Lidas (Não tem nenhuma lista de skills em cache) -->
    {#if $currentJob.skills.length === 0}
      <div class="empty-state">
        <img src="/document.png" alt="Vazio" />
        <p>Inspecione uma vaga no menu Batalha para habilitar missões ativas!</p>
      </div>
      
    <!-- State 2: Possui tudo! Todas skills ativas (nenhuma missingskills na array de dependências) -->
    {:else if missingSkills.length === 0}
      <div class="empty-state success">
        <img src="/medalha.png" alt="Sucesso" />
        <h3>Guilda Completada</h3>
        <p>Você atende a todos os requisitos solicitados. Sucesso garantido na masmorra da Vaga!</p>
      </div>

    <!-- State 3: Recomendação da Missão (Falta Habilidade) -->
    {:else}
      <div class="quests-list">
        {#each missingSkills as skill}
          <div class="quest-card">
            
            <div class="quest-header">
              <div class="quest-icon-wrapper">
                <img src="/{skill.icon}" alt="Habilidade" class="skill-icon" />
              </div>
              <div class="quest-info">
                <h4>Requisito Faltante</h4>
                <h2>Treinamento: {skill.name}</h2>
              </div>
            </div>

            <!-- Mapping the inner courses recommended for this specific missing skill -->
            <div class="quest-actions">
              {#if skill.recommendations.length > 0}
                {#each skill.recommendations as course}
                  <a href={course.url} target="_blank" rel="noopener noreferrer" class="course-btn">
                    ▶ {course.title}
                  </a>
                {/each}
              {:else}
                <div class="empty-course">
                  <span style="opacity:0.6">> Nenhum pergaminho cadastrado para este aprendizado. Procure nas ruínas externas da internet.</span>
                </div>
              {/if}
            </div>
            
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="spacer"></div>
</div>

<div class="fixed-menu">
  <div class="footer-pill">
    <div role="button" tabindex="0" class="icon-btn" on:click={() => navigate('/')} on:keydown={(e) => e.key === 'Enter' && navigate('/')}>
      <img src="/usericon.png" alt="Perfil" />
    </div>
    <div role="button" tabindex="0" class="icon-btn" on:click={() => navigate('/fight')} on:keydown={(e) => e.key === 'Enter' && navigate('/fight')}>
      <img src="/battleicon.png" alt="Batalha" />
    </div>
    <div role="button" tabindex="0" class="icon-btn active" on:click={() => navigate('/quest')} on:keydown={(e) => e.key === 'Enter' && navigate('/quest')}>
      <img src="/questlog.png" alt="Missões" />
    </div>
  </div>
</div>

<style>
  * {
    box-sizing: border-box;
  }

  .quest-container {
    width: 100%;
    min-height: 100vh;
    background: #d4eed7;
    padding: 48px;
    padding-bottom: 120px; 
    font-family: 'JetBrains Mono', monospace;
    color: #0b2f1f;
  }

  .header {
    display: flex;
    margin-bottom: 24px;
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

  .board-wrapper {
    flex-grow: 1;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #eef9ef;
    border: 3px dashed #158425;
    border-radius: 24px;
    padding: 60px 24px;
    text-align: center;
    margin-top: 40px;
  }

  .empty-state img {
    width: 80px;
    height: 80px;
    object-fit: contain;
    margin-bottom: 24px;
    filter: sepia(1) hue-rotate(85deg) saturate(3) brightness(0.7);
  }

  .empty-state p {
    font-size: 1.2rem;
    font-weight: bold;
    margin: 0;
  }

  .empty-state.success {
    border-color: #1ABC67;
    background: #0E540C;
    color: #19E697;
  }

  .empty-state.success img {
    filter: none;
  }

  .empty-state.success h3 {
    margin: 0 0 10px;
    font-size: 1.6rem;
    font-family: 'Space Grotesk', sans-serif;
  }

  .quests-list {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .quest-card {
    background: #eef9ef;
    border-radius: 20px;
    padding: 24px;
    border: 2px solid #158425;
    box-shadow: 0 8px 15px rgba(11, 47, 31, 0.1);
  }

  .quest-header {
    display: flex;
    align-items: center;
    gap: 20px;
    border-bottom: 2px dashed #c8e6d9;
    padding-bottom: 16px;
    margin-bottom: 16px;
  }

  .quest-icon-wrapper {
    width: 64px;
    height: 64px;
    background: #0E540C;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #1ABC67;
  }

  .skill-icon {
    width: 32px;
    height: 32px;
    object-fit: contain;
    filter: invert(1);
  }

  .quest-info h4 {
    margin: 0;
    color: #158425;
    font-size: 0.9rem;
    text-transform: uppercase;
    font-weight: bold;
    letter-spacing: 1px;
  }

  .quest-info h2 {
    margin: 4px 0 0;
    font-family: 'Space Grotesk', sans-serif;
    color: #0E540C;
    font-size: 1.5rem;
  }

  .quest-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .course-btn {
    display: block;
    background: #1ABC67;
    color: #0E540C;
    text-decoration: none;
    padding: 16px 24px;
    border-radius: 12px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: bold;
    font-size: 1.2rem;
    text-align: center;
    transition: all 0.2s;
    border: 2px solid #0E540C;
  }

  .course-btn:hover {
    background: #0E540C;
    color: #1ABC67;
    transform: translateY(-2px);
  }

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

  .icon-btn.active {
    background: #19E697;
    box-shadow: 0 0 15px rgba(25, 230, 151, 0.5);
  }

  .icon-btn.active img, .icon-btn:hover img {
    filter: brightness(0) saturate(100%);
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

  .spacer { height: 20px; }

  @media (max-width: 900px) {
    .quest-container { padding: 24px; padding-bottom: 100px; }
    .header { margin-bottom: 16px; }
  }
</style>
