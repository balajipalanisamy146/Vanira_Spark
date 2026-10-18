export function formatCompactValue(value) {
    const valueText = String(value ?? "");
    const match = valueText.match(/^(\D*?)(-?\d[\d,]*(?:\.\d+)?)(\s*%?)$/);

    if (!match) {
        return value;
    }

    const amount = Number(match[2].replaceAll(",", ""));
    const magnitude = Math.abs(amount);

    if (!Number.isFinite(amount) || magnitude < 1000) {
        return value;
    }

    const [divisor, suffix] = magnitude >= 1_000_000_000
        ? [1_000_000_000, "B"]
        : magnitude >= 1_000_000
            ? [1_000_000, "M"]
            : [1_000, "K"];
    const compactAmount = (amount / divisor)
        .toFixed(1)
        .replace(/\.0$/, "");

    return `${match[1]}${compactAmount}${suffix}${match[3].trim()}`;
}

export function formatCompactCurrency(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
        return "₹0";
    }

    return `₹${formatCompactValue(amount)}`;
}