/**
 * app.js — SPA ルーター & ページレンダラー
 *
 * CrowdWorks のプロフィールURLを変更するには CROWDWORKS_URL を書き換えてください。
 */

const CROWDWORKS_URL = 'https://crowdworks.jp/public/employees/new'; // ← ご自身のURLに変更

/* ===================================================
   Helpers
=================================================== */
const SLUG_LABEL = {
  'ai-it':     'AI',
  'lifestyle': 'Life',
  'health':    'Health',
  'career':    'Career',
  'column':    'Essay',
  'scenario':  'Script',
};

function formatDate(str) {
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

/* 本文HTMLから文字数を計測して読了時間を返す（約500字/分） */
function calcReadTime(html) {
  const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, '');
  return Math.max(1, Math.ceil(text.length / 500));
}

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function catLabel(slug) { return SLUG_LABEL[slug] || ''; }

/* ===================================================
   Router
=================================================== */
function getRoute() {
  return window.location.hash.replace(/^#/, '') || '/';
}

function router() {
  const route = getRoute();
  const main  = document.getElementById('main');

  window.scrollTo({ top: 0, behavior: 'instant' });

  /* ---- active nav ---- */
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.remove('active');
    const href = el.getAttribute('href').replace('#', '');
    if (href === route) el.classList.add('active');
    if (route === '/' && href === '/') el.classList.add('active');
    if (href === '/writing' && (route === '/writing' || route === '/articles' || route.startsWith('/articles/')))
      el.classList.add('active');
    if (href === '/scenario' && (route === '/scenario' || route.startsWith('/scenario/')))
      el.classList.add('active');
  });

  /* ---- close mobile nav ---- */
  const navList   = document.getElementById('navList');
  const navToggle = document.getElementById('navToggle');
  navList.classList.remove('open');
  navToggle.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');

  /* ---- render ---- */
  let html = '';
  if (route === '/')
    html = renderHome();
  else if (route === '/profile')
    html = renderProfile();
  else if (route === '/genres')
    html = renderGenres();
  else if (route === '/writing' || route === '/articles')
    html = renderWriting();
  else if (route.startsWith('/articles/'))
    html = renderArticleDetail(route.slice('/articles/'.length));
  else if (route === '/scenario')
    html = renderScenario();
  else if (route.includes('/episode/')) {
    const m = route.match(/^\/scenario\/([^/]+)\/episode\/(\d+)$/);
    html = m ? renderEpisode(m[1], parseInt(m[2])) : render404();
  }
  else if (route.startsWith('/scenario/'))
    html = renderSeriesDetail(route.slice('/scenario/'.length));
  else if (route === '/contact')
    html = renderContact();
  else
    html = render404();

  main.innerHTML = `<div class="page-enter">${html}</div>`;
  attachHandlers(route);
  initReveal();
}

/* ===================================================
   Scroll reveal
=================================================== */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: .12 });
  els.forEach(el => io.observe(el));
}

/* ===================================================
   Article card (writing)
=================================================== */
function renderCard(article, delayClass = '') {
  const label = catLabel(article.categorySlug);
  return `
    <div class="article-card reveal ${delayClass}"
         data-slug="${esc(article.categorySlug)}"
         data-category="${esc(article.category)}"
         role="article" tabindex="0"
         aria-label="${esc(article.title)}"
         onclick="location.hash='#/articles/${esc(article.id)}'">
      <div class="card-thumb" data-label="${label}"></div>
      <div class="card-body">
        <p class="card-eyebrow">${esc(article.category)}</p>
        <h3 class="card-title">${esc(article.title)}</h3>
        <p class="card-excerpt">${esc(article.excerpt)}</p>
        <div class="card-meta">
          <span>${formatDate(article.date)}</span>
          <span>${calcReadTime(article.content)} min read</span>
        </div>
      </div>
    </div>`;
}

/* ===================================================
   Work card (scenario series)
=================================================== */
const STORY_DECO = { romance: '恋', 'youtube-drama': '涙', 'youtube-scat': '爽' };

function renderWorkCard(story) {
  const deco = STORY_DECO[story.categorySlug] || '';
  const pubCount = story.episodes.filter(e => e.published).length;
  return `
    <a class="work-card reveal" href="#/scenario/${esc(story.id)}"
       data-cat="${esc(story.categorySlug)}"
       role="article" aria-label="${esc(story.title)}">
      <div class="work-thumb" data-deco="${deco}"></div>
      <div class="work-body">
        <span class="work-genre-tag">${esc(story.genre)}</span>
        <h3 class="work-title">${esc(story.title)}</h3>
        <p class="work-summary">${esc(story.summary)}</p>
        <span class="work-ep-count">全${story.totalEpisodes}話完結</span>
        <span class="work-cta">作品を読む →</span>
      </div>
    </a>`;
}

/* ===================================================
   Page: Home
=================================================== */
function renderHome() {
  const recentArticles = ARTICLES.slice(0, 3);
  const publishedStories = STORIES.filter(s => s.published);

  return `
    <section class="hero">
      <div class="container">
        <div class="hero-inner">
          <p class="hero-label">Writing Portfolio</p>
          <h1 class="hero-title">読者に届く文章で、価値あるコンテンツをお届けします。</h1>
          <p class="hero-body">Webライティングからシナリオ制作まで、丁寧な表現と確かな構成力でコンテンツをお届けするライターのポートフォリオです。</p>
          <div class="hero-actions">
            <a class="hero-cta" href="#/writing">ライティングを見る →</a>
            <a class="hero-cta hero-cta--sub" href="#/scenario">シナリオを見る →</a>
          </div>
        </div>
      </div>
    </section>

    <section class="home-cat-section">
      <div class="container">
        <div class="sec-head reveal">
          <div>
            <span class="home-cat-label">WEB WRITING</span>
            <h2>Webライティング</h2>
          </div>
          <a class="sec-link" href="#/writing">すべて見る →</a>
        </div>
        <div class="articles-grid">
          ${recentArticles.map((a, i) => renderCard(a, `reveal-delay-${i + 1}`)).join('')}
        </div>
      </div>
    </section>

    <section class="home-cat-section home-cat-section--alt">
      <div class="container">
        <div class="sec-head reveal">
          <div>
            <span class="home-cat-label">SCENARIO WRITING</span>
            <h2>シナリオ制作</h2>
          </div>
          <a class="sec-link" href="#/scenario">すべて見る →</a>
        </div>
        <div class="works-grid">
          ${publishedStories.map(s => renderWorkCard(s)).join('')}
        </div>
      </div>
    </section>

    <div class="cta-strip">
      <div class="container">
        <div class="cta-strip-inner">
          <p class="cta-strip-label">Contact</p>
          <h2>お仕事のご依頼・ご相談はお気軽に</h2>
          <p>クラウドワークスからのご依頼も歓迎しています</p>
          <div class="cta-btns">
            <a class="btn-cta-fill" href="${esc(CROWDWORKS_URL)}" target="_blank" rel="noopener noreferrer">
              クラウドワークスを見る
            </a>
            <a class="btn-cta-light" href="#/contact">お問い合わせ</a>
          </div>
        </div>
      </div>
    </div>`;
}

/* ===================================================
   Page: Writing (Webライティング記事一覧)
=================================================== */
function renderWriting() {
  const categories = ['all', ...new Set(ARTICLES.map(a => a.category))];
  return `
    <section class="articles-section">
      <div class="container">
        <div class="articles-head">
          <p class="home-cat-label" style="margin-bottom:.3rem;">WEB WRITING</p>
          <h1 class="reveal">Webライティング</h1>
          <p class="reveal">各ジャンルのサンプル記事です。カードをクリックすると全文をご覧いただけます。</p>
        </div>

        <div class="articles-filter" role="group" aria-label="カテゴリフィルター">
          ${categories.map(cat => `
            <button class="filter-btn${cat === 'all' ? ' active' : ''}"
                    data-filter="${esc(cat)}" type="button">
              ${cat === 'all' ? 'All' : esc(cat)}
            </button>`).join('')}
        </div>

        <div class="articles-grid" id="articlesGrid">
          ${ARTICLES.map((a, i) => renderCard(a, `reveal-delay-${Math.min(i % 3 + 1, 3)}`)).join('')}
        </div>
      </div>
    </section>`;
}

/* ===================================================
   Page: Scenario (シナリオ作品一覧)
=================================================== */
const SCENARIO_CATEGORIES = [
  { slug: 'romance',       label: '恋愛・創作ストーリー' },
  { slug: 'youtube-drama', label: '感動系YouTube台本' },
  { slug: 'youtube-scat',  label: 'スカッと系YouTube台本' },
];

function renderScenario() {
  const publishedStories = STORIES.filter(s => s.published);

  const categorySections = SCENARIO_CATEGORIES
    .map(cat => {
      const works = publishedStories.filter(s => s.categorySlug === cat.slug);
      if (!works.length) return '';
      return `
        <div class="scenario-cat reveal">
          <p class="scenario-cat-head">${esc(cat.label)}</p>
          <div class="works-grid">
            ${works.map(s => renderWorkCard(s)).join('')}
          </div>
        </div>`;
    })
    .join('');

  return `
    <section class="scenario-section">
      <div class="container">
        <p class="home-cat-label" style="margin-bottom:.3rem;">SCENARIO WRITING</p>
        <h1 class="scenario-page-title reveal">シナリオ制作</h1>
        <p class="scenario-page-lead reveal">創作ストーリーやYouTube台本などの作品を掲載しています。</p>
        ${categorySections || '<p style="color:var(--text-3);font-size:.87rem;">現在準備中です。</p>'}
      </div>
    </section>`;
}

/* ===================================================
   Page: Series detail (シリーズ詳細)
=================================================== */
function renderSeriesDetail(id) {
  const story = STORIES.find(s => s.id === id && s.published);
  if (!story) return render404();

  const episodeItems = story.episodes.map(ep => {
    if (ep.published) {
      return `
        <a class="ep-list-item" href="#/scenario/${esc(story.id)}/episode/${ep.number}">
          <span class="ep-num-label">第${ep.number}話</span>
          <span class="ep-title-label">${esc(ep.title)}</span>
          <span class="ep-arrow-icon">→</span>
        </a>`;
    }
    return `
      <div class="ep-list-item ep-list-item--locked" aria-disabled="true">
        <span class="ep-num-label">第${ep.number}話</span>
        <span class="ep-title-label">${esc(ep.title)}</span>
        <span class="ep-badge-status">準備中</span>
      </div>`;
  }).join('');

  return `
    <div class="series-wrap">
      <div class="container">
        <div class="series-inner">

          <nav class="breadcrumb" aria-label="パンくずリスト">
            <a href="#/">Top</a>
            <span class="bc-sep">/</span>
            <a href="#/scenario">Scenario</a>
            <span class="bc-sep">/</span>
            <span aria-current="page">${esc(story.title)}</span>
          </nav>

          <div class="series-hd">
            <span class="series-genre-tag">${esc(story.genre)}</span>
            <h1 class="series-main-title">${esc(story.title)}</h1>
            <p class="series-summary-text">${esc(story.summary)}</p>
            <span class="series-ep-count">全${story.totalEpisodes}話完結</span>
          </div>

          <div class="ep-list" role="list">
            ${episodeItems}
          </div>

        </div>
      </div>
    </div>`;
}

/* ===================================================
   Page: Episode reader (各話本文)
=================================================== */
function renderEpisode(seriesId, epNum) {
  const story = STORIES.find(s => s.id === seriesId && s.published);
  if (!story) return render404();

  const episode = story.episodes.find(e => e.number === epNum && e.published);
  if (!episode) return render404();

  const prevEp = story.episodes.find(e => e.number === epNum - 1);
  const nextEp = story.episodes.find(e => e.number === epNum + 1);
  const isLast  = epNum === story.totalEpisodes;

  const prevBtn = prevEp
    ? `<a class="ep-footer-btn" href="#/scenario/${esc(story.id)}/episode/${prevEp.number}">← 前の話へ</a>`
    : `<span></span>`;

  const nextBtn = (nextEp && nextEp.published)
    ? `<a class="ep-footer-btn" href="#/scenario/${esc(story.id)}/episode/${nextEp.number}">次の話へ →</a>`
    : `<span></span>`;

  const restartBtn = isLast
    ? `<a class="ep-restart-btn" href="#/scenario/${esc(story.id)}/episode/1">第1話から読み直す</a>`
    : '';

  return `
    <div class="reader-wrap">
      <div class="reader-inner">

        <nav class="breadcrumb" aria-label="パンくずリスト">
          <a href="#/">Top</a>
          <span class="bc-sep">/</span>
          <a href="#/scenario">Scenario</a>
          <span class="bc-sep">/</span>
          <a href="#/scenario/${esc(story.id)}">${esc(story.title)}</a>
          <span class="bc-sep">/</span>
          <span aria-current="page">第${epNum}話</span>
        </nav>

        <header class="reader-header">
          <a class="reader-series-link" href="#/scenario/${esc(story.id)}">${esc(story.title)}</a>
          <p class="reader-ep-num">第${epNum}話</p>
          <h1 class="reader-ep-title">${esc(episode.title)}</h1>
        </header>

        <div class="story-body" lang="ja">
          ${episode.content}
        </div>

        <nav class="ep-footer-nav" aria-label="エピソードナビゲーション">
          <div class="ep-footer-nav-row">
            ${prevBtn}
            ${nextBtn}
          </div>
          ${restartBtn}
          <a class="ep-footer-back" href="#/scenario/${esc(story.id)}">← 作品一覧へ戻る</a>
        </nav>

      </div>
    </div>`;
}

/* ===================================================
   Page: Profile
=================================================== */
function renderProfile() {
  return `
    <div class="container">
      <div class="profile-wrap">
        <div class="profile-inner">

          <aside class="profile-aside reveal">
            <div class="profile-mark">
              <img src="img/profile.png" alt="ぬっま" class="profile-avatar">
            </div>
            <p class="profile-name">ぬっま</p>
            <h1>Webライター ／ シナリオライター</h1>
            <p class="role">Writing Portfolio</p>
            <div class="profile-tag-list">
              <span class="ptag">AI・IT</span>
              <span class="ptag">ライフスタイル</span>
              <span class="ptag">健康</span>
              <span class="ptag">仕事・キャリア</span>
              <span class="ptag">コラム</span>
              <span class="ptag">シナリオ・脚本</span>
            </div>
            <a class="profile-cw-btn" href="${esc(CROWDWORKS_URL)}"
               target="_blank" rel="noopener noreferrer">
              CrowdWorks →
            </a>
          </aside>

          <div class="profile-main">
            <div class="profile-section reveal">
              <h2 class="profile-h2">About</h2>
              <p class="profile-text">はじめまして。Webライターとして、AI・IT分野から暮らし・健康・キャリアまで、幅広いジャンルの記事制作に取り組んでいます。</p>
              <p class="profile-text">「読んでよかった」と思っていただける記事を届けることを目標に、丁寧なリサーチと読者視点を大切にしたライティングを心がけています。</p>
            </div>

            <div class="profile-section reveal">
              <h2 class="profile-h2">Skills</h2>
              <ul class="skills-list">
                <li>読者に寄り添った文章</li>
                <li>わかりやすい構成づくり</li>
                <li>丁寧なリサーチ</li>
                <li>SEOを意識した記事制作</li>
                <li>納期厳守</li>
                <li>丁寧なコミュニケーション</li>
              </ul>
            </div>

            <div class="profile-section reveal">
              <h2 class="profile-h2">Approach</h2>
              <p class="profile-text">ライティングにおいて最も大切にしていることは、「読者にとっての価値」です。文字数を埋めるための文章ではなく、読んだ人が何か気づきを得たり、行動のきっかけになったりするような記事を目指しています。</p>
              <p class="profile-text">また、情報の正確さには特に気を使っています。事実確認を怠らず、信頼できる情報源に基づいた内容をお届けすることを基本姿勢としています。</p>
            </div>

            <div class="profile-section reveal">
              <h2 class="profile-h2">Genres</h2>
              <p class="profile-text">AI・IT、暮らし・ライフスタイル、健康、仕事・キャリア、コラム・体験談に加え、Webドラマや動画台本などのシナリオ・脚本にも対応しています。
              詳しくは<a href="#/genres" style="color:var(--navy);border-bottom:1px solid var(--rule-2);">得意ジャンルのページ</a>をご覧ください。</p>
            </div>
          </div>

        </div>
      </div>
    </div>`;
}

/* ===================================================
   Page: Genres
=================================================== */
function renderGenres() {
  const genres = [
    {
      slug: 'ai-it',
      name: 'AI・IT',
      desc: 'ChatGPTなどの生成AI、ITツール活用、テクノロジートレンドなど、最新技術をわかりやすく解説します。難しい内容も身近な言葉で伝えることを大切にしています。',
      tags: ['生成AI活用', 'ツール紹介', 'DXコラム', 'ITトレンド']
    },
    {
      slug: 'lifestyle',
      name: '暮らし・ライフスタイル',
      desc: 'シンプルライフ、整理収納、時短術、サステナブルな暮らしなど、日々の生活を豊かにするコンテンツを得意とします。',
      tags: ['シンプルライフ', '暮らしの工夫', 'インテリア', '整理収納']
    },
    {
      slug: 'health',
      name: '健康',
      desc: '在宅ワーカーの健康管理、セルフケア、メンタルヘルス、食事・運動習慣など、日常に取り入れやすい健康情報をお届けします。',
      tags: ['セルフケア', 'メンタルヘルス', '運動習慣', '食生活']
    },
    {
      slug: 'career',
      name: '仕事・キャリア',
      desc: 'フリーランス・副業、キャリアチェンジ、仕事効率化、働き方改革など、現代の多様な働き方に関するコンテンツを制作します。',
      tags: ['フリーランス', '副業', 'キャリア', '仕事効率化']
    },
    {
      slug: 'column',
      name: 'コラム・体験談',
      desc: '個人の視点や体験をもとにした読み物コンテンツです。共感を呼ぶ文章と、読者に寄り添った語り口を意識して書きます。',
      tags: ['体験談', 'エッセイ', '気づきのコラム', 'ライフコラム']
    },
    {
      slug: 'scenario',
      name: 'シナリオ・脚本',
      desc: 'Webドラマ、YouTube動画台本、ゲームシナリオなど、映像・音声コンテンツ向けの脚本制作に対応します。キャラクターの声と物語の流れを大切にした台本を書きます。',
      tags: ['Webドラマ', 'YouTube台本', '動画スクリプト', 'ゲームシナリオ']
    },
  ];

  return `
    <section class="genres-section">
      <div class="container">
        <h1 class="genres-page-title reveal">得意ジャンル</h1>
        <p class="genres-page-lead reveal">以下のジャンルを中心に対応しています。記載以外のテーマもお気軽にご相談ください。</p>

        <div class="genres-list">
          ${genres.map((g, i) => `
            <div class="genre-item reveal reveal-delay-${Math.min(i + 1, 3)}">
              <div class="genre-num label">0${i + 1}</div>
              <div class="genre-head">
                <h2 class="genre-name">${esc(g.name)}</h2>
                <p class="genre-desc">${esc(g.desc)}</p>
              </div>
              <div class="genre-tags-col">
                ${g.tags.map(t => `<span class="gtag">${esc(t)}</span>`).join('')}
              </div>
            </div>`).join('')}
        </div>

        <div style="margin-top:4.5rem;" class="reveal">
          <div class="sec-head">
            <h2>ご依頼・ご相談はこちら</h2>
            <a class="sec-link" href="#/contact">フォームへ →</a>
          </div>
          <p style="font-size:.85rem;font-weight:300;color:var(--text-2);line-height:2;">
            記載ジャンル以外のご依頼もご相談ください。まずはお気軽にメッセージをお送りいただければ、対応可能か確認します。
          </p>
        </div>
      </div>
    </section>`;
}

/* ===================================================
   Page: Article detail (既存記事詳細)
=================================================== */
function renderArticleDetail(id) {
  const article = ARTICLES.find(a => a.id === id);

  if (!article) {
    return `
      <div class="container not-found">
        <h2>記事が見つかりませんでした</h2>
        <p>URLをご確認ください。</p>
        <a href="#/writing">記事一覧に戻る →</a>
      </div>`;
  }

  return `
    <div class="detail-wrap">
      <div class="detail-inner">
        <div class="detail-main">

          <nav class="breadcrumb" aria-label="パンくずリスト">
            <a href="#/">Top</a>
            <span class="bc-sep">/</span>
            <a href="#/writing">Writing</a>
            <span class="bc-sep">/</span>
            <span aria-current="page">${esc(article.title)}</span>
          </nav>

          <article>
            <header class="article-hd">
              <p class="article-hd-cat">${esc(article.category)}</p>
              <h1 class="article-hd-title">${esc(article.title)}</h1>
              <div class="article-hd-info">
                <span>${formatDate(article.date)}</span>
                <span>${calcReadTime(article.content)} min read</span>
              </div>
            </header>

            <div class="article-body">
              ${article.content}
            </div>

            <p class="article-note">${esc(article.note || '※ 本記事はWebライティングのポートフォリオ用に制作したサンプル記事です。')}</p>
          </article>

          <a class="back-link" href="#/writing">← Writing</a>

        </div>
      </div>
    </div>`;
}

/* ===================================================
   Page: Contact
=================================================== */
function renderContact() {
  return `
    <section class="contact-section">
      <div class="container">
        <div class="contact-inner">
          <div class="contact-hd reveal">
            <h1>お問い合わせ</h1>
            <p>ご依頼・ご相談は、クラウドワークスのメッセージ機能または下記フォームからお気軽にどうぞ。</p>
            <p>内容を確認次第、できる限り早めにご返信いたします。</p>
          </div>

          <form id="contactForm" novalidate class="reveal">
            <div class="form-group">
              <label class="form-label" for="cf-name">お名前<span class="req">必須</span></label>
              <input id="cf-name" type="text" class="form-input"
                     placeholder="山田 太郎" required autocomplete="name">
            </div>

            <div class="form-group">
              <label class="form-label" for="cf-email">メールアドレス<span class="req">必須</span></label>
              <input id="cf-email" type="email" class="form-input"
                     placeholder="example@email.com" required autocomplete="email">
            </div>

            <div class="form-group">
              <label class="form-label" for="cf-type">お問い合わせ種別</label>
              <select id="cf-type" class="form-select">
                <option value="">選択してください</option>
                <option>記事制作のご依頼</option>
                <option>シナリオ・脚本のご依頼</option>
                <option>ライティングのご相談</option>
                <option>お見積もりのご依頼</option>
                <option>その他</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="cf-message">メッセージ<span class="req">必須</span></label>
              <textarea id="cf-message" class="form-textarea" required
                        placeholder="ご依頼の内容、ジャンル、文字数、納期などをお聞かせください。"></textarea>
            </div>

            <div class="form-notice">
              <p>クラウドワークスを通じてのご依頼も歓迎しています。お急ぎの方は<a href="${esc(CROWDWORKS_URL)}" target="_blank" rel="noopener noreferrer">クラウドワークス</a>からご連絡いただくとスムーズです。</p>
              <p class="form-notice-sub">※ このフォームはデモ表示です。実際の送信には <a href="https://formspree.io" target="_blank" rel="noopener noreferrer">Formspree</a> 等の設定が必要です。</p>
            </div>

            <button type="submit" class="form-submit" id="submitBtn">
              送信する
            </button>
          </form>
        </div>
      </div>
    </section>`;
}

/* ===================================================
   Page: 404
=================================================== */
function render404() {
  return `
    <div class="container not-found">
      <h2>Page Not Found</h2>
      <p>URLをご確認ください。</p>
      <a href="#/">トップページに戻る →</a>
    </div>`;
}

/* ===================================================
   Post-render handlers
=================================================== */
function attachHandlers(route) {
  /* keyboard support for article cards */
  document.querySelectorAll('.article-card').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });

  /* category filter (writing page) */
  if (route === '/writing' || route === '/articles') {
    const grid = document.getElementById('articlesGrid');
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        let idx = 0;
        grid.querySelectorAll('.article-card').forEach(card => {
          const visible = filter === 'all' || card.dataset.category === filter;
          card.style.display = visible ? '' : 'none';
          if (visible) {
            card.style.animation = 'none';
            card.offsetHeight;
            card.style.animation = `fadeUp .35s ${idx * 0.05}s var(--ease-slow) both`;
            idx++;
          }
        });
      });
    });
  }

  /* contact form */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const btn = document.getElementById('submitBtn');
      const orig = btn.textContent;
      btn.textContent = '送信しました';
      btn.disabled = true;
      btn.style.background = '#3a5a3e';
      btn.style.borderColor = '#3a5a3e';
      setTimeout(() => {
        btn.textContent = orig;
        btn.disabled = false;
        btn.style.background = '';
        btn.style.borderColor = '';
        form.reset();
      }, 3500);
    });
  }
}

/* ===================================================
   Header scroll
=================================================== */
window.addEventListener('scroll', () => {
  document.getElementById('header')
    .classList.toggle('scrolled', window.scrollY > 6);
}, { passive: true });

/* ===================================================
   Mobile nav toggle
=================================================== */
document.getElementById('navToggle').addEventListener('click', function () {
  const isOpen = document.getElementById('navList').classList.toggle('open');
  this.classList.toggle('open', isOpen);
  this.setAttribute('aria-expanded', String(isOpen));
});

/* ===================================================
   Init
=================================================== */
window.addEventListener('hashchange', router);
window.addEventListener('load', router);
