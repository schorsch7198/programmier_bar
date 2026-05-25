Me: personal question: i learned software development at WIFI Salzburg and now 
   im in application phase since then... now i know some of professionals    
  the incentivizing effects of vibe coding with claude code, codex etc. ...  
  now im a pretty worried, how i should have an opportunity to get a job as  
  software developer, because i already do some things which makes the       
  claude code for instance better and as amateur in this profession have to  
  read and let explain to what the chatbot has coded (which mostly works     
  well)... what would wo give me a particular advice, how i should now       
  behave as software developer without work experience, how i can profit in  
  front of recruiters. should i do further vibe coding (which is simply just 
   faster and more productive) and just try to understand what was coded or  
  what should i do? i am pretty lost at the moment because the progress in   
  IT in general is going so fast i cannot keep up this speed... are ther     
  professionals' statements, what they would advice to youngsters like me.   
  search, analyze, give tips - anything possible u can do for this question: 
   what should i do now and how? 


Claude: This is a real worry, and the data backs it up — but the situation is more
  nuanced than "AI killed the junior path." Here's what I'm seeing from
  current professional advice (sources at the end):

  The honest read on the market

  You're not imagining it. Stanford's AI Index 2026 shows software dev jobs
  for 22–25 year-olds dropped ~20% since 2022; entry-level postings are down
  ~28% from their peak. But total developer employment is roughly flat — the
  squeeze is concentrated at the bottom of the ladder, not across the field.
  CNN's reporting in April 2026 called the broader "death of software jobs"
  overblown.

  What actually changed: the bar for "junior" moved. What a 2022 junior did
  in their first year — boilerplate, unit tests, small CRUD features — Claude
   Code or Copilot now does in minutes. So employers are no longer paying for
   that. They're paying for someone who can direct the AI, read its output
  critically, catch its mistakes, and own the result.

  The trap you correctly sensed

  Multiple senior devs are now openly calling pure vibe coding "probably the 
  worst thing you can do for your career right now" as a junior. The
  mechanism is exactly what you described in your question: the AI produces
  code that mostly works, you read it without deeply understanding it, and
  you don't build the intuition that makes you valuable. Karpathy — who
  coined "vibe coding" — explicitly distinguishes it from how he writes code
  he actually cares about, where he treats the LLM like an "over-eager junior
   intern" and is "slow, defensive, careful, paranoid, always taking inline
  learning opportunities."

  The cruel irony multiple senior engineers have noted: vibe coding works 
  best for those who don't need it. Seniors can guide AI well because they
  already understand the domain. You can't shortcut your way to that — but
  you can shortcut your way past learning it, which is the actual danger.

  What to actually do — in priority order

  1. Switch modes deliberately. Vibe-code your throwaway experiments — that's
   fine. But for anything you'd put on a CV or ship to a user, force yourself
   into "AI-assisted engineering" mode: read every line, ask the AI why it
  made each choice, rewrite the parts you don't understand from scratch
  without help. The work this project gave you (responsive layout, modal
  patterns, sort collators) is excellent material for this — you've been
  doing it.
  2. Build 2–3 deeply finished projects, not 12 half-finished ones. A live
  URL with real users, a monitored uptime, an incident postmortem in the
  README — this signals 2026-relevant judgment far more than a list of
  tutorial clones. Hiring managers consistently say: be able to talk about
  each project in depth for 20 minutes.
  3. Get one or two merged OSS PRs. Multiple sources call this the single
  highest-signal move available to a junior. You navigate someone else's
  codebase, follow their conventions, accept review feedback, and ship work
  that fits a system you didn't design — exactly the day-one skills. Start
  small: a doc fix, a clear bug repro, a tiny test improvement.
  4. Pick a domain. "Junior + specialty" beats "generic junior" in 2026. In
  DACH especially, regulated verticals are hiring: fintech, healthtech,
  legaltech, energy/climate, and manufacturing where AI-tooling integrates
  into existing enterprise software. AI roles in Germany are up ~35% YoY
  since 2023; Vienna's market is reportedly ~37% entry-level openings.
  Austrian/German employers still want people who understand their compliance
   environment — AI can't certify that, only humans can.
  5. Build the moat AI can't cross. Write about what you're building. A short
   technical blog post per week (in English and German), one local meetup
  talk, one Stack Overflow answer that actually helps someone. Communication,
   judgment, and being someone a team wants to work with — these are the
  parts of the job that don't compress under AI. Multiple sources stop
  calling these "soft skills" and start calling them "the moat."
  6. Practice without AI, deliberately. Once a week, build something small
  with the AI off. Debug a real problem by reading logs and stepping through
  code. Read source code of a library you depend on. Pair-program with
  another human. This is how you build the intuition that lets you direct AI
  well later.

  For your specific situation

  You're in Salzburg, finished at WIFI, in the application phase, and you've
  been actively using Claude Code on a real full-stack project (.NET +
  vanilla-JS SPA + PostgreSQL + Docker). That's already a much better signal
  than most fresh applicants — most candidates can't talk credibly about a
  deployed multi-service system. Make this project your portfolio
  centerpiece. Deploy it somewhere public, write a README that explains the
  architecture decisions (data-access pattern without an ORM, hash routing,
  anonymous-cart sync, theming — these are real choices you can defend),
  record a 5-minute Loom walking through it. When a recruiter asks "what did
  you build?", this is your answer.

  For DACH-specific application tooling: the search surfaced "Atlas Apply" as
   a quality-first option respected in DACH markets — they expect formal
  cover letters and clean structure, so AI-generated mass applications burn
  out fast. Better to send 5 tailored applications a week than 50 generic
  ones.

  The single sentence I'd remember

  The hireable skill in 2026 is not "I can use Claude" — every applicant can.
   It's "I can use Claude and tell you confidently when it's wrong, and why."
   You build that by reading every line it gives you until you no longer need
   to.

  You're not lost. You're early enough to adjust the mode you're working in,
  and your worry is itself a strong signal — the people who should be worried
   are the ones who aren't.
  
  ---
  Sources:
  
  - Stanford AI Index 2026: Junior dev jobs dropped 20%
  (https://findskill.ai/blog/stanford-ai-index-junior-dev-hiring-drop/)
  - How AI Vibe Coding Is Destroying Junior Developers' Careers — Final Round
   AI (https://www.finalroundai.com/blog/ai-vibe-coding-destroying-junior-dev
  elopers-careers)
  - Andrej Karpathy on AI-assisted vs. vibe coding (X / Twitter)
  (https://x.com/karpathy/status/1915581920022585597)
  - Andrej Karpathy on Vibe Coding — Questera
  (https://www.questera.ai/blogs/andrej-karpathy-on-vibe-coding)
  - Vibe coding is not the same as AI-Assisted engineering — Addy Osmani
  (https://medium.com/@addyosmani/vibe-coding-is-not-the-same-as-ai-assisted-
  engineering-3f81088d5b98)
  - Junior Developers in the Age of AI: 2026 Guide — CodeConductor
  (https://codeconductor.ai/blog/future-of-junior-developers-ai/)
  - AI is Erasing Junior Coders — How to Survive the 2026 Tech Market (https:
  //www.solidaitech.com/2026/04/junior-developer-jobs-ai-survival-guide.html)
  - The demise of software engineering jobs has been greatly exaggerated —
  CNN (https://www.cnn.com/2026/04/08/tech/ai-software-developer-jobs)
  - Software Engineering Job Market 2026 — Final Round AI
  (https://www.finalroundai.com/blog/software-engineering-job-market-2026)
  - 3 Portfolio Projects That Actually Impress in 2026
  (https://arslandg.substack.com/p/3-portfolio-projects-that-actually)
  - Best AI Tools for Applying to Jobs in Europe: DACH Playbook — Sprad
  (https://sprad.io/blog/best-ai-tools-for-applying-to-jobs-in-europe-a-safe-
  dach-friendly-playbook)
  - The AI Job Market in Germany 2026 — TSA Bildung
  (https://www.tsa-bildung.de/en/blog/the-ai-job-market-in-germany-skills-in-
  demand-for-2026-and-beyond)
  - Top 10 Industries Hiring AI Talent in Austria — Nucamp
  (https://www.nucamp.co/blog/top-10-industries-hiring-ai-talent-in-austria-b
  eyond-big-tech-in-2026)
  - Stack Overflow: A new worst coder has entered the chat — vibe coding
  without code knowledge (https://stackoverflow.blog/2026/01/02/a-new-worst-c
  oder-has-entered-the-chat-vibe-coding-without-code-knowledge/)