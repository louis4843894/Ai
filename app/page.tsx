"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";

export default function Home() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !db) {
      queueMicrotask(() => setSavedName(""));
      return;
    }

    queueMicrotask(() => setDisplayName(user.displayName ?? ""));
    void getDoc(doc(db, "users", user.uid)).then((snapshot) => {
      if (snapshot.exists()) {
        const name = snapshot.data().displayName;
        if (typeof name === "string") setSavedName(name);
      }
    }).catch(() => undefined);
  }, [user]);

  async function saveProfile() {
    if (!user || !db) return;
    setBusy(true);
    setMessage("");
    try {
      const name = displayName.trim();
      await updateProfile(user, { displayName: name });
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: name,
        email: user.email ?? "",
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSavedName(name);
      setMessage("個人資料已儲存。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "個人資料儲存失敗。");
    } finally {
      setBusy(false);
    }
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth || !db) return;
    setBusy(true);
    setMessage("");
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const name = displayName.trim() || "團購會員";
      await updateProfile(credential.user, { displayName: name });
      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        displayName: name,
        email: email.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "註冊失敗。");
    } finally {
      setBusy(false);
    }
  }

  async function login() {
    if (!auth) return;
    setBusy(true);
    setMessage("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登入失敗。");
    } finally {
      setBusy(false);
    }
  }

  async function loginWithGoogle() {
    if (!auth) return;
    setBusy(true);
    setMessage("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google 登入失敗。");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="grid min-h-screen place-items-center">載入登入狀態中…</main>;

  if (!isFirebaseConfigured) {
    return (
      <main className="mx-auto grid min-h-screen max-w-2xl place-items-center px-6">
        <section className="w-full rounded-lg border border-amber-300 bg-white p-7 shadow-sm">
          <p className="text-sm font-bold text-amber-700">尚未完成 Firebase 設定</p>
          <h1 className="mt-3 text-2xl font-bold">請設定 ai-deta-464d4 的 Web App</h1>
          <p className="mt-3 leading-7 text-slate-600">複製 <code>.env.local.example</code> 為 <code>.env.local</code>，再填入 Firebase Web SDK 設定。</p>
        </section>
      </main>
    );
  }

  if (user) {
    return (
      <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
        <section className="rounded-lg border border-[#dce5d9] bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">登入成功</p>
          <h1 className="mt-2 text-3xl font-bold">團購好朋友</h1>
          <p className="mt-2 text-slate-600">登入帳號：{user.email ?? "Google 帳號"}</p>
          <label className="mt-7 block text-sm font-semibold" htmlFor="displayName">顯示名稱</label>
          <input id="displayName" className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          <button type="button" className="mt-3 rounded-md bg-[#176b4d] px-5 py-3 font-semibold text-white disabled:opacity-50" disabled={busy} onClick={saveProfile}>儲存個人資料</button>
          {savedName && <p className="mt-6 rounded-md bg-[#eef6ed] p-4 text-sm">Firestore 個人資料：{savedName}</p>}
          {message && <p className="mt-4 text-sm text-slate-700">{message}</p>}
          <button type="button" className="mt-8 border-b border-slate-400 pb-1 text-sm font-semibold" onClick={() => auth && signOut(auth)}>登出</button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-6">
      <form className="w-full rounded-lg border border-[#dce5d9] bg-white p-7 shadow-sm" onSubmit={register}>
        <p className="text-sm font-semibold text-[#176b4d]">團購第一步</p>
        <h1 className="mt-2 text-3xl font-bold">登入團購好朋友</h1>
        <div className="mt-7 space-y-4">
          <div><label className="text-sm font-semibold" htmlFor="email">電子郵件</label><input id="email" type="email" required className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div><label className="text-sm font-semibold" htmlFor="password">密碼</label><input id="password" type="password" required minLength={6} className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          <div><label className="text-sm font-semibold" htmlFor="name">顯示名稱</label><input id="name" className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></div>
        </div>
        <div className="mt-5 grid gap-3">
          <button type="button" className="rounded-md bg-[#176b4d] px-5 py-3 font-semibold text-white disabled:opacity-50" disabled={busy} onClick={login}>Email／密碼登入</button>
          <button type="submit" className="rounded-md border border-slate-300 px-5 py-3 font-semibold disabled:opacity-50" disabled={busy}>註冊新帳號</button>
          <button type="button" className="rounded-md border border-slate-300 px-5 py-3 font-semibold disabled:opacity-50" disabled={busy} onClick={loginWithGoogle}>使用 Google 登入</button>
        </div>
        {message && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{message}</p>}
      </form>
    </main>
  );
}
