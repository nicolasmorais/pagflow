export default function DermavitPage() {
    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --verde: #2A6048;
    --verde-claro: #EAF2EC;
    --ameixa: #7A3F62;
    --ameixa-claro: #F5EDF2;
    --texto: #1C1C1C;
    --texto-suave: #555;
    --borda: #D8D8D0;
    --fundo: #F8F7F4;
    --branco: #FFFFFF;
    --dourado: #B8904A;
  }

  .landing-body {
    font-family: 'Lato', sans-serif;
    background: var(--fundo);
    color: var(--texto);
    font-size: 17px;
    line-height: 1.75;
  }

  .topbar {
    background: var(--verde);
    color: white;
    text-align: center;
    font-size: 12px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 8px 16px;
  }

  .landing-header {
    background: var(--branco);
    border-bottom: 1px solid var(--borda);
    padding: 16px 20px;
    text-align: center;
  }

  .logo {
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--verde);
    letter-spacing: 0.5px;
  }

  .logo span { color: var(--ameixa); }

  .logo-tagline {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--texto-suave);
    margin-top: 2px;
  }

  .landing-nav {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 12px;
    font-size: 12px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--texto-suave);
    flex-wrap: wrap;
  }

  .landing-nav span { cursor: pointer; }
  .landing-nav .active { color: var(--verde); font-weight: 700; border-bottom: 2px solid var(--verde); padding-bottom: 2px; }

  .breadcrumb {
    max-width: 760px;
    margin: 14px auto 0;
    padding: 0 20px;
    font-size: 12px;
    color: var(--texto-suave);
  }

  .breadcrumb span { color: var(--verde); }

  .article-wrapper {
    max-width: 760px;
    margin: 0 auto;
    padding: 0 20px 60px;
  }

  .meta-topo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 24px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .tag-cat {
    background: var(--verde);
    color: white;
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 2px;
  }

  .tag-cat.ameixa { background: var(--ameixa); }

  .meta-data {
    font-size: 12px;
    color: var(--texto-suave);
  }

  h1.article-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(24px, 5vw, 38px);
    font-weight: 700;
    line-height: 1.25;
    color: var(--texto);
    margin-bottom: 14px;
  }

  .deck {
    font-size: 18px;
    color: #444;
    font-style: italic;
    line-height: 1.55;
    border-left: 3px solid var(--dourado);
    padding-left: 16px;
    margin-bottom: 20px;
  }

  .byline-box {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--branco);
    border: 1px solid var(--borda);
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 24px;
  }

  .avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--verde-claro);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--verde);
    flex-shrink: 0;
  }

  .byline-info { font-size: 13px; }
  .byline-info strong { display: block; color: var(--texto); }
  .byline-info span { color: var(--texto-suave); }

  .views-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--texto-suave);
    margin-left: auto;
    flex-shrink: 0;
  }

  .divisor {
    height: 1px;
    background: var(--borda);
    margin: 28px 0;
  }

  .article-wrapper p {
    margin-bottom: 18px;
    color: var(--texto);
  }

  h2.section-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 600;
    color: var(--verde);
    margin: 36px 0 14px;
    line-height: 1.3;
  }

  .destaque-intro {
    background: var(--verde-claro);
    border-left: 4px solid var(--verde);
    border-radius: 0 6px 6px 0;
    padding: 18px 20px;
    margin: 24px 0;
    font-size: 16px;
    color: #2a2a2a;
    line-height: 1.65;
  }

  .perfil-medica {
    background: var(--branco);
    border: 1px solid var(--borda);
    border-top: 3px solid var(--verde);
    border-radius: 0 0 8px 8px;
    padding: 20px;
    margin: 28px 0;
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .avatar-medica {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--verde) 0%, #3D8A68 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 24px;
    color: white;
    font-weight: 700;
    flex-shrink: 0;
  }

  .perfil-medica-info strong {
    display: block;
    font-size: 16px;
    color: var(--texto);
    margin-bottom: 3px;
  }

  .perfil-medica-info span {
    font-size: 13px;
    color: var(--texto-suave);
    display: block;
    line-height: 1.5;
  }

  .crm-badge {
    display: inline-block;
    margin-top: 6px;
    background: var(--verde-claro);
    color: var(--verde);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 3px 8px;
    border-radius: 3px;
  }

  .entrevista {
    margin: 32px 0;
  }

  .pergunta {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 4px;
  }

  .pergunta-label {
    flex-shrink: 0;
    background: var(--ameixa);
    color: white;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 3px;
    margin-top: 2px;
  }

  .pergunta p {
    font-weight: 700;
    color: var(--ameixa);
    font-size: 16px;
    margin-bottom: 0;
  }

  .resposta {
    background: var(--branco);
    border-left: 3px solid var(--verde);
    padding: 16px 20px;
    margin-bottom: 28px;
    border-radius: 0 6px 6px 0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }

  .resposta p { margin-bottom: 12px; }
  .resposta p:last-child { margin-bottom: 0; }

  .resposta-label {
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--verde);
    font-weight: 700;
    margin-bottom: 8px;
    display: block;
  }

  .destaque-laudo {
    background: #F9F6F0;
    border: 1px solid var(--dourado);
    border-radius: 6px;
    padding: 18px 20px;
    margin: 16px 0;
  }

  .destaque-laudo .laudo-title {
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--dourado);
    font-weight: 700;
    margin-bottom: 10px;
    display: block;
  }

  .destaque-laudo p {
    font-size: 15px;
    color: #3a3a3a;
    margin-bottom: 8px;
  }

  .destaque-laudo p:last-child { margin-bottom: 0; }

  .paciente-card {
    background: var(--branco);
    border: 1px solid var(--borda);
    border-radius: 8px;
    overflow: hidden;
    margin: 20px 0;
  }

  .paciente-header {
    background: var(--verde);
    color: white;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .paciente-header strong { font-size: 15px; }
  .paciente-header span { font-size: 12px; opacity: 0.85; }

  .paciente-tempo {
    background: white;
    color: var(--verde);
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 20px;
    letter-spacing: 0.5px;
  }

  .paciente-queixas {
    padding: 16px 20px 12px;
    background: var(--fundo);
    font-size: 13px;
    color: var(--texto-suave);
  }

  .paciente-queixas strong {
    color: var(--texto);
    display: block;
    margin-bottom: 6px;
  }

  .queixa-list {
    list-style: none;
    margin: 12px 0;
  }

  .queixa-list li {
    padding: 6px 0;
    font-size: 14px;
    color: var(--texto-suave);
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .queixa-list li::before {
    content: '\\2192';
    color: var(--verde);
    font-weight: 700;
    flex-shrink: 0;
  }

  .antes-depois-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .antes-box, .depois-box {
    padding: 20px;
    min-height: 160px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .antes-box {
    background: #F0F0ED;
    border-right: 1px solid var(--borda);
  }

  .depois-box {
    background: var(--verde-claro);
  }

  .ad-label {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .antes-box .ad-label { color: #888; }
  .depois-box .ad-label { color: var(--verde); }

  .ad-icon {
    font-size: 36px;
    margin-bottom: 8px;
  }

  .ad-texto {
    font-size: 13px;
    color: var(--texto-suave);
    line-height: 1.5;
  }

  .depois-box .ad-texto { color: var(--verde); font-weight: 700; }

  .paciente-depo {
    padding: 16px 20px;
    border-top: 1px solid var(--borda);
    font-size: 14px;
    font-style: italic;
    color: var(--texto-suave);
    background: var(--fundo);
  }

  .paciente-depo strong { font-style: normal; color: var(--verde); }

  .objection-box {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 28px 0;
  }

  .obj-item {
    background: var(--branco);
    border: 1px solid var(--borda);
    border-radius: 6px;
    padding: 14px;
    font-size: 13px;
  }

  .obj-duvida {
    color: #c0392b;
    font-weight: 700;
    margin-bottom: 6px;
    display: block;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .obj-texto {
    font-size: 13px;
    color: var(--texto-suave);
    margin-bottom: 4px;
  }

  .obj-resposta {
    color: var(--verde);
    font-weight: 700;
    font-size: 12px;
    display: block;
    margin-top: 4px;
  }

  .citacao-medica {
    background: var(--verde);
    color: white;
    border-radius: 8px;
    padding: 24px 28px;
    margin: 32px 0;
    position: relative;
  }

  .citacao-medica::before {
    content: '\\201C';
    font-family: 'Playfair Display', serif;
    font-size: 80px;
    color: rgba(255,255,255,0.2);
    position: absolute;
    top: -10px;
    left: 16px;
    line-height: 1;
  }

  .citacao-medica p {
    font-size: 17px;
    font-style: italic;
    line-height: 1.65;
    color: white;
    padding-left: 12px;
    margin-bottom: 12px;
  }

  .citacao-autor {
    font-size: 13px;
    color: rgba(255,255,255,0.75);
    padding-left: 12px;
    font-style: normal;
    display: block;
  }

  .editora-fechamento {
    background: var(--branco);
    border: 1px solid var(--borda);
    border-radius: 8px;
    padding: 28px;
    margin: 40px 0 24px;
  }

  .editora-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .avatar-editora {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--ameixa);
    color: white;
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .editora-info strong { display: block; font-size: 15px; }
  .editora-info span { font-size: 12px; color: var(--texto-suave); }

  .editora-nota {
    font-size: 14px;
    line-height: 1.7;
    color: var(--texto-suave);
    border-top: 1px solid var(--borda);
    padding-top: 16px;
    font-style: italic;
  }

  .editora-nota strong { color: var(--texto); font-style: normal; }

  .cta-block {
    background: linear-gradient(135deg, #1E4D37 0%, var(--verde) 100%);
    border-radius: 10px;
    padding: 32px 24px;
    text-align: center;
    margin: 32px 0;
  }

  .cta-eyebrow {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.7);
    margin-bottom: 10px;
  }

  .cta-block h3 {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    color: white;
    margin: 0 0 8px;
  }

  .cta-sub {
    font-size: 14px;
    color: rgba(255,255,255,0.8);
    margin-bottom: 20px;
  }

  .cta-btn {
    display: inline-block;
    background: #F0C040;
    color: #1A1A1A;
    font-size: 15px;
    font-weight: 700;
    padding: 16px 32px;
    border-radius: 5px;
    text-decoration: none;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s;
  }

  .cta-btn:hover { background: #E8B830; }

  .cta-selos {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 14px;
    flex-wrap: wrap;
  }

  .cta-selos span {
    font-size: 12px;
    color: rgba(255,255,255,0.75);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .urgencia-bar {
    background: #FFF3CD;
    border: 1px solid #F0C040;
    border-radius: 6px;
    padding: 12px 16px;
    font-size: 13px;
    color: #7A5200;
    text-align: center;
    margin: 16px 0;
  }

  .urgencia-bar strong { color: #5A3A00; }

  .comentarios {
    margin-top: 48px;
  }

  .comentarios h2 {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    margin-bottom: 20px;
    color: var(--texto);
  }

  .comentario {
    display: flex;
    gap: 12px;
    border-bottom: 1px solid var(--borda);
    padding: 16px 0;
  }

  .comentario-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: var(--ameixa-claro);
    color: var(--ameixa);
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .comentario-body { flex: 1; }
  .comentario-body strong { font-size: 14px; display: block; margin-bottom: 3px; }
  .comentario-body p { font-size: 14px; color: var(--texto-suave); margin-bottom: 4px; }
  .comentario-meta { font-size: 12px; color: #aaa; }

  .disclaimer {
    font-size: 11px;
    color: #aaa;
    border-top: 1px solid var(--borda);
    padding-top: 20px;
    margin-top: 40px;
    line-height: 1.6;
  }

  .separador-entrevista {
    text-align: center;
    margin: 20px 0;
    position: relative;
  }

  .separador-entrevista::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--borda);
  }

  .separador-entrevista span {
    background: var(--fundo);
    padding: 0 12px;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--texto-suave);
    position: relative;
  }

  @media (max-width: 600px) {
    .landing-body { font-size: 16px; }
    .objection-box { grid-template-columns: 1fr; }
    .byline-box { flex-wrap: wrap; }
    .views-bar { margin-left: 0; margin-top: 8px; }
    .landing-nav { gap: 14px; }
    .cta-btn { padding: 15px 22px; font-size: 14px; }
    .citacao-medica p { font-size: 16px; }
    .perfil-medica { flex-direction: column; align-items: center; text-align: center; }
  }
            ` }} />

            <div className="landing-body">

                <div className="topbar">Saúde · Beleza · Longevidade · Bem-estar para mulheres ativas</div>

                <header className="landing-header">
                    <div className="logo">Vida Ativa <span>Pro</span></div>
                    <div className="logo-tagline">Informação que transforma · Edição digital</div>
                    <nav className="landing-nav">
                        <span>Saúde</span>
                        <span className="active">Beleza & Pele</span>
                        <span>Nutrição</span>
                        <span>Bem-estar</span>
                        <span>Entrevistas</span>
                    </nav>
                </header>

                <article className="article-wrapper">

                    <div className="breadcrumb">
                        Vida Ativa Pro › <span>Beleza & Pele</span> › Dermatologia
                    </div>

                    <div className="meta-topo">
                        <span className="tag-cat">Entrevista Exclusiva</span>
                        <span className="tag-cat ameixa">Dermatologia</span>
                        <span className="meta-data">Sexta-feira, 26 Jun. 2026 · 09h14 &nbsp;·&nbsp; 👁 189.432 visualizações</span>
                    </div>

                    <h1 className="article-title">Dermatologista testa produto viral de professora para reduzir rugas — o que ela encontrou no laboratório deixou todo mundo em silêncio</h1>

                    <p className="deck">Depois de semanas ouvindo a mesma pergunta de pacientes, a Dra. Renata Carvalho decidiu parar de opinar sem evidência. Comprou o produto, mandou para análise e acompanhou seis pacientes por 45 dias. Isso é o que ela encontrou.</p>

                    <div className="byline-box">
                        <div className="avatar">C</div>
                        <div className="byline-info">
                            <strong>Camila Souza</strong>
                            <span>Editora-chefe · Vida Ativa Pro</span>
                        </div>
                        <div className="views-bar">👁 189k visualizações</div>
                    </div>

                    <div className="divisor" />

                    <p>Há cerca de dois meses, as mensagens das leitoras começaram a chegar com uma frequência que eu não conseguia ignorar.</p>

                    <p>Sempre a mesma pergunta, sempre variações do mesmo tema: <em>&quot;Camila, já ouviu falar do Dermavit C? Funciona mesmo? Vale a pena?&quot;</em></p>

                    <p>Muitas de vocês tinham lido depoimentos online. Algumas tinham amigas que usavam. Outras estavam na dúvida depois de ver resultados que pareciam bons demais para serem reais.</p>

                    <p>Eu precisava de uma resposta que valesse alguma coisa. Não mais um depoimento, não mais uma história de transformação — por mais emocionante que sejam. Eu queria saber o que uma profissional com anos de clínica, equipamento de laboratório e pacientes reais teria a dizer.</p>

                    <div className="destaque-intro">
                        <strong>Entrei em contato com a Dra. Renata Carvalho.</strong> Dermatologista com 18 anos de experiência clínica, especialista em envelhecimento cutâneo, atende em consultório privado em São Paulo. Pedi que ela fizesse o que eu não poderia: uma avaliação técnica de verdade. Com laudo. Com pacientes acompanhados. Com fotografia comparativa. Esta é a conversa que tivemos depois de seis semanas de análise.
                    </div>

                    <div className="perfil-medica">
                        <div className="avatar-medica">R</div>
                        <div className="perfil-medica-info">
                            <strong>Dra. Renata Carvalho</strong>
                            <span>Dermatologista · 18 anos de experiência clínica</span>
                            <span>Especialista em envelhecimento cutâneo e tratamentos não invasivos</span>
                            <span className="crm-badge">CRM/SP 147.832</span>
                        </div>
                    </div>

                    <div className="divisor" />

                    <div className="separador-entrevista"><span>Entrevista Completa</span></div>

                    {/* ENTREVISTA */}
                    <div className="entrevista">

                        <div className="pergunta">
                            <span className="pergunta-label">Camila</span>
                            <p>Dra. Renata, como você ficou sabendo do Dermavit C?</p>
                        </div>
                        <div className="resposta">
                            <span className="resposta-label">Dra. Renata Carvalho</span>
                            <p>No consultório, principalmente. Em um período de três semanas, pelo menos oito pacientes diferentes me perguntaram sobre o produto. Vinham com a tela do celular na mão, depoimentos que tinham lido, fotos de amigas. Quando um mesmo produto aparece nessa frequência durante as consultas, eu aprendi a prestar atenção.</p>
                            <p>Ou é uma modinha passageira que vai sumir sozinha, ou tem alguma coisa real por trás. A única forma de saber era investigar de verdade.</p>
                        </div>

                        <div className="pergunta">
                            <span className="pergunta-label">Camila</span>
                            <p>Você estava cética antes de testar?</p>
                        </div>
                        <div className="resposta">
                            <span className="resposta-label">Dra. Renata Carvalho</span>
                            <p>Completamente. Minha formação me ensina a desconfiar de qualquer produto que faça promessas amplas sem evidência clínica documentada. O mercado de skincare está cheio de embalagens bonitas, storytelling emocional e zero comprovação. Então sim, entrei no processo com ceticismo alto.</p>
                            <p>Mas ceticismo não é o mesmo que descarte sem análise. Esses são opostos muito diferentes.</p>
                        </div>

                        <div className="pergunta">
                            <span className="pergunta-label">Camila</span>
                            <p>O que você fez para testar?</p>
                        </div>
                        <div className="resposta">
                            <span className="resposta-label">Dra. Renata Carvalho</span>
                            <p>Comprei o produto pelo site oficial, exatamente como qualquer consumidora faria. Sem intermediários, sem amostra cedida pela marca. Queria garantir que estava analisando o produto real.</p>
                            <p>Depois, fiz duas coisas em paralelo: mandei uma amostra para análise laboratorial de composição e comecei a aplicar no meu próprio rosto. As duas frentes juntas me dariam uma visão mais completa do que qualquer uma sozinha.</p>
                        </div>

                        <div className="pergunta">
                            <span className="pergunta-label">Camila</span>
                            <p>O que o laboratório encontrou?</p>
                        </div>
                        <div className="resposta">
                            <span className="resposta-label">Dra. Renata Carvalho</span>
                            <p>Aqui é onde preciso ser honesta com você: eu esperava que o resultado fosse mediano. Um produto com ingredientes razoáveis, talvez, mas nada que justificasse tanto barulho. O laudo me surpreendeu.</p>

                            <div className="destaque-laudo">
                                <span className="laudo-title">📋 Pontos do laudo de composição</span>
                                <p><strong>Vitamina C estabilizada acima da média comercial:</strong> a maioria dos séruns populares usa vitamina C em forma instável, que oxida antes de penetrar na derme e não produz efeito real. Esse produto usa uma forma encapsulada que preserva a atividade até a penetração. Isso não é marketing — é química básica, e faz diferença enorme na eficácia.</p>
                                <p><strong>Complexo de peptídeos com estudos publicados:</strong> a combinação identificada no laudo tem pesquisas documentadas demonstrando ativação de fibroblastos — as células das camadas mais profundas da pele responsáveis por produzir colágeno e elastina. Esse é o mecanismo que explica os resultados que vi depois.</p>
                                <p><strong>Formulação compatível com pele madura:</strong> ausência de fragrância, sem álcool desnaturante, pH adequado para pele mais fina e sensível. Isso importa muito para pacientes na faixa dos 50 a 70 anos.</p>
                            </div>

                            <p>Não estou dizendo que é um produto perfeito ou que substitui todos os tratamentos. Estou dizendo que a fórmula tem fundamento. Não é água com perfume em vidro caro.</p>
                        </div>

                        <div className="pergunta">
                            <span className="pergunta-label">Camila</span>
                            <p>E no seu próprio rosto? O que você percebeu?</p>
                        </div>
                        <div className="resposta">
                            <span className="resposta-label">Dra. Renata Carvalho</span>
                            <p>Tenho 44 anos. As marcas de expressão já estavam aparecendo — especialmente ao redor dos olhos e no sulco nasolabial. Na segunda semana de uso, percebi que a textura da pele estava diferente. Mais firme ao toque, com uma uniformidade que eu não via há um tempo.</p>
                            <p>Na quarta semana, duas colegas da clínica me perguntaram se eu tinha feito algum procedimento. Não tinha feito nada além do sérum.</p>
                            <p>Agora — eu sei que não sou uma testemunha imparcial da minha própria pele. Por isso o que me convenceu de verdade foram os resultados nos pacientes que acompanhei com protocolo fotográfico padronizado.</p>
                        </div>

                        <div className="pergunta">
                            <span className="pergunta-label">Camila</span>
                            <p>Como foi o acompanhamento das pacientes?</p>
                        </div>
                        <div className="resposta">
                            <span className="resposta-label">Dra. Renata Carvalho</span>
                            <p>Selecionei seis pacientes com perfis diferentes de pele, faixas etárias entre 47 e 68 anos, e queixas variadas: rugas de expressão, flacidez, manchas, textura irregular. Nenhuma delas usou outros tratamentos durante o período — apenas o sérum, com o protocolo de 7 segundos pela manhã que o fabricante recomenda.</p>
                            <p>Fotografei com câmera padronizada a cada duas semanas, mesma iluminação, mesmo ângulo. Quero mostrar dois casos que são representativos do que vi no grupo.</p>
                        </div>

                    </div>

                    <h2 className="section-title">Os resultados das pacientes — documentados com fotografia</h2>

                    {/* PACIENTE 1 */}
                    <div className="paciente-card">
                        <div className="paciente-header">
                            <div>
                                <strong>Neusa R., 58 anos</strong>
                                <span style={{ display: 'block', fontSize: '12px', opacity: 0.85 }}>Pele oleosa/mista · Histórico de exposição solar · Sem procedimentos anteriores</span>
                            </div>
                            <span className="paciente-tempo">30 dias de uso</span>
                        </div>
                        <div className="paciente-queixas">
                            <strong>Queixas iniciais:</strong>
                            <ul className="queixa-list">
                                <li>Rugas profundas na testa e ao redor da boca</li>
                                <li>Manchas de sol distribuídas pelo rosto</li>
                                <li>Tom de pele irregular, opaco</li>
                            </ul>
                        </div>
                        <div className="antes-depois-grid">
                            <div className="antes-box">
                                <div className="ad-label">Antes</div>
                                <div className="ad-icon">😔</div>
                                <div className="ad-texto">Rugas visíveis em repouso, manchas escuras, pele sem luminosidade</div>
                            </div>
                            <div className="depois-box">
                                <div className="ad-label">30 dias depois</div>
                                <div className="ad-icon">✨</div>
                                <div className="ad-texto">Linhas de expressão reduzidas. Clareamento inicial das manchas. Tom de pele mais homogêneo.</div>
                            </div>
                        </div>
                        <div className="paciente-depo">
                            <strong>Relato da paciente:</strong> &quot;Doutora, minha filha perguntou o que eu tinha feito no rosto. Não acreditei que só o sérum ia fazer isso em um mês.&quot;
                        </div>
                    </div>

                    {/* PACIENTE 2 */}
                    <div className="paciente-card">
                        <div className="paciente-header" style={{ background: 'var(--ameixa)' }}>
                            <div>
                                <strong>Marlene T., 65 anos</strong>
                                <span style={{ display: 'block', fontSize: '12px', opacity: 0.85 }}>Pele seca e sensível · Característica da faixa etária · Intolerância a retinol</span>
                            </div>
                            <span className="paciente-tempo" style={{ background: 'white', color: 'var(--ameixa)' }}>45 dias de uso</span>
                        </div>
                        <div className="paciente-queixas">
                            <strong>Queixas iniciais:</strong>
                            <ul className="queixa-list">
                                <li>Flacidez no contorno do rosto e pescoço</li>
                                <li>Textura irregular, pele fina com tendência à irritação</li>
                                <li>Oval do rosto sem definição</li>
                            </ul>
                        </div>
                        <div className="antes-depois-grid">
                            <div className="antes-box">
                                <div className="ad-label">Antes</div>
                                <div className="ad-icon">😔</div>
                                <div className="ad-texto">Flacidez no contorno e pescoço, textura irregular, oval &quot;descendo&quot;</div>
                            </div>
                            <div className="depois-box">
                                <div className="ad-label">45 dias depois</div>
                                <div className="ad-icon">✨</div>
                                <div className="ad-texto">Firmeza recuperada no contorno. Pescoço com textura homogênea. Oval mais definido. Zero reação irritativa.</div>
                            </div>
                        </div>
                        <div className="paciente-depo">
                            <strong>Nota clínica da Dra. Renata:</strong> &quot;Marlene tem pele sensível que reage a retinol. Não apresentou nenhuma reação ao Dermavit C durante os 45 dias — o que confirma o que o laudo indicava sobre a compatibilidade da fórmula com pele madura.&quot;
                        </div>
                    </div>

                    <div className="divisor" />

                    <div className="entrevista">

                        <div className="pergunta">
                            <span className="pergunta-label">Camila</span>
                            <p>Muitas leitoras me perguntam: por que um produto assim não está nas farmácias? Isso não é suspeito?</p>
                        </div>
                        <div className="resposta">
                            <span className="resposta-label">Dra. Renata Carvalho</span>
                            <p>É uma pergunta legítima, e eu também a fiz antes de pesquisar. A resposta é mais simples do que parece.</p>
                            <p>Distribuição em farmácias e grandes redes cosméticas exige margens de revenda altíssimas — o produto chega ao consumidor com o preço multiplicado por duas ou três vezes. Para caber em um preço de prateleira competitivo, o fabricante precisa comprimir o custo dos ingredientes ativos. E é aí que a qualidade vai embora.</p>
                            <p>Alguns fabricantes optam por venda direta exatamente para não fazer essa troca. Não estar na farmácia não é sinal de produto inferior. Em muitos casos, é o sinal oposto. O laudo que vi confirma que esse é um desses casos.</p>
                        </div>

                        <div className="pergunta">
                            <span className="pergunta-label">Camila</span>
                            <p>É seguro para mulheres com pele mais fina, madura ou sensível?</p>
                        </div>
                        <div className="resposta">
                            <span className="resposta-label">Dra. Renata Carvalho</span>
                            <p>Pelos laudos que analisei e pelo acompanhamento das seis pacientes — sim, incluindo a Marlene, que é exatamente esse perfil. Pele fina, sensível, intolerante a retinol. Nenhuma reação irritativa em 45 dias.</p>
                            <p>A fórmula não tem fragrância, não tem álcool desnaturante, e o pH está na faixa correta para pele madura. São os três critérios que eu olho primeiro quando avalio segurança para esse grupo de pacientes.</p>
                            <p>Como eu digo a todas: se você tem histórico de alergia a algum ativo específico, verifique a lista de ingredientes com seu dermatologista. Isso vale para qualquer produto cosmético.</p>
                        </div>

                        <div className="pergunta">
                            <span className="pergunta-label">Camila</span>
                            <p>Resultado final: você recomendaria o Dermavit C?</p>
                        </div>
                        <div className="resposta">
                            <span className="resposta-label">Dra. Renata Carvalho</span>
                            <p>Eu recomendo. Já recomendo. Está no meu protocolo de manutenção para pacientes que querem cuidar da pele entre procedimentos — ou que não têm orçamento para procedimentos frequentes e precisam de uma alternativa que funcione de verdade.</p>
                            <p>Não substitui o que o laser ou o ultrassom faz em casos mais avançados. Mas para prevenção, manutenção e reversão inicial do envelhecimento? Tem base clínica. Tem resultado documentado. E a minha própria pele está diferente depois de seis semanas.</p>
                            <p>O que me convence de verdade, como médica, é que o mecanismo de ação faz sentido. Não é mágica. É bioquímica com evidência. E os resultados nas pacientes são consistentes com o que a ciência diz que deveria acontecer.</p>
                        </div>

                    </div>

                    <div className="citacao-medica">
                        <p>Entrei nessa análise como cética. Saí como alguém que inclui esse produto no próprio protocolo diário e o recomenda no consultório. Os dados não deixaram outra conclusão possível.</p>
                        <span className="citacao-autor">— Dra. Renata Carvalho, dermatologista com 18 anos de experiência</span>
                    </div>

                    {/* Objeções */}
                    <h2 className="section-title">As dúvidas mais comuns — respondidas pela Dra. Renata</h2>

                    <div className="objection-box">
                        <div className="obj-item">
                            <span className="obj-duvida">❓ &quot;Será que funciona de verdade?&quot;</span>
                            <p className="obj-texto">Laudo laboratorial confirmou formulação com mecanismo de ação documentado.</p>
                            <span className="obj-resposta">✅ Tem evidência. Não é promessa.</span>
                        </div>
                        <div className="obj-item">
                            <span className="obj-duvida">❓ &quot;Nunca vi médico recomendar&quot;</span>
                            <p className="obj-texto">A Dra. Renata já inclui no protocolo de consultório após análise clínica.</p>
                            <span className="obj-resposta">✅ Agora você viu.</span>
                        </div>
                        <div className="obj-item">
                            <span className="obj-duvida">❓ &quot;Por que não tem em farmácia?&quot;</span>
                            <p className="obj-texto">Venda direta preserva qualidade da fórmula sem comprimir custo dos ativos.</p>
                            <span className="obj-resposta">✅ É uma escolha do fabricante, não uma bandeira vermelha.</span>
                        </div>
                        <div className="obj-item">
                            <span className="obj-duvida">❓ &quot;E se minha pele for sensível?&quot;</span>
                            <p className="obj-texto">Paciente com pele sensível e intolerância a retinol usou 45 dias sem reação.</p>
                            <span className="obj-resposta">✅ Fórmula compatível com pele madura.</span>
                        </div>
                    </div>

                    <div className="divisor" />

                    {/* NOTA DA EDITORA */}
                    <div className="editora-fechamento">
                        <div className="editora-header">
                            <div className="avatar-editora">C</div>
                            <div className="editora-info">
                                <strong>Nota da editora — Camila Souza</strong>
                                <span>Editora-chefe · Vida Ativa Pro</span>
                            </div>
                        </div>
                        <div className="editora-nota">
                            <p>Depois de seis semanas acompanhando a análise da Dra. Renata — e depois de ver com meus próprios olhos os registros fotográficos das pacientes — não tenho mais dúvida sobre o que responder quando vocês me perguntam.</p>
                            <p style={{ marginTop: '12px' }}>Se você já ouviu falar do Dermavit C mas ficou na dúvida se era coisa de internet sem comprovação, espero que essa conversa tenha resolvido.</p>
                            <p style={{ marginTop: '12px' }}><strong>O único lugar onde o produto original é vendido é no site oficial.</strong> Não encontrei o produto em nenhum outro canal — e os laudos que a Dra. Renata analisou foram do produto comprado diretamente lá. Só nesse site você garante a fórmula certificada, com a garantia de 90 dias e o desconto atual.</p>
                        </div>
                    </div>

                    <div className="urgencia-bar">
                        ⚠️ <strong>Atenção:</strong> Os peptídeos clínicos da fórmula têm produção limitada. Nos últimos 60 dias, o estoque esgotou duas vezes. Verifique a disponibilidade antes de decidir.
                    </div>

                    <div className="cta-block">
                        <div className="cta-eyebrow">Site oficial · Produto verificado</div>
                        <h3>Garantir meu Dermavit C agora</h3>
                        <p className="cta-sub">60% de desconto + frete grátis + garantia de 90 dias para todo o Brasil</p>
                        <a href="#" className="cta-btn">⚡ Verificar disponibilidade agora</a>
                        <div className="cta-selos">
                            <span>🔒 Pagamento seguro</span>
                            <span>📦 Frete grátis</span>
                            <span>✅ Garantia 90 dias</span>
                        </div>
                    </div>

                    {/* COMENTÁRIOS */}
                    <div className="comentarios">
                        <h2>💬 Comentários (187)</h2>

                        <div className="comentario">
                            <div className="comentario-avatar">L</div>
                            <div className="comentario-body">
                                <strong>Luciana Bertoldo</strong>
                                <p>Estava esperando exatamente isso — uma médica falando sobre o produto de verdade, não só depoimento. Já comprei. Obrigada Camila por trazer essa entrevista.</p>
                                <span className="comentario-meta">👍 42 · 18 min atrás</span>
                            </div>
                        </div>

                        <div className="comentario">
                            <div className="comentario-avatar">R</div>
                            <div className="comentario-body">
                                <strong>Regina Albuquerque</strong>
                                <p>Minha dúvida era exatamente sobre pele sensível porque o retinol nunca concordou comigo. Ficou claro agora. Vou pedir o kit de 3.</p>
                                <span className="comentario-meta">👍 31 · 45 min atrás</span>
                            </div>
                        </div>

                        <div className="comentario">
                            <div className="comentario-avatar">S</div>
                            <div className="comentario-body">
                                <strong>Sônia Magalhães</strong>
                                <p>Tenho 62 anos e já tô no segundo mês usando. Posso confirmar: minhas filhas tão perguntando o que eu fiz. Não fiz nada, é só o sérum.</p>
                                <span className="comentario-meta">👍 67 · 1h atrás</span>
                            </div>
                        </div>

                        <div className="comentario">
                            <div className="comentario-avatar">E</div>
                            <div className="comentario-body">
                                <strong>Edilene Carmo</strong>
                                <p>A parte sobre por que não tem em farmácia esclareceu muito. Eu ficava achando suspeito. Agora entendi a lógica. Faz sentido.</p>
                                <span className="comentario-meta">👍 28 · 2h atrás</span>
                            </div>
                        </div>

                        <div className="comentario">
                            <div className="comentario-avatar">M</div>
                            <div className="comentario-body">
                                <strong>Maristela Fonseca</strong>
                                <p>Já vi o depoimento da Márcia antes e quase comprei mas tive dúvida. Depois dessa entrevista com a médica, não tenho mais. Vou comprar agora.</p>
                                <span className="comentario-meta">👍 54 · 3h atrás</span>
                            </div>
                        </div>

                        <div className="comentario">
                            <div className="comentario-avatar">C</div>
                            <div className="comentario-body">
                                <strong>Cleide Ramos</strong>
                                <p>Quanto tempo demora pra entregar? Tenho evento daqui a 6 semanas e queria começar logo.</p>
                                <span className="comentario-meta">👍 9 · 3h atrás</span>
                            </div>
                        </div>

                        <div className="comentario">
                            <div className="comentario-avatar">V</div>
                            <div className="comentario-body">
                                <strong>Vera Nunes</strong>
                                <p>Cleide, o meu chegou em 7 dias úteis aqui em Minas. O site tem rastreio. Vale pegar o kit de 3 porque a promoção tá boa e você usa sem interrupção.</p>
                                <span className="comentario-meta">👍 17 · 2h atrás</span>
                            </div>
                        </div>

                    </div>

                    <div className="divisor" />

                    <p className="disclaimer">
                        Este é um conteúdo patrocinado (advertorial). Os resultados descritos são individuais e podem variar de pessoa para pessoa. As afirmações sobre os ingredientes têm base em estudos clínicos disponíveis publicamente e na análise laboratorial realizada de forma independente. Este produto não se destina a diagnosticar, tratar, curar ou prevenir doenças. Consulte sempre um dermatologista antes de iniciar qualquer novo tratamento. A garantia de reembolso está sujeita aos termos e condições do fabricante. © 2026 Vida Ativa Pro. Todos os direitos reservados.
                    </p>

                </article>

            </div>
        </>
    )
}
