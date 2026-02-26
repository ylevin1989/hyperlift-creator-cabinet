const html = `"edge_media_preview_like":{"count":2}`;
const likesMatch = html.match(/([\d,]+)\s*likes?/i) ||
    html.match(/([\d,]+)\s*отмет/i) ||
    html.match(/"edge_media_preview_like":\{"count":(\d+)\}/) ||
    html.match(/"like_count":(\d+)/);
console.log(likesMatch);
console.log(parseInt(likesMatch[1].replace(/\D/g, ''), 10));
