import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface ActivityEvent {
  type: "login" | "course_view" | "lesson_view" | "resource_download";
  details: string;
  timestamp: string;
}

export interface UserActivity {
  userId: string;
  lastLogin?: string;
  lastCourseViewed?: string;
  lastLessonViewed?: string;
  lastResourceViewed?: string;
  totalCoursesViewed: number;
  totalResourcesDownloaded: number;
  recentlyViewedCourses: string[]; // Course IDs
  recentlyViewedResources: string[]; // Resource IDs
  activityTimeline: ActivityEvent[];
}

const DEFAULT_ACTIVITY = (userId: string): UserActivity => ({
  userId,
  totalCoursesViewed: 0,
  totalResourcesDownloaded: 0,
  recentlyViewedCourses: [],
  recentlyViewedResources: [],
  activityTimeline: [],
});

export async function getUserActivity(userId: string): Promise<UserActivity> {
  try {
    const docRef = doc(db, "user_activity", userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_ACTIVITY(userId), ...snap.data() } as UserActivity;
    }
    return DEFAULT_ACTIVITY(userId);
  } catch (error) {
    console.error("Error getting user activity:", error);
    return DEFAULT_ACTIVITY(userId);
  }
}

export async function trackLogin(userId: string) {
  try {
    const activity = await getUserActivity(userId);
    const now = new Date().toISOString();
    
    // Prevent spamming logins in the timeline within the same minute
    const lastEvent = activity.activityTimeline[0];
    const isRecentLogin = lastEvent && lastEvent.type === "login" && 
      (new Date(now).getTime() - new Date(lastEvent.timestamp).getTime() < 60000);

    const timeline = isRecentLogin ? activity.activityTimeline : [
      { type: "login" as const, details: "Logged into portal", timestamp: now },
      ...activity.activityTimeline
    ].slice(0, 20); // Keep last 20 events

    await setDoc(doc(db, "user_activity", userId), {
      ...activity,
      lastLogin: now,
      activityTimeline: timeline
    }, { merge: true });
  } catch (error) {
    console.error("Error tracking login activity:", error);
  }
}

export async function trackCourseView(userId: string, courseId: string, courseTitle: string) {
  try {
    const activity = await getUserActivity(userId);
    const now = new Date().toISOString();

    const recentlyViewed = [courseId, ...activity.recentlyViewedCourses.filter(id => id !== courseId)].slice(0, 5);
    
    // Increments total courses viewed if it's the first time viewing this course
    const isNewView = !activity.recentlyViewedCourses.includes(courseId);
    const totalViewed = isNewView ? activity.totalCoursesViewed + 1 : activity.totalCoursesViewed;

    const timeline = [
      { type: "course_view" as const, details: `Opened course: ${courseTitle}`, timestamp: now },
      ...activity.activityTimeline
    ].slice(0, 20);

    await setDoc(doc(db, "user_activity", userId), {
      ...activity,
      lastCourseViewed: courseId,
      recentlyViewedCourses: recentlyViewed,
      totalCoursesViewed: totalViewed,
      activityTimeline: timeline
    }, { merge: true });
  } catch (error) {
    console.error("Error tracking course view:", error);
  }
}

export async function trackLessonView(userId: string, courseId: string, lessonId: string, lessonTitle: string) {
  try {
    const activity = await getUserActivity(userId);
    const now = new Date().toISOString();

    const timeline = [
      { type: "lesson_view" as const, details: `Viewed lesson: ${lessonTitle}`, timestamp: now },
      ...activity.activityTimeline
    ].slice(0, 20);

    await setDoc(doc(db, "user_activity", userId), {
      ...activity,
      lastCourseViewed: courseId,
      lastLessonViewed: lessonId,
      activityTimeline: timeline
    }, { merge: true });
  } catch (error) {
    console.error("Error tracking lesson view:", error);
  }
}

export async function trackResourceView(userId: string, resourceId: string, resourceTitle: string) {
  try {
    const activity = await getUserActivity(userId);
    const now = new Date().toISOString();

    const recentlyViewed = [resourceId, ...activity.recentlyViewedResources.filter(id => id !== resourceId)].slice(0, 5);

    // Increments total resource views if it's the first time viewing this resource
    const isNewDownload = !activity.recentlyViewedResources.includes(resourceId);
    const totalDownloads = isNewDownload ? activity.totalResourcesDownloaded + 1 : activity.totalResourcesDownloaded;

    const timeline = [
      { type: "resource_download" as const, details: `Accessed resource: ${resourceTitle}`, timestamp: now },
      ...activity.activityTimeline
    ].slice(0, 20);

    await setDoc(doc(db, "user_activity", userId), {
      ...activity,
      lastResourceViewed: resourceId,
      recentlyViewedResources: recentlyViewed,
      totalResourcesDownloaded: totalDownloads,
      activityTimeline: timeline
    }, { merge: true });
  } catch (error) {
    console.error("Error tracking resource view:", error);
  }
}
