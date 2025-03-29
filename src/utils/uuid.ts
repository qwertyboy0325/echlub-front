/**
 * UUID Generator
 * Provides a consistent way to generate UUIDs across the application
 */
export class UUIDGenerator {
    /**
     * Generate a new UUID
     * Falls back to a timestamp-based UUID if crypto.randomUUID is not available
     */
    static generate(): string {
        try {
            return crypto.randomUUID();
        } catch (error) {
            // Fallback to timestamp-based UUID
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substring(2, 15);
            return `${timestamp}-${random}-${random}-${random}-${timestamp}${random}`;
        }
    }
} 