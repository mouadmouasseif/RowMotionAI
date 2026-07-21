import math
from typing import Sequence
def calculate_angle(point_a: Sequence[float] | None, point_b: Sequence[float] | None, point_c: Sequence[float] | None) -> float | None:
    if point_a is None or point_b is None or point_c is None: return None
    ab=(point_a[0]-point_b[0],point_a[1]-point_b[1]); cb=(point_c[0]-point_b[0],point_c[1]-point_b[1])
    denominator=math.hypot(*ab)*math.hypot(*cb)
    if denominator == 0: return None
    return math.degrees(math.acos(max(-1.0,min(1.0,(ab[0]*cb[0]+ab[1]*cb[1])/denominator))))
