// Client-side shape of a Cart and CartItem.
// Mirrors backend C# classes (camelCase keys after JSON serialization).

const LOCAL_KEY = 'programmier_bar-cart';

// Read the anonymous cart from localStorage. Always returns an array of {productId, quantity}.
export function readLocalCart() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Persist the anonymous cart to localStorage.
export function writeLocalCart(items) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items || []));
}

// Clear the anonymous cart (used after successful sync on login).
export function clearLocalCart() {
  localStorage.removeItem(LOCAL_KEY);
}

// Add to (or merge into) the anonymous cart. Mutates and persists.
export function addToLocalCart(productId, quantity = 1) {
  const items = readLocalCart();
  const existing = items.find((it) => it.productId === productId);
  if (existing) existing.quantity += quantity;
  else items.push({ productId, quantity });
  writeLocalCart(items);
  return items;
}

// Remove a product line from the anonymous cart.
export function removeFromLocalCart(productId) {
  const items = readLocalCart().filter((it) => it.productId !== productId);
  writeLocalCart(items);
  return items;
}

// Set the quantity of a product line in the anonymous cart (clamped to >= 1).
export function updateLocalCartQuantity(productId, quantity) {
  const qty = Math.max(1, Number(quantity) || 1);
  const items = readLocalCart();
  const existing = items.find((it) => it.productId === productId);
  if (existing) existing.quantity = qty;
  writeLocalCart(items);
  return items;
}

// Sum quantities across line items (works for both server cart.itemList and local cart).
export function totalItemCount(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
}
