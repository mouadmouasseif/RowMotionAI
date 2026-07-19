export interface Point2D { x: number; y: number }
export function calculateDistance(a: Point2D, b: Point2D) { return Math.hypot(a.x - b.x, a.y - b.y); }
export function calculateAngle(a: Point2D, b: Point2D, c: Point2D) { const ab = Math.atan2(a.y - b.y, a.x - b.x); const cb = Math.atan2(c.y - b.y, c.x - b.x); let angle = Math.abs((cb - ab) * 180 / Math.PI); if (angle > 180) angle = 360 - angle; return angle; }
export function calculateSymmetry(left: number, right: number) { const maximum = Math.max(Math.abs(left), Math.abs(right), 1); return Math.max(0, 100 - Math.abs(left - right) / maximum * 100); }
