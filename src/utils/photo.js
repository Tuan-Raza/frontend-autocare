import { API_URL } from "../config";

/**
 * Returns a valid full image URI for user profile photos or vehicle images.
 * Handles relative backend paths (/uploads/...), full URLs (http...), data URLs (data:...), and web blob URIs (blob:...).
 */
export function getPhotoUrl(uri) {
    if (!uri || typeof uri !== "string") return null;
    const trimmed = uri.trim();

    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("data:") ||
        trimmed.startsWith("blob:")
    ) {
        return trimmed;
    }

    if (trimmed.startsWith("/")) {
        return `${API_URL}${trimmed}`;
    }

    return `${API_URL}/${trimmed}`;
}
