// This file is part of the cargo-actions.
//
// Copyright (c) Andrii Savytskyi <contact@qroc.pro>
//
// For the full copyright and license information, please view
// the LICENSE file that was distributed with this source code.

use second::Vec3;

#[test]
fn vec3_add() {
    let a = Vec3::new(0.0, 1.0, 2.0);
    let b = Vec3::new(3.0, 4.0, 5.0);
    assert_eq!(a + b, Vec3::new(3.0, 5.0, 7.0));
}
