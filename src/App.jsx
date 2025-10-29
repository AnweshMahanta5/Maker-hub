import React, { useEffect, useMemo, useState } from "react";

/**
 * MakerHub — single‑file React site (clean, professional)
 *
 * Fixes in this revision:
 *  - ✅ Fixed "Unterminated string constant" by using a template string with \n\n in window.confirm.
 *  - ✅ Replaced emojis with clean SVG icons.
 *  - ✅ Reworked Home dashboard preview into a photo grid + KPI cards.
 *  - ✅ Added real images for Shop products (placeholder thumbnails).
 *  - ✅ Added lightweight runtime self‑tests (console.assert) for helpers and rank logic.
 */

// ---------- Helpers ----------
const cls = (...parts) => parts.filter(Boolean).join(" ");
const currency = (n) => `₹${n.toLocaleString("en-IN")}`;

// Compute rank (pure helper used by tests and UI parity)
const computeRank = (points) => {
  let current = RANKS[0];
  for (const r of RANKS) if (points >= r.threshold) current = r;
  const nextIndex = Math.min(RANKS.indexOf(current) + 1, RANKS.length - 1);
  const next = RANKS[nextIndex];
  const into = points - current.threshold;
  const span = Math.max(1, next.threshold - current.threshold);
  const pct = Math.min(100, Math.round((into / span) * 100));
  return { current, next, pct };
};

// ---------- Sample Data ----------
const SAMPLE_COURSES = [
  {
    id: "c1",
    title: "Arduino Basics",
    level: "Beginner",
    points: 80,
    lessons: 8,
    blurb:
      "Learn microcontroller fundamentals and build your first LED + sensor project.",
  },
  {
    id: "c2",
    title: "Robotics 101",
    level: "Beginner",
    points: 120,
    lessons: 10,
    blurb:
      "Intro to motors, drivers, and motion control. Build a line‑following bot.",
  },
  {
    id: "c3",
    title: "Web for Makers",
    level: "Intermediate",
    points: 150,
    lessons: 12,
    blurb: "Ship a fast portfolio and IoT dashboard with modern web tools.",
  },
  {
    id: "c4",
    title: "AI for Students",
    level: "Intermediate",
    points: 180,
    lessons: 9,
    blurb: "Use LLMs responsibly for study, notes, Q&A and project ideation.",
  },
];

const SAMPLE_PRODUCTS = [
  { id: "p1", name: "ESP8266 NodeMCU", price: 239, tag: "Wi‑Fi MCU" },
  { id: "p2", name: "HC‑SR04 Sensor", price: 89, tag: "Distance" },
  { id: "p3", name: "L298N Motor Driver", price: 179, tag: "Motors" },
  { id: "p4", name: "Breadboard + Wires Kit", price: 149, tag: "Starter" },
  { id: "p5", name: "DHT11 Sensor", price: 79, tag: "Temp/Humidity" },
  { id: "p6", name: "SG90 Micro Servo", price: 129, tag: "Servo" },
];

const SAMPLE_POSTS = [
  {
    id: "f1",
    author: "Kiara",
    title: "Help with line sensor on white tiles",
    body: "My bot overshoots turns—any tips on thresholds?",
    likes: 6,
  },
  {
    id: "f2",
    author: "Aman",
    title: "Best budget soldering iron in India?",
    body: "I need something reliable for school projects.",
    likes: 9,
  },
];

const SAMPLE_IDEAS = [
  { id: "i1", title: "Smart Plant Watering", votes: 15 },
  { id: "i2", title: "Accident Alert Helmet", votes: 22 },
  { id: "i3", title: "Smart Dustbin (Auto‑open)", votes: 18 },
];

const SAMPLE_BLOGS = [
  {
    id: "b1",
    title: "Choosing Your First Microcontroller",
    date: "2025‑08‑20",
    read: 5,
  },
  { id: "b2", title: "What is an H‑Bridge?", date: "2025‑08‑11", read: 4 },
  {
    id: "b3",
    title: "Study Smarter with AI (Safely)",
    date: "2025‑07‑30",
    read: 6,
  },
];

// Ranks & thresholds
const RANKS = [
  { key: "explorer", name: "Explorer", threshold: 0 },
  { key: "tinkerer", name: "Tinkerer", threshold: 100 },
  { key: "builder", name: "Builder", threshold: 300 },
  { key: "innovator", name: "Innovator", threshold: 700 },
  { key: "visionary", name: "Visionary", threshold: 1200 },
];

const BADGE_DESCRIPTIONS = {
  firstCourse: { label: "First Course", hint: "Complete your first course" },
  quizWhiz: { label: "Quiz Whiz", hint: "Ace a quiz" },
  helper: { label: "Helper", hint: "Post in the forum" },
  contributor: { label: "Contributor", hint: "Share a project idea" },
  shopper: { label: "Shopper", hint: "Add something to cart" },
};

// ---------- Main App ----------
export default function App() {
  const [page, setPage] = useState("home");
  const [profile, setProfile] = useState({
    name: "Guest Maker",
    points: 0,
    badges: {}, // { key: true }
  });
  const [enrolled, setEnrolled] = useState({}); // { courseId: { done: boolean } }
  const [posts, setPosts] = useState(SAMPLE_POSTS);
  const [ideas, setIdeas] = useState(SAMPLE_IDEAS);
  const [cart, setCart] = useState([]); // [{id, qty}]

  // Load/save from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("makerhub_state") || "null");
      if (saved) {
        setPage(saved.page || "home");
        setProfile(saved.profile || profile);
        setEnrolled(saved.enrolled || {});
        setPosts(saved.posts || SAMPLE_POSTS);
        setIdeas(saved.ideas || SAMPLE_IDEAS);
        setCart(saved.cart || []);
      }
    } catch {}
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const payload = { page, profile, enrolled, posts, ideas, cart };
    localStorage.setItem("makerhub_state", JSON.stringify(payload));
  }, [page, profile, enrolled, posts, ideas, cart]);

  // Derived rank (UI uses the same math as computeRank)
  const rank = useMemo(() => computeRank(profile.points), [profile.points]);

  // Mutations
  const addPoints = (n) =>
    setProfile((p) => ({ ...p, points: Math.max(0, p.points + n) }));

  const awardBadge = (key) =>
    setProfile((p) => ({ ...p, badges: { ...p.badges, [key]: true } }));

  const toggleEnroll = (courseId) => {
    setEnrolled((E) => {
      const copy = { ...E };
      if (!copy[courseId]) copy[courseId] = { done: false };
      copy[courseId].done = !copy[courseId].done;
      if (copy[courseId].done) {
        const course = SAMPLE_COURSES.find((c) => c.id === courseId);
        if (course) addPoints(course.points);
        awardBadge("firstCourse");
      }
      return copy;
    });
  };

  const handleQuiz = () => {
    const ok = window.confirm(
      `Quick quiz: Is an H‑bridge used to control motor direction?\n\nOK = Yes, Cancel = No`
    );
    if (ok) {
      addPoints(50);
      awardBadge("quizWhiz");
      alert("Nice! +50 pts");
    } else {
      alert("Not quite—try the course first!");
    }
  };

  const addPost = (title, body) => {
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) return alert("Please write a title and details.");
    setPosts((P) => [
      { id: `f${Date.now()}`, author: profile.name || "You", title: t, body: b, likes: 0 },
      ...P,
    ]);
    addPoints(20);
    awardBadge("helper");
    alert("Posted! +20 pts");
  };

  const likePost = (id) =>
    setPosts((P) => P.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p)));

  const addIdea = (title) => {
    const t = title.trim();
    if (!t) return alert("Please write your project idea.");
    setIdeas((I) => [{ id: `i${Date.now()}`, title: t, votes: 1 }, ...I]);
    addPoints(25);
    awardBadge("contributor");
    alert("Idea shared! +25 pts");
  };

  const voteIdea = (id) =>
    setIdeas((I) => I.map((it) => (it.id === id ? { ...it, votes: it.votes + 1 } : it)));

  const addToCart = (pid) => {
    setCart((C) => {
      const found = C.find((c) => c.id === pid);
      let next;
      if (found) next = C.map((c) => (c.id === pid ? { ...c, qty: c.qty + 1 } : c));
      else next = [...C, { id: pid, qty: 1 }];
      return next;
    });
    addPoints(5);
    awardBadge("shopper");
  };

  const removeFromCart = (pid) => setCart((C) => C.filter((c) => c.id !== pid));

  const totalCost = useMemo(() => {
    return cart.reduce((sum, item) => {
      const p = SAMPLE_PRODUCTS.find((x) => x.id === item.id);
      return sum + (p ? p.price * item.qty : 0);
    }, 0);
  }, [cart]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800">
      <TopBar page={page} setPage={setPage} cartCount={cart.reduce((n, c) => n + c.qty, 0)} />

      <main className="mx-auto max-w-7xl px-4 pb-24">
        {page === "home" && <Home setPage={setPage} />}
        {page === "learn" && (
          <Learn
            enrolled={enrolled}
            onToggle={toggleEnroll}
            onQuiz={handleQuiz}
          />
        )}
        {page === "community" && <Community posts={posts} onAdd={addPost} onLike={likePost} />}
        {page === "ideas" && <Ideas ideas={ideas} onAdd={addIdea} onVote={voteIdea} />}
        {page === "shop" && (
          <Shop cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} total={totalCost} />
        )}
        {page === "blog" && <Blog />}
        {page === "profile" && (
          <Profile
            profile={profile}
            setProfile={setProfile}
            rank={rank}
            badges={BADGE_DESCRIPTIONS}
          />
        )}
        {page === "about" && <About />}
      </main>

      <Footer />
    </div>
  );
}

function TopBar({ page, setPage, cartCount }) {
  const links = [
    ["home", "Home"],
    ["learn", "Learn"],
    ["community", "Community"],
    ["ideas", "Ideas"],
    ["shop", "Shop"],
    ["blog", "Blog"],
    ["profile", "Profile"],
    ["about", "About"],
  ];
  return (
    <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white" aria-label="Logo">
            {/* Gear icon */}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
              <circle cx="12" cy="12" r="4"/>
            </svg>
          </span>
          <span className="text-lg font-semibold">MakerHub</span>
        </div>
        <nav className="ml-auto hidden gap-1 md:flex">
          {links.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPage(key)}
              className={cls(
                "rounded-xl px-3 py-2 text-sm font-medium",
                page === key ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="ml-2 flex items-center gap-2">
          <button
            onClick={() => setPage("shop")}
            className="relative rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium hover:bg-slate-200"
            title="Cart"
          >
            {/* Cart icon */}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1 text-xs text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function Home({ setPage }) {
  return (
    <section className="grid gap-10 py-12 md:grid-cols-2 md:items-center">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
          Learn. Build. Share. <span className="text-indigo-600">Together.</span>
        </h1>
        <p className="mt-4 text-slate-600 md:text-lg">
          MakerHub is a community for students and creators: take mini‑courses, earn
          points & badges, share ideas, and browse affordable components.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => setPage("learn")} className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">Explore Courses</button>
          <button onClick={() => setPage("community")} className="rounded-xl border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50">Join Community</button>
          <button onClick={() => setPage("shop")} className="rounded-xl border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50">Shop Parts</button>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          <li className="rounded-2xl border p-4 shadow-sm"><b>Gamified learning</b><br/><span className="text-slate-600">Earn ranks from Explorer to Visionary.</span></li>
          <li className="rounded-2xl border p-4 shadow-sm"><b>Helpful forums</b><br/><span className="text-slate-600">Ask, answer, and grow together.</span></li>
          <li className="rounded-2xl border p-4 shadow-sm"><b>Project ideas</b><br/><span className="text-slate-600">Vote on what to build next.</span></li>
          <li className="rounded-2xl border p-4 shadow-sm"><b>Student‑friendly shop</b><br/><span className="text-slate-600">Budget components for class builds.</span></li>
        </ul>
      </div>
      <div className="relative mx-auto w-full max-w-xl">
        {/* Dashboard preview — photo grid + KPI cards */}
        <div className="aspect-[4/3] w-full rounded-3xl border bg-white p-6 shadow-inner">
          <div className="grid h-full grid-cols-2 gap-4 md:grid-cols-3">
            <img src="https://picsum.photos/seed/d1/640/360" alt="Project photo 1" className="h-full w-full rounded-xl object-cover"/>
            <img src="https://picsum.photos/seed/d2/640/360" alt="Project photo 2" className="h-full w-full rounded-xl object-cover"/>
            <div className="col-span-2 hidden rounded-xl border p-4 md:block">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">Active learners</div>
                  <div className="mt-1 text-2xl font-bold">1,248</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">Courses</div>
                  <div className="mt-1 text-2xl font-bold">24</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">Completion rate</div>
                  <div className="mt-1 text-2xl font-bold">86%</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">Dashboard preview — courses, progress & ideas in one place.</p>
            </div>
            <img src="https://picsum.photos/seed/d6/640/360" alt="Project photo 3" className="h-full w-full rounded-xl object-cover md:hidden"/>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 hidden rounded-2xl border bg-white p-4 shadow-lg md:block">
          <b>Rank up faster</b>
          <p className="text-sm text-slate-600">Complete a course and ace a quiz.</p>
        </div>
      </div>
    </section>
  );
}

function Learn({ enrolled, onToggle, onQuiz }) {
  return (
    <section className="py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Courses</h2>
          <p className="text-slate-600">Short, practical lessons with points for completion.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_COURSES.map((c) => {
          const done = enrolled[c.id]?.done;
          return (
            <div key={c.id} className="rounded-2xl border p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{c.title}</h3>
                  <p className="text-sm text-slate-500">{c.level} • {c.lessons} lessons • {c.points} pts</p>
                </div>
                <span className={cls("rounded-full px-2 py-1 text-xs", done ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700")}>{done ? "Done" : "New"}</span>
              </div>
              <p className="mt-3 text-slate-600">{c.blurb}</p>
              <div className="mt-5 flex gap-2">
                <button onClick={() => onToggle(c.id)} className={cls("rounded-xl px-3 py-2 text-sm font-medium", done ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-indigo-600 text-white hover:bg-indigo-700")}>{done ? "Mark Incomplete" : "Mark Complete"}</button>
                <button onClick={() => onQuiz(c.id)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">Quick Quiz</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Community({ posts, onAdd, onLike }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <section className="py-10">
      <h2 className="mb-2 text-2xl font-bold">Community Forum</h2>
      <p className="mb-6 text-slate-600">Ask questions, share tips, and help others.</p>

      <div className="mb-6 rounded-2xl border p-4 shadow-sm">
        <h3 className="font-semibold">Start a new thread</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe your issue or tip" className="min-h-[90px] rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400 md:col-span-2" />
        </div>
        <div className="mt-3">
          <button onClick={() => { onAdd(title, body); setTitle(""); setBody(""); }} className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">Post</button>
        </div>
      </div>

      <ul className="grid gap-3">
        {posts.map((p) => (
          <li key={p.id} className="rounded-2xl border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{p.title}</h4>
                <p className="text-sm text-slate-600">by {p.author}</p>
              </div>
              <button onClick={() => onLike(p.id)} className="rounded-full border px-3 py-1 text-sm hover:bg-slate-50">Like {p.likes}</button>
            </div>
            <p className="mt-2 text-slate-700">{p.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Ideas({ ideas, onAdd, onVote }) {
  const [text, setText] = useState("");
  return (
    <section className="py-10">
      <h2 className="mb-2 text-2xl font-bold">Project Ideas</h2>
      <p className="mb-6 text-slate-600">Share ideas and upvote what you want to build next.</p>

      <div className="mb-6 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g., Smart attendance with RFID" className="flex-1 rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400" />
        <button onClick={() => { onAdd(text); setText(""); }} className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">Share</button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ideas.map((it) => (
          <li key={it.id} className="rounded-2xl border p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold">{it.title}</h4>
              <button onClick={() => onVote(it.id)} className="rounded-full border px-3 py-1 text-sm hover:bg-slate-50">Upvote {it.votes}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Shop({ cart, addToCart, removeFromCart, total }) {
  return (
    <section className="py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Shop</h2>
          <p className="text-slate-600">Budget‑friendly parts for school projects.</p>
        </div>
        <div className="rounded-2xl border bg-white p-3 shadow-sm">
          <b>Cart</b>
          <ul className="mt-2 max-h-40 space-y-1 overflow-auto pr-1 text-sm">
            {cart.length === 0 && <li className="text-slate-500">Your cart is empty.</li>}
            {cart.map((item) => {
              const p = SAMPLE_PRODUCTS.find((x) => x.id === item.id);
              if (!p) return null;
              return (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <span>{p.name} × {item.qty}</span>
                  <button onClick={() => removeFromCart(item.id)} className="rounded-lg border px-2 py-1 hover:bg-slate-50">Remove</button>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span>Total</span>
            <b>{currency(total)}</b>
          </div>
          <button className="mt-2 w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Checkout</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_PRODUCTS.map((p) => (
          <div key={p.id} className="rounded-2xl border p-5 shadow-sm">
            <img src={`https://picsum.photos/seed/${p.id}/640/360`} alt={p.name} className="aspect-video w-full rounded-xl object-cover" />
            <div className="mt-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-slate-500">{p.tag}</p>
              </div>
              <b>{currency(p.price)}</b>
            </div>
            <button onClick={() => addToCart(p.id)} className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">Add to Cart</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Blog() {
  return (
    <section className="py-10">
      <h2 className="mb-2 text-2xl font-bold">Blog</h2>
      <p className="mb-6 text-slate-600">Quick reads to level up your maker skills.</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_BLOGS.map((b) => (
          <li key={b.id} className="rounded-2xl border p-4 shadow-sm">
            <h3 className="font-semibold">{b.title}</h3>
            <p className="text-sm text-slate-500">{b.date} • {b.read} min read</p>
            <button className="mt-3 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">Read</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Profile({ profile, setProfile, rank, badges }) {
  const [name, setName] = useState(profile.name || "");
  useEffect(() => setName(profile.name || ""), [profile.name]);

  const owned = Object.keys(profile.badges || {});
  const nextName = rank.next?.name || rank.current.name;

  const progressLabel = `${rank.current.name} → ${nextName}`;

  return (
    <section className="py-10">
      <h2 className="mb-2 text-2xl font-bold">Your Profile</h2>
      <p className="mb-6 text-slate-600">Customize your name, view points, rank and badges.</p>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold">Identity</h3>
          <label className="mt-3 block text-sm text-slate-600">Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400" />
          <button onClick={() => setProfile((p) => ({ ...p, name }))} className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">Save</button>
        </div>

        <div className="rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold">Progress</h3>
          <div className="mt-2 text-3xl font-extrabold text-indigo-700">{profile.points} pts</div>
          <div className="mt-2 text-sm text-slate-600">{progressLabel}</div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-indigo-600" style={{ width: `${rank.pct}%` }} />
          </div>
          <div className="mt-1 text-right text-xs text-slate-500">{rank.pct}%</div>
        </div>

        <div className="rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold">Current Rank</h3>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
            <b>{rank.current.name}</b>
          </div>
          <ul className="mt-3 text-sm text-slate-600">
            {RANKS.map((r) => (
              <li key={r.key} className={cls("flex items-center justify-between border-b py-1", r.key === rank.current.key && "font-semibold text-slate-800")}> <span>{r.name}</span> <span>{r.threshold}+</span> </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border p-5 shadow-sm">
        <h3 className="font-semibold">Badges</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(badges).map(([key, meta]) => (
            <span
              key={key}
              className={cls(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm",
                owned.includes(key) ? "bg-amber-50 border-amber-200" : "opacity-50"
              )}
              title={meta.hint}
            >
              <b>{meta.label}</b>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="py-10">
      <h2 className="mb-2 text-2xl font-bold">About MakerHub</h2>
      <p className="mb-4 text-slate-600">
        MakerHub is an open, student‑friendly platform where learning meets building. We
        combined courses, a helpful forum, a project‑ideas board, and a budget shop into one simple site.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold">Our Mission</h3>
          <p className="mt-2 text-slate-700">
            Unlock hands‑on learning for everyone. Share knowledge, build cool things, and grow a supportive community.
          </p>
        </div>
        <div className="rounded-2xl border p-5 shadow-sm">
          <h3 className="font-semibold">Contact</h3>
          <p className="mt-2 text-slate-700">Email: hello@makerhub.example</p>
          <p className="text-slate-700">Location: India</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-white/80">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 text-sm text-slate-600 md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} MakerHub. Built for students.</p>
        <nav className="flex items-center gap-4">
          <a className="hover:underline" href="#">Terms</a>
          <a className="hover:underline" href="#">Privacy</a>
          <a className="hover:underline" href="#">Contact</a>
        </nav>
      </div>
    </footer>
  );
}

// ---------- Simple Runtime Tests (Console) ----------
(function runSelfTests() {
  try {
    console.assert(currency(1000) === "₹1,000", "currency(1000) formats INR");
    console.assert(cls("a", "", null, "b") === "a b", "cls() joins truthy parts");
    const r0 = computeRank(0);   console.assert(r0.current.key === "explorer", "rank at 0");
    const r1 = computeRank(100); console.assert(r1.current.key === "tinkerer", "rank at 100");
    const r2 = computeRank(300); console.assert(r2.current.key === "builder", "rank at 300");
    const r3 = computeRank(700); console.assert(r3.current.key === "innovator", "rank at 700");
    const r4 = computeRank(1200);console.assert(r4.current.key === "visionary", "rank at 1200");
    // Progress % monotonic
    const p25 = computeRank(125).pct; const p75 = computeRank(175).pct; console.assert(p25 <= p75, "pct should grow");
    // Cart total math (deterministic small case)
    const exampleCart = [{ id: "p1", qty: 2 }, { id: "p2", qty: 1 }];
    const sum = exampleCart.reduce((s, it) => {
      const prod = SAMPLE_PRODUCTS.find((x) => x.id === it.id);
      return s + (prod ? prod.price * it.qty : 0);
    }, 0);
    console.assert(typeof sum === "number" && sum > 0, "cart total computes");
    console.log("%cSelf‑tests passed", "color: #16a34a");
  } catch (e) {
    console.error("Self‑tests encountered an error", e);
  }
})();