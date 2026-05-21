// 1. Sanitize HTML Strings (Security requirement against XSS)
export function sanitizeHTML(str) {
    if (!str) return "";
    const temp = document.createElement("div");
    temp.textContent = str;
    return temp.innerHTML;
}

// 2. Relative Time and Human-Readable Date Formatter
export function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if valid date
    if (isNaN(date.getTime())) return dateString;

    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Formatting time helper
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const formattedTime = date.toLocaleTimeString('en-US', timeOptions);

    // If today
    if (date.toDateString() === now.toDateString()) {
        return `Today, ${formattedTime}`;
    }
    
    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${formattedTime}`;
    }

    // Within last 7 days
    if (diffDays < 7 && diffDays > 0) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `${days[date.getDay()]}, ${formattedTime}`;
    }

    // Default fully formatted date (e.g. Oct 24, 2023)
    const options = { month: 'short', day: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// 3. Category Slug Mapper to FontAwesome CSS Icon Classes
export function getCategoryIcon(slug) {
    const icons = {
        "electronics": "fa-solid fa-laptop",
        "accessories": "fa-solid fa-clock",
        "documents": "fa-solid fa-id-card",
        "clothing": "fa-solid fa-tshirt",
        "keys": "fa-solid fa-key",
        "books-stationery": "fa-solid fa-book",
        "others": "fa-solid fa-box"
    };

    return icons[slug] || "fa-solid fa-box";
}

// 4. Custom Unique Item Reference Generator (lost/found trackers)
export function generateRefId(type) {
    const prefix = type === "lost" ? "LST" : "FD";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `#${prefix}-${randomNum}`;
}

// 5. Shorten Description Text to a max length (with ellipses)
export function truncateText(text, maxLength = 80) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
}

// 6. Time Ago Calculator (e.g. '10 mins ago', '1 hour ago')
export function timeAgo(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    
    const diffSeconds = Math.floor((now - date) / 1000);
    if (diffSeconds < 60) return "Just now";
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
