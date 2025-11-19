export const danbooruUtil = {
    // Date utility function
    getDaysAgo: (dateString: string): string => {
        const uploadDate = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - uploadDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "today";
        if (diffDays === 1) return "yesterday";
        if (diffDays < 30) return `${diffDays} days ago`;
        if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} ${months === 1 ? 'month' : 'months'} ago`;
        }
        const years = Math.floor(diffDays / 365);
        return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    },

    // Tag color utility
    getTagColor: (tag: string): "default" | "primary" | "secondary" | "success" | "error" | "info" | "warning" => {
        if (tag.startsWith("rating:")) return "warning";
        else if (tag.startsWith("order:")) return "info";
        else if (tag.startsWith("-")) return "error";
        else if (tag.includes("_")) return "primary";
        else if (tag.includes(":")) return "secondary";
        return "default";
    },

    // Category color utility
    getCategoryColor: (category: number): string => {
        switch (category) {
            case 0: // General
                return "#5E81F4"; // Soft blue
            case 1: // Artist
                return "#FF5D8F"; // Vibrant pink
            case 3: // Copyright
                return "#56C991"; // Mint green
            case 4: // Character
                return "#FFB74A"; // Soft orange
            case 5: // Meta
                return "#B388FF"; // Soft purple
            default:
                return "#94A3B8"; // Slate grey
        }
    },

    // Category name utility
    getCategoryName: (category: number): string => {
        switch (category) {
            case 0:
                return "General";
            case 1:
                return "Artist";
            case 3:
                return "Copyright";
            case 4:
                return "Character";
            case 5:
                return "Meta";
            default:
                return "Tag";
        }
    },
}