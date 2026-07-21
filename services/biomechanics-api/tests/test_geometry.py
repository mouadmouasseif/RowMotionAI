from app.services.geometry import calculate_angle
def test_right_angle(): assert calculate_angle((1,0),(0,0),(0,1))==90
def test_missing_point_is_null(): assert calculate_angle(None,(0,0),(0,1)) is None
def test_degenerate_is_null(): assert calculate_angle((0,0),(0,0),(0,1)) is None
