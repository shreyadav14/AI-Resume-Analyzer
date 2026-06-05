import { create } from "zustand";

const AUTH_KEY = "resume-analyzer-auth";
const KV_PREFIX = "resume-analyzer-kv:";
const FS_DB = "resume-analyzer-fs";
const FS_STORE = "files";

interface PuterStore {
  isLoading: boolean;
  error: string | null;
  puterReady: boolean;
  auth: {
    user: PuterUser | null;
    isAuthenticated: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
    checkAuthStatus: () => Promise<boolean>;
    getUser: () => PuterUser | null;
  };
  fs: {
    write: (
      path: string,
      data: string | File | Blob
    ) => Promise<File | undefined>;
    read: (path: string) => Promise<Blob | undefined>;
    upload: (file: File[] | Blob[]) => Promise<FSItem | undefined>;
    delete: (path: string) => Promise<void>;
    readDir: (path: string) => Promise<FSItem[] | undefined>;
  };
  ai: {
    chat: (
      prompt: string | ChatMessage[],
      imageURL?: string | PuterChatOptions,
      testMode?: boolean,
      options?: PuterChatOptions
    ) => Promise<any | undefined>;
    feedback: (
      path: string,
      message: string
    ) => Promise<any | undefined>;
    img2txt: (
      image: string | File | Blob,
      testMode?: boolean
    ) => Promise<string | undefined>;
  };
  kv: {
    get: (key: string) => Promise<string | null | undefined>;
    set: (key: string, value: string) => Promise<boolean | undefined>;
    delete: (key: string) => Promise<boolean | undefined>;
    list: (
      pattern: string,
      returnValues?: boolean
    ) => Promise<string[] | KVItem[] | undefined>;
    flush: () => Promise<boolean | undefined>;
  };

  init: () => void;
  clearError: () => void;
}

const openFsDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = window.indexedDB.open(FS_DB, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FS_STORE)) {
        db.createObjectStore(FS_STORE, { keyPath: "path" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const makeFsItem = (path: string, blob: Blob): FSItem => {
  const name = path.split("/").pop() || path;
  const now = Date.now();
  return {
    id: path,
    uid: path,
    name,
    path,
    is_dir: false,
    parent_id: "",
    parent_uid: "",
    created: now,
    modified: now,
    accessed: now,
    size: blob.size,
    writable: true,
  };
};

const createFsPath = (file: File): string => {
  const id = crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `fs/${id}-${file.name.replace(/\s+/g, "_")}`;
};

const storeBlob = async (path: string, blob: Blob) => {
  const db = await openFsDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(FS_STORE, "readwrite");
    const store = tx.objectStore(FS_STORE);
    store.put({ path, blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

const readBlob = async (path: string): Promise<Blob | undefined> => {
  const db = await openFsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FS_STORE, "readonly");
    const store = tx.objectStore(FS_STORE);
    const request = store.get(path);
    request.onsuccess = () => {
      resolve(request.result?.blob as Blob | undefined);
    };
    request.onerror = () => reject(request.error);
  });
};

const deleteBlob = async (path: string): Promise<void> => {
  const db = await openFsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FS_STORE, "readwrite");
    const store = tx.objectStore(FS_STORE);
    store.delete(path);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

const listBlobs = async (prefix: string): Promise<FSItem[]> => {
  const db = await openFsDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FS_STORE, "readonly");
    const store = tx.objectStore(FS_STORE);
    const items: FSItem[] = [];
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const record = cursor.value;
        if (record.path.startsWith(prefix)) {
          items.push(makeFsItem(record.path, record.blob));
        }
        cursor.continue();
      } else {
        resolve(items);
      }
    };

    request.onerror = () => reject(request.error);
  });
};

const getStoredAuth = (): { user: PuterUser | null; isAuthenticated: boolean } => {
  if (typeof window === "undefined") {
    return { user: null, isAuthenticated: false };
  }

  const raw = window.localStorage.getItem(AUTH_KEY);
  if (!raw) {
    return { user: null, isAuthenticated: false };
  }

  try {
    const parsed = JSON.parse(raw) as {
      user: PuterUser;
      isAuthenticated: boolean;
    };
    return {
      user: parsed.user,
      isAuthenticated: parsed.isAuthenticated,
    };
  } catch {
    return { user: null, isAuthenticated: false };
  }
};

const setStoredAuth = (user: PuterUser | null, isAuthenticated: boolean) => {
  if (typeof window === "undefined") return;
  if (!isAuthenticated || !user) {
    window.localStorage.removeItem(AUTH_KEY);
    return;
  }
  window.localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({ user, isAuthenticated })
  );
};

const getLocalStorageKey = (key: string) => `${KV_PREFIX}${key}`;

const createMockFeedback = (message: string): any => {
  const score = Math.min(
    100,
    Math.max(50, 70 + Math.floor(message.replace(/\s+/g, "").length / 15))
  );

  const categoryScore = Math.max(50, Math.round(score * 0.9));
  const categoryTips = [
    {
      type: 'improve',
      tip: 'Add more clear examples of impact and measurable results.',
      explanation:
        'Use quantifiable achievements to show the value of your work, such as percentages, dollar amounts, or team size.',
    },
    {
      type: 'good',
      tip: 'Keep formatting consistent across sections.',
      explanation:
        'Consistent headings, spacing, and bullet style make your resume easier to scan for recruiters and ATS tools.',
    },
  ];

  return {
    overallScore: score,
    ATS: {
      score,
      tips: [
        {
          type: 'improve',
          tip:
            'Your resume is generally strong. Add more specific metrics, use action verbs, and tailor keywords to the role.',
        },
      ],
    },
    toneAndStyle: {
      score: categoryScore,
      tips: categoryTips,
    },
    content: {
      score: categoryScore,
      tips: categoryTips,
    },
    structure: {
      score: categoryScore,
      tips: categoryTips,
    },
    skills: {
      score: categoryScore,
      tips: categoryTips,
    },
    strengths: [
      'Clear structure',
      'Relevant experience sections',
      'Good job descriptions',
    ],
    weaknesses: [
      'Add more measurable achievements',
      'Include keywords from the job description',
    ],
    recommendations: [
      'Add more metrics and action verbs.',
      'Match keywords from the job description.',
    ],
  };
};

const getAuthUser = (): PuterUser => ({
  uuid: "local-user",
  username: "Guest",
});

export const usePuterStore = create<PuterStore>((set, get) => {
  const setError = (msg: string) => {
    set({
      error: msg,
      isLoading: false,
      auth: {
        user: null,
        isAuthenticated: false,
        signIn: get().auth.signIn,
        signOut: get().auth.signOut,
        refreshUser: get().auth.refreshUser,
        checkAuthStatus: get().auth.checkAuthStatus,
        getUser: get().auth.getUser,
      },
    });
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    set({ isLoading: true, error: null });
    const stored = getStoredAuth();
    set({
      auth: {
        user: stored.user,
        isAuthenticated: stored.isAuthenticated,
        signIn: get().auth.signIn,
        signOut: get().auth.signOut,
        refreshUser: get().auth.refreshUser,
        checkAuthStatus: get().auth.checkAuthStatus,
        getUser: () => stored.user,
      },
      isLoading: false,
      puterReady: true,
    });
    return stored.isAuthenticated;
  };

  const signIn = async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const user = getAuthUser();
      setStoredAuth(user, true);
      set({
        auth: {
          user,
          isAuthenticated: true,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
          refreshUser: get().auth.refreshUser,
          checkAuthStatus: get().auth.checkAuthStatus,
          getUser: () => user,
        },
        isLoading: false,
        puterReady: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      setError(msg);
    }
  };

  const signOut = async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      setStoredAuth(null, false);
      set({
        auth: {
          user: null,
          isAuthenticated: false,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
          refreshUser: get().auth.refreshUser,
          checkAuthStatus: get().auth.checkAuthStatus,
          getUser: () => null,
        },
        isLoading: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign out failed";
      setError(msg);
    }
  };

  const refreshUser = async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const stored = getStoredAuth();
      set({
        auth: {
          user: stored.user,
          isAuthenticated: stored.isAuthenticated,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
          refreshUser: get().auth.refreshUser,
          checkAuthStatus: get().auth.checkAuthStatus,
          getUser: () => stored.user,
        },
        isLoading: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to refresh user";
      setError(msg);
    }
  };

  const init = (): void => {
    set({ puterReady: true });
    checkAuthStatus();
  };

  const write = async (path: string, data: string | File | Blob) => {
    try {
      const blob =
        typeof data === "string"
          ? new Blob([data], { type: "text/plain" })
          : data;
      await storeBlob(path, blob);
      if (data instanceof File) {
        return data;
      }
      return new File([blob], path.split("/").pop() || "file.txt", {
        type: blob.type,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to write file");
      return;
    }
  };

  const readFile = async (path: string) => {
    try {
      return await readBlob(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
      return;
    }
  };

  const readDir = async (path: string) => {
    try {
      return await listBlobs(path.endsWith("/") ? path : `${path}/`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read directory");
      return;
    }
  };

  const upload = async (files: File[] | Blob[]) => {
    try {
      const file = files[0];
      if (!file) return;
      const blob = file instanceof File ? file : new Blob([file]);
      const path = createFsPath(file instanceof File ? file : new File([blob], "upload", { type: blob.type }));
      await storeBlob(path, blob);
      return makeFsItem(path, blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
      return;
    }
  };

  const deleteFile = async (path: string) => {
    try {
      await deleteBlob(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file");
    }
  };

  const chat = async (
    prompt: string | ChatMessage[],
    imageURL?: string | PuterChatOptions,
    testMode?: boolean,
    options?: PuterChatOptions
  ) => {
    const promptText =
      typeof prompt === "string" ? prompt : JSON.stringify(prompt, null, 2);
    return createMockFeedback(promptText);
  };

  const feedback = async (_path: string, message: string) => {
    const prompt = message || "Resume feedback request";
    return createMockFeedback(prompt);
  };

  const img2txt = async (image: string | File | Blob, _testMode?: boolean) => {
    if (typeof image === "string") {
      return `Extracted text from image path: ${image}`;
    }
    return `Extracted text from image of size ${image instanceof Blob ? image.size : 0}`;
  };

  const getKV = async (key: string) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(getLocalStorageKey(key));
  };

  const setKV = async (key: string, value: string) => {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(getLocalStorageKey(key), value);
    return true;
  };

  const deleteKV = async (key: string) => {
    if (typeof window === "undefined") return false;
    window.localStorage.removeItem(getLocalStorageKey(key));
    return true;
  };

  const listKV = async (
    pattern: string,
    returnValues?: boolean
  ): Promise<string[] | KVItem[] | undefined> => {
    if (typeof window === "undefined") return;
    const results: string[] = [];
    const items: KVItem[] = [];
    const prefix = getLocalStorageKey(pattern.replace(/\*$/, ""));
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const storageKey = window.localStorage.key(i);
      if (!storageKey?.startsWith(KV_PREFIX)) continue;
      if (storageKey.startsWith(prefix)) {
        const key = storageKey.slice(KV_PREFIX.length);
        const value = window.localStorage.getItem(storageKey) ?? "";
        if (returnValues) {
          items.push({ key, value });
        } else {
          results.push(key);
        }
      }
    }
    return returnValues ? items : results;
  };

  const flushKV = async () => {
    if (typeof window === "undefined") return false;
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(KV_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    return true;
  };

  return {
    isLoading: true,
    error: null,
    puterReady: false,
    auth: {
      user: null,
      isAuthenticated: false,
      signIn,
      signOut,
      refreshUser,
      checkAuthStatus,
      getUser: () => get().auth.user,
    },
    fs: {
      write: (path: string, data: string | File | Blob) => write(path, data),
      read: (path: string) => readFile(path),
      readDir: (path: string) => readDir(path),
      upload: (files: File[] | Blob[]) => upload(files),
      delete: (path: string) => deleteFile(path),
    },
    ai: {
      chat: (
        prompt: string | ChatMessage[],
        imageURL?: string | PuterChatOptions,
        testMode?: boolean,
        options?: PuterChatOptions
      ) => chat(prompt, imageURL, testMode, options),
      feedback: (path: string, message: string) => feedback(path, message),
      img2txt: (image: string | File | Blob, testMode?: boolean) =>
        img2txt(image, testMode),
    },
    kv: {
      get: (key: string) => getKV(key),
      set: (key: string, value: string) => setKV(key, value),
      delete: (key: string) => deleteKV(key),
      list: (pattern: string, returnValues?: boolean) =>
        listKV(pattern, returnValues),
      flush: () => flushKV(),
    },
    init,
    clearError: () => set({ error: null }),
  };
});
