/**
 * Check if a video is vertical based on platform and URL
 */
export function isVerticalVideo(
  videoPlatform: string,
  videoUrl: string
): boolean {
  // Explicitly vertical platforms
  if (["youtube_short", "tiktok", "instagram"].includes(videoPlatform)) {
    return true;
  }

  // URL-based detection
  if (videoUrl.includes("youtube.com/shorts/") || videoUrl.includes("youtu.be/shorts/")) {
    return true;
  }
  if (videoUrl.includes("tiktok.com")) {
    return true;
  }
  if (videoUrl.includes("instagram.com/reel")) {
    return true;
  }

  return false;
}

/**
 * Get a readable platform label
 */
export function getPlatformLabel(videoPlatform: string): string {
  switch (videoPlatform) {
    case "youtube":
      return "YouTube";
    case "youtube_short":
      return "YouTube Short";
    case "vimeo":
      return "Vimeo";
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    default:
      return "Other";
  }
}
