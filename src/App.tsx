import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Coffee,
  Ellipsis,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import "./App.css";

type MealName = "Breakfast" | "Lunch" | "Dinner" | "Snacks";
type RhythmRange = "7" | "month" | "custom";
type MealPart = {
  name: string;
  calories: number;
  protein: number;
  fiber: number;
};
type Entry = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fiber: number;
  meal: MealName;
  detail: string;
  parts: MealPart[];
};
type Profile = {
  displayName: string;
  maintenanceCalories: number;
  proteinGoal: number;
  fiberGoal: number;
};
type DayTotal = {
  date: string;
  totalCalories: number;
  protein: number;
  fiber: number;
};

const mealIcons: Record<MealName, typeof Coffee> = {
  Breakfast: Coffee,
  Lunch: Utensils,
  Dinner: Flame,
  Snacks: Sparkles,
};
const meals: MealName[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const todayKey = dateKey(new Date());
const defaultRangeStart = () => {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return dateKey(date);
};
const viewFromPath = (path: string) =>
  path === "/daily-log" ? "Daily log" : path === "/progress" ? "Progress" : "Overview";
const pathFromView = (view: string) =>
  view === "Daily log" ? "/daily-log" : view === "Progress" ? "/progress" : "/";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(
    () =>
      onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      }),
    [],
  );

  if (authLoading)
    return (
      <div className="auth-loading">
        <span className="brand-mark">
          <Activity size={17} />
        </span>
        <p>Loading your workspace...</p>
      </div>
    );
  if (!user) return <AuthScreen onError={setAuthError} error={authError} />;
  return <Tracker user={user} />;
}

function AuthScreen({
  error,
  onError,
}: {
  error: string;
  onError: (message: string) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    onError("");
    try {
      const credential =
        mode === "signin"
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password);
      if (mode === "signup") {
        await updateProfile(credential.user, {
          displayName: name.trim() || email.split("@")[0],
        });
        await setDoc(
          doc(db, "users", credential.user.uid),
          {
            displayName: name.trim() || email.split("@")[0],
            email,
            maintenanceCalories: 2200,
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
    } catch (caught) {
      onError(firebaseMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-intro">
        <div className="brand">
          <span className="brand-mark">
            <Activity size={17} />
          </span>
          <span>
            nourish<span className="brand-dot">.</span>
          </span>
        </div>
        <div className="auth-copy">
          <p className="eyebrow">A quieter way to track</p>
          <h1>
            Your everyday rhythm, made visible<span className="period">.</span>
          </h1>
          <p>
            Log what you eat, understand your patterns, and make progress that
            feels like yours.
          </p>
        </div>
        <div className="auth-rule">
          <span />
          Personal nutrition, without the noise.
        </div>
      </div>
      <div className="auth-card">
        <div className="auth-card-heading">
          <p className="eyebrow">
            {mode === "signin" ? "Welcome back" : "Start your account"}
          </p>
          <h2>
            {mode === "signin"
              ? "Sign in to nourish"
              : "Create your nourish account"}
          </h2>
          <p>
            {mode === "signin"
              ? "Your personal dashboard is waiting."
              : "Your data will be private to your account."}
          </p>
        </div>
        <form onSubmit={submit}>
          {mode === "signup" && (
            <label>
              Your name
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jamie Davis"
              />
            </label>
          )}
          <label>
            Email address
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="submit-button" disabled={busy} type="submit">
            {busy
              ? "Please wait..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
            <ArrowUpRight size={16} />
          </button>
        </form>
        <button
          className="mode-button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            onError("");
          }}
        >
          {mode === "signin"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

function Tracker({ user }: { user: User }) {
  const [activeView, setActiveView] = useState(() => viewFromPath(window.location.pathname));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [calorieRange, setCalorieRange] = useState<RhythmRange>("7");
  const [proteinRange, setProteinRange] = useState<RhythmRange>("7");
  const [fiberRange, setFiberRange] = useState<RhythmRange>("7");
  const [calorieCustomStart, setCalorieCustomStart] = useState(defaultRangeStart);
  const [calorieCustomEnd, setCalorieCustomEnd] = useState(todayKey);
  const [proteinCustomStart, setProteinCustomStart] = useState(defaultRangeStart);
  const [proteinCustomEnd, setProteinCustomEnd] = useState(todayKey);
  const [fiberCustomStart, setFiberCustomStart] = useState(defaultRangeStart);
  const [fiberCustomEnd, setFiberCustomEnd] = useState(todayKey);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [dayTotals, setDayTotals] = useState<DayTotal[]>([]);
  const [profile, setProfile] = useState<Profile>({
    displayName: user.displayName || user.email?.split("@")[0] || "there",
    maintenanceCalories: 2200,
    proteinGoal: 120,
    fiberGoal: 30,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    displayName: user.displayName || user.email?.split("@")[0] || "there",
    maintenanceCalories: "2200",
    proteinGoal: "120",
    fiberGoal: "30",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({
    name: "",
    calories: "",
    protein: "",
    fiber: "",
    meal: "Dinner" as MealName,
  });
  const [newEntryParts, setNewEntryParts] = useState<MealPartInput[]>([]);
  const [isMultipart, setIsMultipart] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const handlePopState = () => setActiveView(viewFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const profileRef = doc(db, "users", user.uid);
    getDoc(profileRef)
      .then((snapshot) => {
        const data = (snapshot.exists() ? snapshot.data() : {}) as Partial<Profile>;
        const loadedProfile: Profile = {
          displayName: data.displayName || currentDisplayName(user),
          maintenanceCalories: data.maintenanceCalories || 2200,
          proteinGoal: data.proteinGoal || 120,
          fiberGoal: data.fiberGoal || 30,
        };
        setProfile(loadedProfile);
        setSettingsForm({
          displayName: loadedProfile.displayName,
          maintenanceCalories: String(loadedProfile.maintenanceCalories),
          proteinGoal: String(loadedProfile.proteinGoal),
          fiberGoal: String(loadedProfile.fiberGoal),
        });
      })
      .catch((error) => setSaveError(firestoreMessage(error, "Unable to load your profile.")));
    const entriesQuery = query(
      collection(db, "users", user.uid, "days", selectedDate, "entries"),
      orderBy("createdAt", "asc"),
    );
    return onSnapshot(
      entriesQuery,
      (snapshot) =>
        setEntries(
          snapshot.docs.map((entry) => {
            const data = entry.data();
            const createdAt =
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date();
            return {
              id: entry.id,
              name: data.foodName,
              calories: data.calories || 0,
              protein: data.protein || 0,
              fiber: data.fiber || 0,
              meal: data.meal,
              parts: Array.isArray(data.parts) ? data.parts : [],
              detail: createdAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
          }),
        ),
      (error) => setSaveError(firestoreMessage(error, "Unable to load today's entries.")),
    );
  }, [user, selectedDate]);

  useEffect(() => {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const totalsQuery = query(
      collection(db, "users", user.uid, "days"),
      where("date", ">=", dateKey(start)),
      where("date", "<=", todayKey),
      orderBy("date", "asc"),
      limit(31),
    );
    return onSnapshot(
      totalsQuery,
      (snapshot) =>
        setDayTotals(
          snapshot.docs.map((day) => ({
            date: day.id,
            totalCalories: day.data().totalCalories || 0,
            protein: day.data().protein || 0,
            fiber: day.data().fiber || 0,
          })),
        ),
      (error) => setSaveError(firestoreMessage(error, "Unable to load your trend data.")),
    );
  }, [user.uid]);

  const totalCalories = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.calories, 0),
    [entries],
  );
  const totalProtein = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.protein, 0),
    [entries],
  );
  const totalFiber = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.fiber, 0),
    [entries],
  );
  const targetCalories = profile.maintenanceCalories || 2200;
  const targetProtein = profile.proteinGoal || 120;
  const targetFiber = profile.fiberGoal || 30;
  const remainingCalories = targetCalories - totalCalories;
  const progress = Math.min((totalCalories / targetCalories) * 100, 100);
  const groupedEntries = (meal: MealName) =>
    entries.filter((entry) => entry.meal === meal);
  const weeklyData = useMemo(
    () =>
      lastDays(7).map((date) => {
        const total = dayTotals.find((item) => item.date === dateKey(date));
        return {
          day: date.toLocaleDateString([], { weekday: "short" }),
          calories: total?.totalCalories || 0,
          protein: total?.protein || 0,
          fiber: total?.fiber || 0,
        };
      }),
    [dayTotals],
  );
  const monthlyData = useMemo(
    () =>
      dayTotals
        .filter((item) => item.date.slice(0, 7) === todayKey.slice(0, 7))
        .map((item) => ({
          day: item.date.slice(-2),
          calories: item.totalCalories,
        })),
    [dayTotals],
  );
  const dataForRange = (range: RhythmRange, customStart: string, customEnd: string) => {
    if (range === "7") return weeklyData;
    const start = range === "month" ? `${todayKey.slice(0, 7)}-01` : customStart;
    const end = range === "month" ? todayKey : customEnd;
    return dayTotals
      .filter((item) => item.date >= start && item.date <= end)
      .map((item) => ({
        day: range === "month"
          ? item.date.slice(-2)
          : parseDateKey(item.date).toLocaleDateString([], {
            month: "short",
            day: "numeric",
          }),
        calories: item.totalCalories,
        protein: item.protein,
        fiber: item.fiber,
      }));
  };
  const calorieData = useMemo(
    () => dataForRange(calorieRange, calorieCustomStart, calorieCustomEnd),
    [calorieCustomEnd, calorieCustomStart, calorieRange, dayTotals, weeklyData],
  );
  const proteinData = useMemo(
    () => dataForRange(proteinRange, proteinCustomStart, proteinCustomEnd),
    [proteinCustomEnd, proteinCustomStart, proteinRange, dayTotals, weeklyData],
  );
  const fiberData = useMemo(
    () => dataForRange(fiberRange, fiberCustomStart, fiberCustomEnd),
    [dayTotals, fiberCustomEnd, fiberCustomStart, fiberRange, weeklyData],
  );
  const calorieRangeLabel = calorieRange === "7"
    ? "Last 7 days"
    : calorieRange === "month"
      ? "This month"
      : "Custom range";
  const average = dayTotals.length
    ? Math.round(
      dayTotals.reduce((sum, day) => sum + day.totalCalories, 0) /
      dayTotals.length,
    )
    : 0;
  const daysOnTrack = dayTotals.filter(
    (day) => day.totalCalories > 0 && day.totalCalories <= targetCalories,
  ).length;
  const loggedMeals = meals.filter((meal) => groupedEntries(meal).length > 0);
  const consistency = dayTotals.length
    ? Math.round((daysOnTrack / dayTotals.length) * 100)
    : 0;
  const proteinRemaining = Math.max(0, targetProtein - totalProtein);
  const fiberRemaining = Math.max(0, targetFiber - totalFiber);

  const updateDayTotal = async (nextTotals: {
    totalCalories: number;
    protein: number;
    fiber: number;
  }) =>
    setDoc(
      doc(db, "users", user.uid, "days", selectedDate),
      { date: selectedDate, ...nextTotals, updatedAt: serverTimestamp() },
      { merge: true },
    );
  const saveEntry = async () => {
    const parts = newEntryParts
      .filter((part) => part.name.trim())
      .map((part) => ({
        name: part.name.trim(),
        calories: Number(part.calories) || 0,
        protein: roundNutrition(part.protein),
        fiber: roundNutrition(part.fiber),
      }));
    const calories = isMultipart
      ? parts.reduce((sum, part) => sum + part.calories, 0)
      : Number(newEntry.calories);
    const protein = isMultipart
      ? parts.reduce((sum, part) => sum + part.protein, 0)
      : roundNutrition(newEntry.protein);
    const fiber = isMultipart
      ? parts.reduce((sum, part) => sum + part.fiber, 0)
      : roundNutrition(newEntry.fiber);
    if (!newEntry.name.trim() || !calories || (isMultipart && !parts.length)) return;
    try {
      const entryData = {
        foodName: newEntry.name.trim(),
        calories,
        protein,
        fiber,
        meal: newEntry.meal,
        ...(isMultipart ? { parts } : {}),
      };
      if (editingEntry) {
        await updateDoc(
          doc(db, "users", user.uid, "days", selectedDate, "entries", editingEntry.id),
          entryData,
        );
      } else {
        await addDoc(
          collection(db, "users", user.uid, "days", selectedDate, "entries"),
          { ...entryData, createdAt: serverTimestamp() },
        );
      }
      await updateDayTotal({
        totalCalories: totalCalories + calories - (editingEntry?.calories || 0),
        protein: totalProtein + protein - (editingEntry?.protein || 0),
        fiber: totalFiber + fiber - (editingEntry?.fiber || 0),
      });
      setNewEntry({
        name: "",
        calories: "",
        protein: "",
        fiber: "",
        meal: "Dinner",
      });
      setNewEntryParts([]);
      setIsMultipart(false);
      setEditingEntry(null);
      setIsAdding(false);
      setSaveError("");
    } catch (error) {
      setSaveError(firestoreMessage(error, "Unable to save this entry."));
    }
  };
  const editEntry = (entry: Entry) => {
    setEditingEntry(entry);
    setNewEntry({
      name: entry.name,
      calories: String(entry.calories),
      protein: String(entry.protein),
      fiber: String(entry.fiber),
      meal: entry.meal,
    });
    setNewEntryParts(
      entry.parts.map((part) => ({
        name: part.name,
        calories: String(part.calories),
        protein: String(part.protein),
        fiber: String(part.fiber),
      })),
    );
    setIsMultipart(entry.parts.length > 0);
    setIsAdding(true);
  };
  const closeEntryModal = () => {
    setIsAdding(false);
    setEditingEntry(null);
  };
  const startAddingEntry = () => {
    setEditingEntry(null);
    setNewEntry({
      name: "",
      calories: "",
      protein: "",
      fiber: "",
      meal: "Dinner",
    });
    setNewEntryParts([]);
    setIsMultipart(false);
    setIsAdding(true);
  };
  const removeEntry = async (entry: Entry) => {
    try {
      await deleteDoc(
        doc(db, "users", user.uid, "days", selectedDate, "entries", entry.id),
      );
      await updateDayTotal({
        totalCalories: Math.max(0, totalCalories - entry.calories),
        protein: Math.max(0, totalProtein - entry.protein),
        fiber: Math.max(0, totalFiber - entry.fiber),
      });
    } catch (error) {
      setSaveError(firestoreMessage(error, "Unable to remove this entry."));
    }
  };
  const signOutUser = () =>
    signOut(auth).catch(() => setSaveError("Unable to sign out."));
  const saveSettings = async () => {
    const nextProfile: Profile = {
      displayName: settingsForm.displayName.trim() || currentDisplayName(user),
      maintenanceCalories: Math.max(1, Number(settingsForm.maintenanceCalories) || 2200),
      proteinGoal: Math.max(0, Number(settingsForm.proteinGoal) || 120),
      fiberGoal: Math.max(0, Number(settingsForm.fiberGoal) || 30),
    };
    try {
      await setDoc(doc(db, "users", user.uid), nextProfile, { merge: true });
      setProfile(nextProfile);
      setIsSettingsOpen(false);
      setSaveError("");
      updateProfile(user, { displayName: nextProfile.displayName }).catch(() => undefined);
    } catch (error) {
      setSaveError(firestoreMessage(error, "Unable to save your goals."));
    }
  };

  return (
    <div className="app-shell">
      <aside className={isSidebarOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <span className="brand-mark">
            <Activity size={17} />
          </span>
          <span>
            nourish<span className="brand-dot">.</span>
          </span>
        </div>
        <button className="profile-mini" onClick={() => setIsSettingsOpen(true)}>
          <div className="avatar">{initials(profile.displayName)}</div>
          <div>
            <strong>{profile.displayName}</strong>
            <span>Personal plan</span>
          </div>
          <ChevronDown size={15} />
        </button>
        <nav className="primary-nav" aria-label="Main navigation">
          {[
            { label: "Overview", icon: LayoutDashboard },
            { label: "Daily log", icon: Utensils },
            { label: "Progress", icon: Activity },
          ].map(({ label, icon: Icon }) => (
            <a
              className={activeView === label ? "nav-item active" : "nav-item"}
              href={pathFromView(label)}
              key={label}
              onClick={() => setIsSidebarOpen(false)}
            >
              <Icon size={18} />
              {label}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={18} />
            Settings
          </button>
          <button className="nav-item" onClick={signOutUser}>
            <LogOut size={18} />
            Sign out
          </button>
          <div className="sync-note">
            <span className="sync-dot" />
            Firebase sync active
          </div>
        </div>
      </aside>
      {isSidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand brand">
            <span className="brand-mark">
              <Activity size={17} />
            </span>
            nourish<span className="brand-dot">.</span>
          </div>
          <button
            className="mobile-menu-button"
            aria-label="Open navigation"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span>/</span>
            <strong>{activeView}</strong>
          </div>
        </header>
        <div className={`page-wrap ${activeView === "Progress" ? "progress-page" : activeView === "Daily log" ? "daily-log-page" : "overview-page"}`}>
          <section className="welcome-row">
            <div>
              <p className="eyebrow">{formatLongDate(activeView === "Daily log" ? parseDateKey(selectedDate) : new Date())}</p>
            </div>
            {activeView === "Daily log" && (
              <label className="date-button">
                <CalendarDays size={17} />
                {selectedDate === todayKey ? "Today" : formatShortDate(parseDateKey(selectedDate))}
                <ChevronDown size={15} />
                <input className="date-picker" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
              </label>
            )}
          </section>
          {saveError && <p className="inline-error">{saveError}</p>}
          {activeView === "Progress" && (
            <section className="progress-view">
              <div className="progress-view-heading">
                <div>
                  <p className="eyebrow">Your progress</p>
                  <h2>The picture over time</h2>
                  <p>Use your recent rhythm to understand what is working.</p>
                </div>
                <Activity size={28} />
              </div>
              <div className="progress-stats">
                <div><span>30-day average</span><strong>{average.toLocaleString()} kcal</strong></div>
                <div><span>Days on target</span><strong>{daysOnTrack} days</strong></div>
                <div><span>Consistency</span><strong>{consistency}%</strong></div>
              </div>
            </section>
          )}
          <section className="summary-grid">
            <article className="target-card">
              <div className="card-label">
                <span>Today&apos;s intake</span>
                <button className="more-button" aria-label="More options">
                  <Ellipsis size={19} />
                </button>
              </div>
              <div className="target-content">
                <div
                  className="ring"
                  style={
                    { "--progress": `${progress * 3.6}deg` } as CSSProperties
                  }
                >
                  <div>
                    <strong>{totalCalories.toLocaleString()}</strong>
                    <span>kcal</span>
                  </div>
                </div>
                <div>
                  <p className="large-stat">
                    {remainingCalories.toLocaleString()} <span>kcal left</span>
                  </p>
                  <p className="target-copy">
                    of your {targetCalories.toLocaleString()} kcal daily target
                  </p>
                  <div className="progress-line">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <p className="progress-label">
                    <span>{Math.round(progress)}% complete</span>
                    <span>{entries.length} entries</span>
                  </p>
                </div>
              </div>
              <div className="macro-summary">
                <span><strong>{formatNutrition(totalProtein)}g</strong> / {formatNutrition(targetProtein)}g protein</span>
                <span><strong>{formatNutrition(totalFiber)}g</strong> / {formatNutrition(targetFiber)}g fiber</span>
              </div>
            </article>
            <article className="stat-card accent-yellow">
              <div className="card-label">
                <span>Today&apos;s rhythm</span>
                <Utensils size={17} />
              </div>
              <p className="stat-number">
                {loggedMeals.length} <small>/ {meals.length} meals</small>
              </p>
              <p className="stat-change">
                <span>{loggedMeals.length ? "Keep your day moving" : "Start with your first meal"}</span>
              </p>
              <div className="meal-progress-dots">
                {meals.map((meal) => (
                  <span className={loggedMeals.includes(meal) ? "filled" : ""} key={meal} />
                ))}
              </div>
            </article>
            <article className="stat-card accent-coral">
              <div className="card-label">
                <span>Macros remaining</span>
                <Sparkles size={17} />
              </div>
              <div className="macro-remaining">
                <div>
                  <strong>{formatNutrition(proteinRemaining)}g</strong>
                  <span>protein to go</span>
                </div>
                <div>
                  <strong>{formatNutrition(fiberRemaining)}g</strong>
                  <span>fiber to go</span>
                </div>
              </div>
              <p className="stat-change">
                <span>Based on today&apos;s intake</span>
              </p>
              <div className="focus-rule" />
            </article>
          </section>
          <section className="chart-grid">
            <article className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{calorieRangeLabel}</p>
                  <h2>Calorie rhythm</h2>
                </div>
                <DateRangeControls
                  ariaLabel="Calorie rhythm date range"
                  range={calorieRange}
                  onRangeChange={setCalorieRange}
                  customStart={calorieCustomStart}
                  customEnd={calorieCustomEnd}
                  onCustomStartChange={(value) => {
                    setCalorieCustomStart(value);
                    if (value > calorieCustomEnd) setCalorieCustomEnd(value);
                  }}
                  onCustomEndChange={(value) => {
                    setCalorieCustomEnd(value);
                    if (value < calorieCustomStart) setCalorieCustomStart(value);
                  }}
                />
              </div>
              <div className="chart-legend">
                <span>
                  <i className="legend-dot orange" />
                  Calories consumed
                </span>
                <span>
                  <i className="legend-line" />
                  Daily target
                </span>
              </div>
              <div className="chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calorieData} barCategoryGap="28%">
                    <CartesianGrid vertical={false} stroke="#eae6de" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#817d74", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      hide
                      domain={[0, Math.max(targetCalories * 1.3, 2800)]}
                    />
                    <Tooltip
                      cursor={{ fill: "#f7f3eb" }}
                      contentStyle={{
                        border: "1px solid #e7e1d7",
                        borderRadius: 8,
                      }}
                      formatter={(value) => [`${value} kcal`, "Consumed"]}
                    />
                    <Bar
                      dataKey="calories"
                      fill="#df684c"
                      radius={[5, 5, 2, 2]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
            <article className="panel chart-panel monthly-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">
                    {new Date().toLocaleDateString([], {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <h2>Monthly trend</h2>
                </div>
                <button
                  className="icon-button subtle-icon"
                  aria-label="Monthly chart options"
                >
                  <Ellipsis size={19} />
                </button>
              </div>
              <div className="monthly-total">
                <strong>{average.toLocaleString()}</strong>
                <span>avg. kcal / day</span>
                {average > targetCalories && <b>above target</b>}
              </div>
              <div className="chart-area area-chart">
                {monthlyData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient
                          id="trendFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#d8a52a"
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="100%"
                            stopColor="#d8a52a"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#eae6de" />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#817d74", fontSize: 11 }}
                        dy={10}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          border: "1px solid #e7e1d7",
                          borderRadius: 8,
                        }}
                        formatter={(value) => [`${value} kcal`, "Daily total"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="calories"
                        stroke="#c99722"
                        strokeWidth={2.5}
                        fill="url(#trendFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-chart">
                    Log a few days to see your trend.
                  </div>
                )}
              </div>
            </article>
          </section>
          <section className="progress-macro-section">
            <div className="progress-macro-heading">
              <h2>Macro intake</h2>
            </div>
            <div className="macro-graphs-grid">
              <article className="panel macro-graph-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Protein</p>
                    <h2>{formatNutrition(targetProtein)}g goal</h2>
                  </div>
                  <DateRangeControls
                    ariaLabel="Protein date range"
                    range={proteinRange}
                    onRangeChange={setProteinRange}
                    customStart={proteinCustomStart}
                    customEnd={proteinCustomEnd}
                    onCustomStartChange={(value) => {
                      setProteinCustomStart(value);
                      if (value > proteinCustomEnd) setProteinCustomEnd(value);
                    }}
                    onCustomEndChange={(value) => {
                      setProteinCustomEnd(value);
                      if (value < proteinCustomStart) setProteinCustomStart(value);
                    }}
                  />
                </div>
                <div className="chart-area macro-chart-area">
                  {proteinData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={proteinData}>
                        <CartesianGrid vertical={false} stroke="#eae6de" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#817d74", fontSize: 11 }} dy={10} />
                        <YAxis hide domain={[0, Math.max(targetProtein, targetFiber) * 1.3]} />
                        <Tooltip contentStyle={{ border: "1px solid #e7e1d7", borderRadius: 8 }} formatter={(value) => [`${value}g`, "Protein"]} />
                        <ReferenceLine y={targetProtein} stroke="#9e987e" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="protein" name="Protein" stroke="#5d8b71" strokeWidth={2.5} dot={{ r: 3, fill: "#5d8b71" }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart">Log a few days to see your protein trend.</div>
                  )}
                </div>
              </article>
              <article className="panel macro-graph-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Fiber</p>
                    <h2>{formatNutrition(targetFiber)}g goal</h2>
                  </div>
                  <DateRangeControls
                    ariaLabel="Fiber date range"
                    range={fiberRange}
                    onRangeChange={setFiberRange}
                    customStart={fiberCustomStart}
                    customEnd={fiberCustomEnd}
                    onCustomStartChange={(value) => {
                      setFiberCustomStart(value);
                      if (value > fiberCustomEnd) setFiberCustomEnd(value);
                    }}
                    onCustomEndChange={(value) => {
                      setFiberCustomEnd(value);
                      if (value < fiberCustomStart) setFiberCustomStart(value);
                    }}
                  />
                </div>
                <div className="chart-area macro-chart-area">
                  {fiberData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={fiberData}>
                        <CartesianGrid vertical={false} stroke="#eae6de" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#817d74", fontSize: 11 }} dy={10} />
                        <YAxis hide domain={[0, Math.max(targetProtein, targetFiber) * 1.3]} />
                        <Tooltip contentStyle={{ border: "1px solid #e7e1d7", borderRadius: 8 }} formatter={(value) => [`${value}g`, "Fiber"]} />
                        <ReferenceLine y={targetFiber} stroke="#9e987e" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="fiber" name="Fiber" stroke="#d49e27" strokeWidth={2.5} dot={{ r: 3, fill: "#d49e27" }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart">Log a few days to see your fiber trend.</div>
                  )}
                </div>
              </article>
            </div>
          </section>
          <section className="log-section">
            <div className="daily-intake-summary">
              <DailyIntakeStat
                label="Calories"
                consumed={`${totalCalories.toLocaleString()} kcal`}
                remaining={`${Math.max(0, targetCalories - totalCalories).toLocaleString()} kcal`}
                goal={`${targetCalories.toLocaleString()} kcal goal`}
                over={totalCalories > targetCalories}
              />
              <DailyIntakeStat
                label="Protein"
                consumed={`${formatNutrition(totalProtein)}g`}
                remaining={`${formatNutrition(Math.max(0, targetProtein - totalProtein))}g`}
                goal={`${formatNutrition(targetProtein)}g goal`}
                over={totalProtein > targetProtein}
                overIsPositive
              />
              <DailyIntakeStat
                label="Fiber"
                consumed={`${formatNutrition(totalFiber)}g`}
                remaining={`${formatNutrition(Math.max(0, targetFiber - totalFiber))}g`}
                goal={`${formatNutrition(targetFiber)}g goal`}
                over={totalFiber > targetFiber}
                overIsPositive
              />
            </div>
            <div className="section-heading">
              <div>
                <h2>Daily log</h2>
              </div>
              <button className="add-button" onClick={startAddingEntry}>
                <Plus size={17} />
                Add log
              </button>
            </div>
            <div className="meal-list">
              {meals.map((meal) => {
                const MealIcon = mealIcons[meal];
                const mealEntries = groupedEntries(meal);
                const mealTotal = mealEntries.reduce(
                  (sum, entry) => sum + entry.calories,
                  0,
                );
                return (
                  <div className="meal-row" key={meal}>
                    <div className="meal-title">
                      <span className={`meal-icon ${meal.toLowerCase()}`}>
                        <MealIcon size={17} />
                      </span>
                      <div>
                        <strong>{meal}</strong>
                        <span>
                          {mealEntries.length
                            ? `${mealEntries.length} items`
                            : "Nothing logged yet"}
                        </span>
                      </div>
                    </div>
                    <div className="meal-entries">
                      {mealEntries.map((entry) => (
                        <div className="food-entry" key={entry.id}>
                          <div>
                            <strong>{entry.name}</strong>
                            <span>{entry.detail} · {formatNutrition(entry.protein)}g protein · {formatNutrition(entry.fiber)}g fiber</span>
                            {entry.parts.length > 0 && (
                              <div className="food-parts">
                                {entry.parts.map((part) => (
                                  <span key={`${entry.id}-${part.name}`}>
                                    {part.name}: {part.calories} kcal
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <b>{entry.calories} kcal</b>
                          <button
                            className="remove-button"
                            type="button"
                            onClick={() => editEntry(entry)}
                            aria-label={`Edit ${entry.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="remove-button"
                            type="button"
                            onClick={() => removeEntry(entry)}
                            aria-label={`Remove ${entry.name}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <span className="meal-total">{mealTotal} kcal</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
      {isAdding && (
        <div className="modal-backdrop" onClick={closeEntryModal}>
          <form
            className="add-modal"
            onSubmit={(event) => {
              event.preventDefault();
              void saveEntry();
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">{editingEntry ? "Edit entry" : "New entry"}</p>
                <h2>{editingEntry ? "Edit food" : "Add food"}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={closeEntryModal}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Food name
              <input
                autoFocus
                value={newEntry.name}
                onChange={(event) =>
                  setNewEntry({ ...newEntry, name: event.target.value })
                }
                placeholder="e.g. Chicken salad"
              />
            </label>
            <div className="form-row nutrition-row">
              {!isMultipart && (
                <NutritionInputs
                  entry={newEntry}
                  onChange={(field, value) => setNewEntry({ ...newEntry, [field]: value })}
                />
              )}
            </div>
            <label className="multipart-toggle">
              <input
                type="checkbox"
                checked={isMultipart}
                onChange={(event) => setIsMultipart(event.target.checked)}
              />
              Add subparts to this meal
            </label>
            {isMultipart ? (
              <div className="parts-editor">
                <div className="parts-heading">
                  <span>Meal subparts</span>
                  <button
                    type="button"
                    className="add-part-button"
                    onClick={() => setNewEntryParts([...newEntryParts, emptyMealPart()])}
                  >
                    <Plus size={14} /> Add part
                  </button>
                </div>
                {newEntryParts.length === 0 && (
                  <p className="parts-empty">Add drinks, sides, or other parts to calculate the meal total.</p>
                )}
                {newEntryParts.map((part, index) => (
                  <div className="part-editor" key={index}>
                    <input
                      aria-label={`Subpart ${index + 1} name`}
                      value={part.name}
                      onChange={(event) => updateMealPart(setNewEntryParts, newEntryParts, index, "name", event.target.value)}
                      placeholder="e.g. Iced tea"
                    />
                    <input
                      aria-label={`Subpart ${index + 1} calories`}
                      type="number"
                      min="0"
                      value={part.calories}
                      onChange={(event) => updateMealPart(setNewEntryParts, newEntryParts, index, "calories", event.target.value)}
                      placeholder="kcal"
                    />
                    <input
                      aria-label={`Subpart ${index + 1} protein`}
                      type="number"
                      min="0"
                      step="any"
                      value={part.protein}
                      onChange={(event) => updateMealPart(setNewEntryParts, newEntryParts, index, "protein", event.target.value)}
                      placeholder="protein"
                    />
                    <input
                      aria-label={`Subpart ${index + 1} fiber`}
                      type="number"
                      min="0"
                      step="any"
                      value={part.fiber}
                      onChange={(event) => updateMealPart(setNewEntryParts, newEntryParts, index, "fiber", event.target.value)}
                      placeholder="fiber"
                    />
                    <button
                      type="button"
                      className="remove-button"
                      aria-label={`Remove subpart ${index + 1}`}
                      onClick={() => setNewEntryParts(newEntryParts.filter((_, partIndex) => partIndex !== index))}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <p className="parts-total">
                  Total: {newEntryParts.reduce((sum, part) => sum + (Number(part.calories) || 0), 0)} kcal · {formatNutrition(newEntryParts.reduce((sum, part) => sum + roundNutrition(part.protein), 0))}g protein · {formatNutrition(newEntryParts.reduce((sum, part) => sum + roundNutrition(part.fiber), 0))}g fiber
                </p>
              </div>
            ) : null}
            <div className="form-row meal-row-input">
              <label>
                Meal
                <select
                  value={newEntry.meal}
                  onChange={(event) =>
                    setNewEntry({
                      ...newEntry,
                      meal: event.target.value as MealName,
                    })
                  }
                >
                  {meals.map((meal) => (
                    <option key={meal}>{meal}</option>
                  ))}
                </select>
              </label>
            </div>
            <button className="submit-button" type="submit">
              {editingEntry ? "Save changes" : "Add to daily log"} <ArrowUpRight size={17} />
            </button>
          </form>
        </div>
      )}
      {isSettingsOpen && (
        <div className="modal-backdrop" onClick={() => setIsSettingsOpen(false)}>
          <form
            className="add-modal settings-modal"
            onSubmit={(event) => {
              event.preventDefault();
              void saveSettings();
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Personal plan</p>
                <h2>Your daily goals</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setIsSettingsOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <label>
              Display name
              <input value={settingsForm.displayName} onChange={(event) => setSettingsForm({ ...settingsForm, displayName: event.target.value })} />
            </label>
            <div className="form-row nutrition-row">
              <label>
                Calories
                <input type="number" min="1" value={settingsForm.maintenanceCalories} onChange={(event) => setSettingsForm({ ...settingsForm, maintenanceCalories: event.target.value })} />
              </label>
              <label>
                Protein (g)
                <input type="number" min="0" step="any" value={settingsForm.proteinGoal} onChange={(event) => setSettingsForm({ ...settingsForm, proteinGoal: event.target.value })} />
              </label>
              <label>
                Fiber (g)
                <input type="number" min="0" step="any" value={settingsForm.fiberGoal} onChange={(event) => setSettingsForm({ ...settingsForm, fiberGoal: event.target.value })} />
              </label>
            </div>
            <button className="submit-button" type="submit">Save goals <ArrowUpRight size={17} /></button>
          </form>
        </div>
      )}
    </div>
  );
}

function lastDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - index - 1));
    return date;
  });
}
function roundNutrition(value: string | number) {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue)
    ? Math.round((numericValue + Number.EPSILON) * 100) / 100
    : 0;
}
function formatNutrition(value: number) {
  return roundNutrition(value).toString();
}
function DateRangeControls({
  ariaLabel,
  range,
  onRangeChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: {
  ariaLabel: string;
  range: RhythmRange;
  onRangeChange: (range: RhythmRange) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
}) {
  return (
    <div className="rhythm-controls">
      <label className="select-button">
        <select
          aria-label={ariaLabel}
          value={range}
          onChange={(event) => onRangeChange(event.target.value as RhythmRange)}
        >
          <option value="7">Last 7 days</option>
          <option value="month">This month</option>
          <option value="custom">Custom dates</option>
        </select>
        <ChevronDown size={14} />
      </label>
      {range === "custom" && (
        <div className="custom-range-controls">
          <label>
            From
            <input
              type="date"
              max={customEnd}
              value={customStart}
              onChange={(event) => onCustomStartChange(event.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              min={customStart}
              max={todayKey}
              value={customEnd}
              onChange={(event) => onCustomEndChange(event.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  );
}
function DailyIntakeStat({
  label,
  consumed,
  remaining,
  goal,
  over,
  overIsPositive = false,
}: {
  label: string;
  consumed: string;
  remaining: string;
  goal: string;
  over: boolean;
  overIsPositive?: boolean;
}) {
  const statusClass = over ? (overIsPositive ? "positive" : "over") : "";
  return (
    <div className={`intake-stat ${statusClass}`}>
      <span className="intake-label">{label}</span>
      <strong>{consumed}</strong>
      <span className="intake-remaining">
        {over && !overIsPositive ? "Over goal" : `${remaining} remaining`}
      </span>
      <span className="intake-goal">{goal}</span>
    </div>
  );
}
type MealPartInput = { name: string; calories: string; protein: string; fiber: string };
function emptyMealPart(): MealPartInput {
  return { name: "", calories: "", protein: "", fiber: "" };
}
function updateMealPart(
  setParts: React.Dispatch<React.SetStateAction<MealPartInput[]>>,
  parts: MealPartInput[],
  index: number,
  field: keyof MealPartInput,
  value: string,
) {
  setParts(parts.map((part, partIndex) => partIndex === index ? { ...part, [field]: value } : part));
}
function NutritionInputs({
  entry,
  onChange,
}: {
  entry: { calories: string; protein: string; fiber: string };
  onChange: (field: "calories" | "protein" | "fiber", value: string) => void;
}) {
  return <>
    <label>Calories<input type="number" min="1" value={entry.calories} onChange={(event) => onChange("calories", event.target.value)} placeholder="0" /></label>
    <label>Protein (g)<input type="number" min="0" step="any" value={entry.protein} onChange={(event) => onChange("protein", event.target.value)} placeholder="0.0" /></label>
    <label>Fiber (g)<input type="number" min="0" step="any" value={entry.fiber} onChange={(event) => onChange("fiber", event.target.value)} placeholder="0.0" /></label>
  </>;
}
function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function currentDisplayName(user: User) {
  return user.displayName || user.email?.split("@")[0] || "there";
}
function formatLongDate(date: Date) {
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
function parseDateKey(value: string) {
  return new Date(`${value}T12:00:00`);
}
function formatShortDate(date: Date) {
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
function firebaseMessage(error: unknown) {
  const code = (error as { code?: string }).code;
  if (code === "auth/invalid-credential")
    return "Email or password is incorrect.";
  if (code === "auth/email-already-in-use")
    return "An account already exists for this email.";
  if (code === "auth/weak-password")
    return "Use a password with at least 6 characters.";
  return "Something went wrong. Please try again.";
}
function firestoreMessage(error: unknown, fallback: string) {
  const code = (error as { code?: string }).code;
  if (code === "not-found" || code === "failed-precondition") {
    return "Create a Firestore Database in the Firebase Console before saving data.";
  }
  if (code === "permission-denied") {
    return "Firestore access was denied. Deploy firestore.rules and try again.";
  }
  return fallback;
}

export default App;
