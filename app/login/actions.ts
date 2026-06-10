"use server";

import { redirect } from "next/navigation";
import { createSession, verifyCredentials } from "@/lib/auth";

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Completá usuario y contraseña." };
  }

  const user = await verifyCredentials(username, password);
  if (!user) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await createSession(user.id);
  redirect("/");
}
