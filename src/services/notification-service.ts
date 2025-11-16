import { addDoc, collection, Firestore, Timestamp } from "firebase/firestore";
import type { Notification } from "@/lib/types";

type NotificationPayload = Omit<Notification, 'id' | 'createdAt' | 'isRead'>;

/**
 * Creates a notification for a specific user.
 * This is a fire-and-forget operation.
 * @param firestore - The Firestore instance.
 * @param userId - The ID of the user to notify.
 * @param payload - The notification content.
 */
export function createNotification(
    firestore: Firestore, 
    userId: string, 
    payload: NotificationPayload
): void {
    if (!userId) {
        console.error("No userId provided for notification.");
        return;
    }

    const notificationsCollection = collection(firestore, 'users', userId, 'notifications');
    
    const newNotification: Omit<Notification, 'id'> = {
        ...payload,
        createdAt: Timestamp.now(),
        isRead: false,
    };

    addDoc(notificationsCollection, newNotification).catch(error => {
        // We log the error but don't block the UI or show a toast,
        // as notifications are a background process.
        console.error("Error creating notification:", error);
    });
}
