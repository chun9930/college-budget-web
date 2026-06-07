import {
  KEYS,
  createEmptyAccountSnapshot,
  loadAccountSnapshot,
  loadJSON,
  removeJSON,
  saveAccountSnapshot,
  saveJSON,
} from './storage';

export const EMAIL_REGEX =
  /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeUser(user) {
  return {
    name: String(user?.name || '').trim(),
    email: normalizeEmail(user?.email),
    password: String(user?.password || ''),
  };
}

function loadUsers() {
  const users = loadJSON(KEYS.users, []);
  return Array.isArray(users) ? users.map(normalizeUser).filter((user) => user.email) : [];
}

function saveUsers(users) {
  saveJSON(KEYS.users, users.map(normalizeUser));
}

export function getCurrentUser() {
  const loginState = loadJSON(KEYS.loginState, null);
  const userProfile = loadJSON(KEYS.userProfile, null);

  if (!loginState || !userProfile) {
    return null;
  }

  return {
    ...userProfile,
    ...loginState,
  };
}

export function signup({ name, email, password, passwordConfirm }) {
  const normalizedName = String(name || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '');
  const normalizedPasswordConfirm = String(passwordConfirm || '');
  const users = loadUsers();

  if (!normalizedName || !normalizedEmail || !normalizedPassword || !normalizedPasswordConfirm) {
    return { ok: false, error: '모든 항목을 입력해주세요.' };
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return { ok: false, error: '올바른 이메일 형식으로 입력해주세요.' };
  }

  if (users.some((user) => user.email === normalizedEmail)) {
    return { ok: false, error: '이미 가입된 이메일입니다.' };
  }

  if (normalizedPassword !== normalizedPasswordConfirm) {
    return { ok: false, error: '비밀번호가 일치하지 않습니다.' };
  }

  const user = {
    name: normalizedName,
    email: normalizedEmail,
    password: normalizedPassword,
  };

  saveUsers([user, ...users]);
  if (!loadAccountSnapshot(normalizedEmail)) {
    saveAccountSnapshot(normalizedEmail, createEmptyAccountSnapshot());
  }

  return {
    ok: true,
    user: {
      name: user.name,
      email: user.email,
    },
  };
}

export function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '');

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return { ok: false, error: '올바른 이메일 형식으로 입력해주세요.' };
  }

  const users = loadUsers();
  const user = users.find(
    (item) => item.email === normalizedEmail && item.password === normalizedPassword
  );

  if (!user) {
    return { ok: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  }

  const session = {
    userId: user.email,
    email: user.email,
    isLoggedIn: true,
    loggedInAt: new Date().toISOString(),
  };
  const profile = {
    userId: user.email,
    name: user.name,
    email: user.email,
  };

  saveJSON(KEYS.loginState, session);
  saveJSON(KEYS.userProfile, profile);

  return { ok: true, user: profile };
}

export function logout() {
  removeJSON(KEYS.loginState);
  removeJSON(KEYS.userProfile);
  return { ok: true };
}
