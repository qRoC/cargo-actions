// This file is part of the cargo-actions.
//
// Copyright (c) Andrii Savytskyi <contact@qroc.pro>
//
// For the full copyright and license information, please view
// the LICENSE file that was distributed with this source code.

use std::ops::Add;

#[derive(Debug, PartialEq)]
pub struct Vec3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

impl Vec3 {
    pub fn new(x: f32, y: f32, z: f32) -> Vec3 {
        Vec3 {
            x,
            y,
            z,
        }
    }
}

impl Add<Vec3> for Vec3 {
    type Output = Vec3;

    /// ```
    /// assert_eq!(1 + 2, 3);
    /// ```
    fn add(self, other: Vec3) -> Vec3 {
        Vec3 {
            x: self.x + other.x,
            y: self.y + other.y,
            z: self.z + other.z,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add() {
        let a = Vec3::new(0.0, 1.0, 2.0a);
        let b = Vec3::new(3.0, 4.0, 5.0);
        assert_eq!(a + b, Vec3::new(3.0, 5.0, 7.0));
    }
}
