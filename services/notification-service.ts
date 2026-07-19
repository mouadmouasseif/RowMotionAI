import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore/lite";
import { auth, db } from "@/lib/firebase";
export interface AppNotification { id: string; userId: string; type: string; title: string; message: string; read: boolean; href: string; createdAt?: unknown }
export async function listNotifications(): Promise<AppNotification[]> { if (!auth?.currentUser || !db) throw new Error("Session indisponible."); const snapshot = await getDocs(query(collection(db, "notifications"), where("userId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"), limit(100))); return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as AppNotification)); }
export async function markNotificationRead(id: string) { if (!db) throw new Error("Service indisponible."); await updateDoc(doc(db, "notifications", id), { read: true, updatedAt: serverTimestamp() }); }
export async function deleteNotification(id: string) { if (!db) throw new Error("Service indisponible."); await deleteDoc(doc(db, "notifications", id)); }
