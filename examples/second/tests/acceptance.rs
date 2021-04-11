// This file is part of the fibiol.com.
//
// (c) Andrey Savitsky <contact@qroc.pro>

use second::Vec3;

#[test]
fn vec3_add() {
    let a = Vec3::new(0.0, 1.0, 2.0);
    let b = Vec3::new(3.0, 4.0, 5.0);
    assert_eq!(a + b, Vec3::new(3.0, 5.0, 54.0));
}
